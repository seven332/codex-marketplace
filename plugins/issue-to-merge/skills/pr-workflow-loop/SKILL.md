---
name: pr-workflow-loop
description: 通过重复的、可 merge 的 PR 级工作流循环交付宽泛的 GitHub issue 或仓库工作队列，保留进度，并在完成门禁通过后关闭绑定 parent 的交付 issue。仅当用户明确请求多 PR merge 循环时使用。
---

# PR Workflow Loop

将运行本 skill 的明确请求视为批准正常 merge 每个达到当前 head 就绪状态的 PR。
在绑定 parent 模式下，它还授权在完成门禁通过后将交付 parent 关闭为已完成，
除非用户明确要求保持其开放。此权限在仓库队列模式下不适用。它不授权 admin 绕过、
破坏性清理、普通的 `git push --force`，或当前迭代 `rebase-default-branch` 流程之外的
历史重写。该流程可以 rebase 当前 PR branch 并用 `git push --force-with-lease` 更新
同一远端 branch，无需单独批准。

如果进度或完成评论需要本地命令载荷，阅读并遵循
[仓库工作文件契约](../../references/repository-work-files.md)，并将其创建在
`<codex-work>/tmp/issue-to-merge/pr-workflow-loop/` 下。不要创建操作系统临时文件。

## Workflow

1. 确定并保留一种 loop 模式：
   - **绑定 parent 交付：** 当请求指明一个宽泛 issue，或 `pr-workflow` 发现
     所选 issue 需要多个 PR 时使用。保留该 issue 作为交付 parent，并在其
     请求范围仍未完成时不要切换到无关的仓库工作。
   - **仓库队列：** 仅当请求明确要求处理仓库范围或无界工作队列时使用。
     在每次 merge 后重新评估符合条件的 issue。
2. 建立持久化交付上下文。对于绑定 parent 的 loop，获取：
   ```bash
   gh issue view <parent-issue> \
     --json number,title,body,state,stateReason,closedAt,updatedAt,labels,comments,parent,subIssues,subIssuesSummary,blockedBy,blocking,url
   ```
   在解读或去重工作流标记之前，用
   `gh api user --jq '.login'` 解析已认证身份。可信的工作流标记必须是评论中第一个非空白
   行，并且完全匹配预期的语法。默认情况下，其评论必须满足
   `viewerDidAuthor: true` 且 `author.login` 等于该身份。仓库指引可以指定
   另一个精确的可信标记产生者；泛化的 `authorAssociation`、写权限或
   匹配的标记文本都不够。通过 GraphQL 查询缺失的评论来源信息，
   并在时间线排序、复用、去重、进度和完成判定中忽略不可信的类标记文本。
   检查当前的 Plan 和 Challenge 标记、子项状态、原生 `blockedBy` 关系、
   关联的 PR，以及先前记录的进度。如果 parent 缺少经过质疑的有效交付方向，
   先运行其 framing checkpoint、规划和 Plan checkpoint，再选择子项。
   仅当先前的 `:complete` 标记晚于最新的 parent 实质性更新和当前 Plan 与 Challenge
   记录，且仍覆盖已接受的切片集合时，才把它视为当前有效。在重新打开、重新定框、
   重新规划或新增交付工作之后，忽略过期的完成标记。切勿仅仅因为本地上下文丢失
   就重新创建已有切片或重启已 merge 的迭代。
   如果已接受的工作现在未完成而 parent 仍保持关闭，检查最新的 issue
   关闭事件。仅当存在可信的先前完成标记、
   该关闭事件晚于该标记、其操作者匹配已认证身份，且之后有实质性更新使该标记过期时，
   才重新打开并验证 parent。对于任何其他关闭状态不匹配的 parent，停下等待指示，
   而不是悄悄重新打开它。
3. 选择下一次迭代：
   - 在绑定 parent 模式下，使用 `issue-select` 选择一个开放、无阻塞、前置条件
     已完成的子项。仅当没有现有子项代表某个受支持的切片时才落实它。
     保持在 parent 目标之内；更高优先级的无关 issue 不是有效的替代。
   - 在仓库队列模式下，在请求范围内选择最佳的、符合条件的 PR 级 issue。
   - 在选择新 sibling 之前，先恢复子项现有的开放 PR。保持迭代串行，
     除非用户明确要求并行交付策略且切片之间确实相互独立。
   - 在绑定 parent 模式下，如果没有就绪的子项但 parent 验收标准仍未满足，
     查明是缺失切片、未解决依赖还是人工决定造成了缺口。
     不要仅凭空的子项列表宣布完成。
4. 每次迭代，针对恰好一个 PR 级实现 issue 运行 `pr-workflow`，merge
   批准由本次 loop 调用提供。不要绕过规划、质疑、实现、
   当前 head 审查、反馈、CI 或 merge 状态检查。确保 PR 只关闭那个
   实现 issue，而不是其交付 parent。
5. 在同一迭代内修复可恢复的范围内问题，并重复当前 head 审查
   循环。当工作流需要实质性人工决定或无法 merge 当前 PR 时停下。
