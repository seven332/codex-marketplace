---
name: rebase-default-branch
description: Rebase the current feature branch onto the latest repository default branch, resolve conflicts, and safely update its pushed branch with force-with-lease. Use when updating an active branch or resolving a PR merge conflict.
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
4. Stop if the current branch is the default branch. Resolve the default branch's configured
   upstream and remote instead of assuming the remote is named `origin`:
   ```bash
   DEFAULT_UPSTREAM=$(git rev-parse --abbrev-ref "$DEFAULT_BRANCH@{upstream}" 2>/dev/null)
   DEFAULT_REMOTE=$(git config --get "branch.$DEFAULT_BRANCH.remote")
   ```
   Stop if either value is empty. Do not guess a remote or rebase target. Fetch the configured
   remote with `git fetch "$DEFAULT_REMOTE"`.
5. Rebase with `git rebase "$DEFAULT_UPSTREAM"`.
6. For each conflict:
   - understand the intended behavior on both sides;
   - follow the
     [filesystem-tool rules](../../references/repository-work-files.md#filesystem-tools) for direct
     conflict file edits;
   - edit the file to preserve the correct combined behavior;
   - stage only resolved files with `git add`; and
   - continue with `git rebase --continue` until complete.
7. Run the relevant validation required by repository guidance.
8. If the current branch was already pushed, update that same remote branch with
   `git push --force-with-lease`. Treat a request to run this skill, or an active `pr-workflow` or
   `pr-workflow-loop`, as authorization for the rebase and this lease-protected update; do not ask
   for separate approval. Re-fetch PR state after the push. If the lease rejects the update, stop,
   re-fetch, and re-evaluate the remote changes instead of retrying with `--force`.

Do not use `git reset --hard`, `git push --force`, bypass conflicts, or discard changes without
explicit approval.
