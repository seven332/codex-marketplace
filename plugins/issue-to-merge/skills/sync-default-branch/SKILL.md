---
name: sync-default-branch
description: Switch to the repository default branch and fast-forward it to the latest remote state. Use before starting new work or after a pull request is merged.
---

# Sync Default Branch

## Workflow

1. Check working-tree state with `git status --short --branch`.
2. Read and follow the [current-workspace contract](../../references/current-workspace.md). Stay in
   this directory; do not create another worktree. When preparing explicitly requested new work,
   handle earlier work through its context-supported commit/push/stash flow before switching.
   For an ordinary sync without that context, stop on uncommitted changes and ask; a sync request
   alone does not authorize committing, publishing, or stashing earlier work.
3. Detect the default branch:
   ```bash
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
   ```
   Stop if detection fails or returns an empty value. Do not guess a branch name.
4. Switch with `git switch "$DEFAULT_BRANCH"`.
5. Pull with `git pull --ff-only`.
6. Report the latest commit, whether the branch fast-forwarded, and any commits still ahead of its
   verified upstream. A successful fast-forward-only pull does not prove local and remote tips
   match. Do not reset an ahead/diverged default branch; independent new work must use the shared
   contract's verified base rather than inherit unpublished commits. Retain and report any earlier-
   work stash recovery receipt.

Do not discard changes, amend, reset, or force-push in this skill.