6. 每次成功 merge 之后：
   - 使用 `sync-default-branch`；
   - 验证 PR 已 merge，然后重新获取实现 issue 并确认其验收
     标准、parent、依赖、`state` 和 `stateReason`；
   - 当迭代记录的关闭语义表明已 merge 的 PR 完成了那个确切的
     实现 issue 但它仍然开放时，重新检查目标 branch、关闭引用和
     验收标准。用
     `gh issue close <implementation-issue-url> --reason completed` 关闭它，然后重新获取并验证
     `state` 为 `CLOSED` 且 `stateReason` 为 `COMPLETED`。不要关闭有意不关闭的
     release、backport 或部分交付 issue；
   - 对于记录为完成其实现 issue 的迭代，要求那个确切的 issue
     处于 `CLOSED` 且 `stateReason` 为 `COMPLETED`，才能记录 parent 进度。除非当前经过质疑的 plan
     明确以理由替换或移除了该切片，否则把其他任何关闭原因视为状态不匹配；
   - 当实现 issue 有交付 parent 时，重新获取该 parent 及其
     `subIssuesSummary`，检查其评论中是否已有匹配的标记，然后仅当标记缺失时
     为该 PR 发布一条 parent 进度评论：
     ```markdown
     <!-- codex-marketplace:pr-workflow-loop:issue-<parent>:pr-<pr>:merged -->
     ## Delivery Progress

     <merged child and PR, validation outcome, completed slices, remaining or blocked slices,
     and the next eligible slice>
     ```
   对于独立的仓库队列 issue，跳过仅针对 parent 的动作。仅当证据实质性地改变了
   parent plan 的方向、切片、依赖或验收标准时才更新并重新质疑它；
   避免对正文做无实质意义的改动。
7. 在宣布绑定 parent 的交付完成之前，对照当前默认 branch 和 GitHub 状态验证以下
   所有条件。把本次验证所用的远端默认 branch head OID 记录为
   完成门禁快照的一部分：
   - 每个已接受的交付切片都由一个以 `COMPLETED` 原因关闭的 issue 代表，或
     者已被明确替换或移除并记录了理由；
   - 请求的交付范围内没有残留的开放或被阻塞的子项；
   - merge 结果满足 parent 的验收标准，包括适用时的跨切片测试、
     文档、兼容性、迁移、集成和上线工作；并且
   - 没有残留的未解决 parent 评论、待决决定、阻塞标记或过期的 Plan/Challenge 状态。
   如果某个验收标准未满足，且交付方向必须改变，返回 parent 规划和质疑，
   然后用 `issue-select` 选择另一个连贯的切片；对于任何必需的人工决定，停下等待，
   而不是把 parent 标记为完成。
8. 在绑定 parent 模式下，完成门禁通过后，立即重新获取远端
   默认 branch head OID 和步骤 2 的完整 parent 快照，包括其评论、当前
   Plan 和 Challenge 记录、子项、依赖、`updatedAt`、`state` 和 `stateReason`。
   把它们与步骤 7 通过时依据的完成门禁快照比较。如果 head OID 或任何
   parent 快照字段发生变化，在发布或复用完成标记之前重新运行完成门禁。
   否则，检查现有 parent 评论，除非当前标记已记录了相同的经过质疑的 plan、已接受的切片集合和
   完成证据，否则发布完成总结。较旧的标记不会在 parent 实质性变化后压制更新过的总结：
   ```markdown
   <!-- codex-marketplace:pr-workflow-loop:issue-<parent>:complete -->
   ## Delivery Complete

   <merged children and PRs, final validation, acceptance evidence, and remaining risks>
   ```
   在发布或复用该总结之后，立即重新获取远端默认 branch head OID
   和同一份完整 parent 快照。仅忽略本次运行刚发布的完成评论带来的预期更新；
   如果 head OID 或其他任何内容发生变化，重新运行完成门禁，
   而不是关闭过期状态。如果 parent 处于开放状态且用户没有明确要求保持其开放，
   关闭并验证它：
   ```bash
   gh issue close <parent-issue-url> --reason completed
   gh issue view <parent-issue-url> \
     --json number,title,body,state,stateReason,closedAt,updatedAt,labels,comments,parent,subIssues,subIssuesSummary,blockedBy,blocking,url
   ```
   要求 `state` 为 `CLOSED` 且 `stateReason` 为 `COMPLETED`，重新获取远端
   默认 branch head OID，并将两项结果与关闭前快照比较。仅忽略
   本次运行关闭操作导致的 `state`、`stateReason`、`closedAt` 和 `updatedAt` 的预期变化。
   如果 head OID 发生变化，或在关闭进行期间其他实质性变化使步骤 7 失效，
   立即补偿：
   ```bash
   gh issue reopen <parent-issue-url>
   gh issue view <parent-issue-url> --json state,stateReason,closedAt,url
   ```
   要求 parent 处于 `OPEN`，然后重新运行完成门禁。如果重新打开或验证失败，停下并报告
   状态不匹配。仅当关闭原因为 `COMPLETED` 时才把已关闭的 parent 视为完成；
   把其他任何关闭原因报告为状态不匹配。当用户明确要求保持 parent 开放时，
   改为报告其已验证为可关闭。在仓库队列模式下，把每个 PR 的进度保留在受影响的
   parent 上，但不要从队列耗尽推断 parent 完成；跳过 parent 完成总结和 parent 关闭，
   然后继续在队列范围内选择。
9. 当请求的范围通过其完成门禁且每个已授权的终态 issue
   状态变更都已验证时停下；也在当前 issue 或 PR 被阻塞、有用的拆分被阻塞、
   队列模式下没有合适工作残留、必需的 merge 未获授权，或迭代留下
   未 merge 的 PR 时停下。

## Related Skills

- 对每个单 PR 迭代使用 `pr-workflow`。
- 在每次迭代内使用 `issue-select` 选择一个 PR 级 issue，并保留交付
  parent、sibling 和依赖上下文。
