---
name: rebase-default-branch
description: Rebase the current feature branch onto the latest repository default branch and resolve conflicts carefully. Use when updating an active branch or resolving a PR merge conflict.
---

# Rebase Default Branch

## Workflow

1. Check the current branch and working tree with `git status --short --branch`.
2. Refuse to rebase when uncommitted changes are present. Ask how the user wants to handle them;
   do not stash or discard automatically.
3. Detect the default branch:
   ```bash
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
   ```
   Stop if detection fails or returns an empty value. Do not guess a branch name.
4. Stop if the current branch is the default branch. Fetch its latest remote state with
   `git fetch origin "$DEFAULT_BRANCH"`.
5. Rebase with `git rebase "origin/$DEFAULT_BRANCH"`.
6. For each conflict:
   - understand the intended behavior on both sides;
   - edit the file to preserve the correct combined behavior;
   - stage only resolved files with `git add`; and
   - continue with `git rebase --continue` until complete.
7. Run the relevant validation required by repository guidance.
8. A pushed branch now requires a history rewrite. Use `git push --force-with-lease` only when the
   user explicitly authorized updating that remote PR branch. Re-fetch PR state after the push.

Do not use `git reset --hard`, bypass conflicts, or discard changes without explicit approval.
