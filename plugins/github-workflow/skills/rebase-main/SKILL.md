---
name: rebase-main
description: Rebase the current branch onto the latest origin/main and resolve conflicts carefully.
---

# Rebase Main

Use this skill when the user asks to update the current feature branch on top of `main`.

## Workflow

1. Check the branch and working tree with `git status --short --branch`.
2. Refuse to rebase if unrelated uncommitted changes are present.
3. Fetch latest main: `git fetch origin main`.
4. Rebase: `git rebase origin/main`.
5. If conflicts occur:
   - Inspect each conflicted file and understand both sides.
   - Edit to preserve the intended behavior from both branches.
   - Stage resolved files with `git add`.
   - Continue with `git rebase --continue`.
   - Repeat until complete.
6. Run the most relevant validation commands from the repository docs.
7. Push with `git push --force-with-lease` only after the user has asked to update the remote
   branch or after confirming that the branch already belongs to the active PR.

Do not use `git reset --hard` or discard changes without explicit user approval.
