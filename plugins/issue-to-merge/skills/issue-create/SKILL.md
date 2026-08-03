---
name: issue-create
description: 从对话上下文、bug 报告、功能请求或已批准的多 PR 交付切片，为当前 GitHub 用户创建并指派清晰的独立 issue 或与父项关联的 issue。
---

# Issue Create

当用户要求从对话、bug 报告、功能请求、调研或任务创建 GitHub issue 时，使用本 skill。

## Operations

- `create`：从当前对话上下文综合生成一个 issue。
- `bug`：创建一份可复现的 bug 报告。
- `feature`：创建一份带验收标准的功能请求。

## Workflow

1. 分析对话和仓库上下文：
   - 正在跟踪什么问题、任务或机会？
   - 哪些决策、约束、文件和示例重要？
   - 还有什么未知？
   - 这是一个独立 issue，还是带有父项和前置 issues 的交付切片？
2. 当必要细节缺失时，提出简明的澄清问题。不要虚构复现步骤、优先级、用户影响
   或验收标准。
3. 在合适时使用 Conventional Commit 风格的前缀起草 issue 标题：
   - `feat:`、`bug:`、`docs:`、`refactor:`、`test:`、`chore:`、`perf:`
   - 使用小写描述，结尾不加句号。
4. 解析当前 GitHub 用户，无法确定时停止：
   ```bash
   CURRENT_USER=$(gh api user --jq '.login')
   ```
   将每个新创建的 issue 指派给该用户。不要以作者身份替代指派。
5. 阅读并遵循
   [repository work-file contract](../../references/repository-work-files.md)。
   按该约定的文件系统工具规则，在 `<codex-work>/tmp/issue-to-merge/issue-create/`
   下创建唯一的 issue 正文文件，并将其解析后的路径用作 `ISSUE_BODY_FILE`。
   在那里起草正文。结构按 issue 情况调整，但优先采用：
   - 背景
   - 问题或需求
   - 验收标准或复现步骤
   - 相关文件、链接、日志、截图或决策
   - 当这属于多 PR 交付时：父项目标、切片边界、依赖，以及有意延后的兄弟工作
   - 待解决的问题
6. 如果仓库中存在合适的 labels 则选择，例如 `bug`、`enhancement`、`documentation`、
   `tech-debt` 或 `question`。没有合适 label 时省略 labels。
7. 使用与其已验证关系匹配的形式创建 issue。传入由 `issue-select` 提供的父项和
   依赖上下文；不要从相似标题推断关系：
   ```bash
   # 不带 labels
   gh issue create --title "<title>" --body-file "$ISSUE_BODY_FILE" --assignee "$CURRENT_USER"

   # 带所选 labels
   gh issue create --title "<title>" --body-file "$ISSUE_BODY_FILE" \
     --assignee "$CURRENT_USER" --label "<label-1>,<label-2>"

   # 作为交付切片；没有前置依赖时省略 --blocked-by
   gh issue create --title "<title>" --body-file "$ISSUE_BODY_FILE" \
     --assignee "$CURRENT_USER" --parent <parent-issue> \
     --blocked-by <prerequisite-issue-numbers>
   ```
8. 验证 GitHub 已记录指派和所有预期关系：
   ```bash
   gh issue view <issue-number> --json number,url,assignees,parent,blockedBy
   ```
   在将 issue 交给规划之前，停止并修复缺失的当前用户指派或已授权的关系。
   返回 issue 编号、URL、指派人、父项和依赖。
9. 创建成功后，或失败的尝试不再重试时，删除 issue 正文文件。不要不必要地把
   issue 内容留在临时文件中。

## Bug Reports

包含观察到的行为、预期行为、复现步骤、环境细节、错误信息和影响。如果复现
不确定，明确说明这一点。

## Feature Requests

描述用户价值和行为，而不是实现。验收标准应可测试。
