---
name: sync-default-branch
description: Switch to the repository default branch and fast-forward it to the latest remote state. Use before starting new work or after a pull request is merged.
---

# Sync Default Branch

## Workflow

1. Check working-tree state with `git status --short --branch`.
2. If uncommitted changes are present, stop and ask how to handle them.
3. Detect the default branch:
   ```bash
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
   ```
   Stop if detection fails or returns an empty value. Do not guess a branch name.
4. Switch with `git switch "$DEFAULT_BRANCH"`.
5. Pull with `git pull --ff-only`.
6. Report the latest commit and whether the branch fast-forwarded.

Do not stash, discard, amend, reset, or force-push unless the user explicitly asks.
