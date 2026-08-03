---
name: sync-default-branch
description: 切换到仓库默认 branch 并将其快进到最新远端状态。在开始新工作之前或 pull request 合并之后使用。
---

# Sync Default Branch

## 工作流

1. 用 `git status --short --branch` 检查工作树状态。
2. 如果存在未提交改动，停下来询问如何处理。
3. 检测默认 branch：
   ```bash
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
   ```
   检测失败或返回空值时停止。不要猜测 branch 名称。
4. 用 `git switch "$DEFAULT_BRANCH"` 切换。
5. 用 `git pull --ff-only` 拉取。
6. 报告最新的 commit 以及 branch 是否完成了快进。

不要在本 skill 中 stash、丢弃、amend、reset 或强制推送。
