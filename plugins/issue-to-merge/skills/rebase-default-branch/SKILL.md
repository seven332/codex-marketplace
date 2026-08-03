---
name: rebase-default-branch
description: 将当前 feature branch rebase 到最新的仓库默认 branch，解决冲突，并用 force-with-lease 安全更新其已推送的 branch。当需要更新一个活跃 branch 或解决 PR merge 冲突时使用。
---

# Rebase Default Branch

## 工作流

1. 用 `git status --short --branch` 检查当前 branch 与工作树。
2. 存在未提交改动时拒绝 rebase。询问用户希望如何处理；
   不要自动 stash 或丢弃。
3. 检测默认 branch：
   ```bash
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
   ```
   检测失败或返回空值时停止。不要猜测 branch 名称。
4. 如果当前 branch 就是默认 branch，停止。解析默认 branch 配置的上游
   与远端，而不是假设远端名为 `origin`：
   ```bash
   DEFAULT_UPSTREAM=$(git rev-parse --abbrev-ref "$DEFAULT_BRANCH@{upstream}" 2>/dev/null)
   DEFAULT_REMOTE=$(git config --get "branch.$DEFAULT_BRANCH.remote")
   ```
   任一值为空时停止。不要猜测远端或 rebase 目标。用
   `git fetch "$DEFAULT_REMOTE"` 拉取已配置的远端。
5. 用 `git rebase "$DEFAULT_UPSTREAM"` 进行 rebase。
6. 对每个冲突：
   - 理解双方的预期行为；
   - 直接编辑冲突文件时遵循
     [文件系统工具规则](../../references/repository-work-files.md#filesystem-tools)；
   - 编辑文件以保留正确的合并行为；
   - 只用 `git add` 暂存已解决的文件；并
   - 用 `git rebase --continue` 继续，直到完成。
7. 运行仓库指引要求的相关验证。
8. 如果当前 branch 已经推送过，用
   `git push --force-with-lease` 更新同一远端 branch。运行本 skill 的请求，或活动的 `pr-workflow` 或
   `pr-workflow-loop`，即视为对 rebase 与这次受 lease 保护的更新的授权；
   不要单独征求批准。在 push 后重新获取 PR 状态。如果 lease 拒绝了更新，停止、
   重新获取并重新评估远端变更，而不是改用 `--force` 重试。

未经明确批准，不要使用 `git reset --hard`、`git push --force`、绕过冲突或丢弃
改动。
