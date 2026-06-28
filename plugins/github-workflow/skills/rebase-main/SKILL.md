---
name: rebase-main
description: Rebase the current branch onto the latest default branch and resolve conflicts carefully.
---

# Rebase Main

Use this skill when the user asks to update the current feature branch on top of the default branch.

## Workflow

1. Check the branch and working tree with `git status --short --branch`.
2. Refuse to rebase if any uncommitted changes are present. Ask the user whether to commit,
   shelve, or discard them before continuing.
3. Detect the default branch:
   ```bash
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
   ```
   Stop if the command fails or returns an empty value; do not guess a branch name.
4. Fetch latest default branch: `git fetch origin "$DEFAULT_BRANCH"`.
5. Rebase: `git rebase "origin/$DEFAULT_BRANCH"`.
6. If conflicts occur:
   - Inspect each conflicted file and understand both sides.
   - Edit to preserve the intended behavior from both branches.
   - Stage resolved files with `git add`.
   - Continue with `git rebase --continue`.
   - Repeat until complete.
7. Run the most relevant validation commands from the repository docs.
8. Push with `git push --force-with-lease` only after the user has asked to update the remote
   branch or after confirming that the branch already belongs to the active PR.

Do not use `git reset --hard` or discard changes without explicit user approval.
