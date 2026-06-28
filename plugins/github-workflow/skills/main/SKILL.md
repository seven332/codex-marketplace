---
name: main
description: Switch to the repository default branch and pull the latest remote changes.
---

# Main Branch

Use this skill when the user asks to switch back to the default branch, update the base branch, or
return to a clean base after PR work.

## Workflow

1. Check working-tree state with `git status --short --branch`.
2. If there are uncommitted changes, stop and ask how to handle them.
3. Detect the default branch:
   ```bash
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
   ```
   Stop if the command fails or returns an empty value; do not guess a branch name.
4. Switch to the default branch with `git switch "$DEFAULT_BRANCH"`.
5. Pull the latest remote changes with `git pull --ff-only`.
6. Report the latest commit and whether the pull fast-forwarded.

Do not stash, discard, amend, reset, or force-push unless the user explicitly asks.
