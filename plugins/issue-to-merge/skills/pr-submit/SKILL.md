---
name: pr-submit
description: 提交并推送预期的本地改动，然后为当前 branch 创建或更新 GitHub pull request。在提交实现工作、开 PR，或在修复后刷新现有 PR 时使用。
---

# PR Submit

负责已验证本地改动与已提交 pull request 之间的边界。不要在本 skill 中审查或
merge PR。

## Workflow

1. 检查仓库状态：
   ```bash
   git status --short --branch
   git branch --show-current
   git diff
   git diff --cached
   ```
   如果存在无关的未提交改动，或预期文件不明确，则停下。
2. 检测仓库默认 branch：
   ```bash
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
   ```
   如果检测失败或返回空值则停下。从明确的请求、现有 PR 或仓库工作流中
   选择预期的目标 branch；否则使用默认 branch。不要猜测或悄悄
   改变现有 PR 的目标。
3. 用
   `gh pr view --json number,state,mergedAt,url,baseRefName,headRefName,headRefOid` 判断当前 branch 是否已有 PR。
   把没有 PR 当作正常的创建场景处理。
   - 如果当前位于预期的目标 branch 且有本地改动，在 commit 之前先创建名为
     `<type>/<short-description>` 的 feature branch。
   - 如果该 branch 有开放的 PR，更新该 PR。
   - 如果该 branch 属于已关闭或已 merge 的 PR，停下并询问是重新打开它还是创建
     新 branch。不要悄悄复用已完成 PR 的状态。
4. 确认仓库指引要求的验证已针对当前确切的 worktree 通过。
   复用来自 `issue-implement`、`pr-self-review` 或紧接在前的其他步骤的新鲜结果；
   运行缺失或过期的命令。如果没有记录任何命令，检查
   package 脚本、语言工具链、CI 和附近的测试，选择范围最窄的可信检查。
5. 只暂存预期文件，并检查暂存的 diff。当需要 commit 时，用 Conventional
   Commit 消息提交暂存的改动：
   ```text
   <type>[optional scope]: <description>
   ```
   不要修改现有 commit。如果没有新改动，仅当 branch 上还有
   需要推送或提交的 commit，或现有 PR 需要一次已授权的元数据刷新时才继续。
6. 推送当前 branch。首次推送时设置其 upstream。不要在本 skill 中强制推送；
   把必需的 rebase 和 lease 保护的远端 branch 更新委托给
   `rebase-default-branch`。
7. 创建或更新 PR：
   - 当任一操作需要 PR 正文时，阅读并遵循
     [仓库工作文件契约](../../references/repository-work-files.md)，按该契约的
     文件系统工具规则在 `<codex-work>/tmp/issue-to-merge/pr-submit/` 下创建唯一的正文
     文件，并将其解析后的路径用作 `PR_BODY_FILE`。内容包括变更的
     行为、明确的排除项，以及实际运行过的验证命令。对于有 issue 支撑的工作，
     关联由 `issue-implement` 提供的准确实现 issue。仅当本 PR 完成该 issue
     且 GitHub 会对目标 branch（通常是仓库默认 branch）应用关闭关键词时，才使用
     `Closes #<implementation-issue>`。对于关闭语义不适用的 release、backport 或其他目标
     branch，使用不触发关闭的 `Relates to #<implementation-issue>` 链接。当实现 issue 有
     交付 parent 时，将 parent 作为上下文关联，但不带关闭关键词。切勿从一个子 PR
     关闭伞形 parent。
   - 对于现有的开放 PR，验证其 base 是预期的目标 branch。仅当正文的
     总结、范围、issue 链接或验证记录实质性过期时才更新正文。用
     `gh pr edit <pr-number> --body-file "$PR_BODY_FILE"` 提交更新后的正文。
   - 对于新 PR，使用仓库的 PR 标题约定，或在没有约定时使用简洁的 Conventional
     Commit 风格标题。按上述方式准备 `PR_BODY_FILE`，然后创建 PR：
     ```bash
     gh pr create --base "$TARGET_BRANCH" --head "$BRANCH" --title "<title>" --body-file "$PR_BODY_FILE"
     ```
   如果创建了 `PR_BODY_FILE`，在成功创建或更新之后，或在失败的尝试不再重试时
   删除它。
   切勿为同一 branch 创建重复的 PR。
8. 获取已提交 PR 的状态：
   ```bash
   gh pr view --json number,url,headRefOid,baseRefName,headRefName,closingIssuesReferences
   ```
   返回 PR 编号、URL、当前 `headRefOid`、关联的实现 issue，以及存在时的交付
   parent。说明该操作是创建了 PR、用新 commit 更新了 PR，还是仅刷新了元数据。
   在交接之前，验证有 issue 支撑的 PR 不会意外关闭其 parent 或无关的 sibling，
   并且在应当应用关闭语义时，预期的实现 issue 已出现。

## Related Skills

- 使用 `issue-implement` 在提交之前产生并验证本地改动。
- 在已提交的 PR 反映最新本地改动之后使用 `pr-self-review`。
- 仅在所有审查和就绪检查完成之后使用 `pr-merge`。
