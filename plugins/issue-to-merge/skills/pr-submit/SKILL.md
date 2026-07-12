---
name: pr-submit
description: Commit and push intended local changes, then create or update the GitHub pull request for the current branch. Use when submitting implementation work, opening a PR, or refreshing an existing PR after fixes.
---

# PR Submit

Own the boundary between verified local changes and the submitted pull request. Do not review or
merge the PR in this skill.

## Workflow

1. Inspect repository state:
   ```bash
   git status --short --branch
   git branch --show-current
   git diff
   git diff --cached
   ```
   Stop if unrelated uncommitted changes are present or the intended files are unclear.
2. Detect the repository default branch:
   ```bash
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
   ```
   Stop if detection fails or returns an empty value. Choose the intended target branch from an
   explicit request, existing PR, or repository workflow; otherwise use the default branch. Do not
   guess or silently retarget an existing PR.
3. Determine whether the current branch already has a PR with
   `gh pr view --json number,state,mergedAt,url,baseRefName,headRefName,headRefOid`. Handle a missing
   PR as the normal create case.
   - If on the intended target branch with local changes, create a feature branch named
     `<type>/<short-description>` before committing.
   - If the branch has an open PR, update that PR.
   - If the branch belongs to a closed or merged PR, stop and ask whether to reopen it or create a
     new branch. Do not silently reuse completed PR state.
4. Confirm that the validation required by repository guidance passed for the exact current
   worktree. Reuse fresh results from `issue-implement`, `pr-self-review`, or another immediately
   preceding step; run commands that are missing or stale. If no command is documented, inspect
   package scripts, language tooling, CI, and nearby tests to choose the narrowest credible checks.
5. Stage only intended files and inspect the staged diff. Commit staged changes with a Conventional
   Commit message when a commit is needed:
   ```text
   <type>[optional scope]: <description>
   ```
   Do not amend existing commits. If there are no new changes, continue only when the branch has
   commits that still need to be pushed or submitted, or an existing PR needs an authorized
   metadata refresh.
6. Push the current branch. Set its upstream on the first push. Do not force-push; a history rewrite
   belongs to an explicitly approved rebase workflow.
7. Create or update the PR:
   - For an existing open PR, verify that its base is the intended target branch. Update the body
     only when its summary, scope, issue link, or validation record is materially stale.
   - For a new PR, read and follow the
     [repository work-file contract](../../references/repository-work-files.md), then create a unique
     body file under `<codex-work>/tmp/issue-to-merge/pr-submit/`. On POSIX use an `mktemp` template
     in that directory; on other platforms use a random-name API with that directory. Never use an
     operating-system temp directory. Use the resolved path as `PR_BODY_FILE`. Include the behavior
     changed, explicit exclusions, and the validation commands actually run. For issue-backed
     work, link the exact implementation issue supplied by `issue-implement`. Use
     `Closes #<implementation-issue>` only when this PR completes that issue and GitHub will apply
     the closing keyword for the target branch, normally the repository default branch. Use a
     non-closing `Relates to #<implementation-issue>` link for release, backport, or other target
     branches where closing semantics do not apply. When the implementation issue has a delivery
     parent, link the parent as context without a closing keyword. Never close an umbrella parent
     from one child PR. Use the repository's PR title convention, or a concise Conventional
     Commit-style title when none exists. Then create it:
     ```bash
     gh pr create --base "$TARGET_BRANCH" --head "$BRANCH" --title "<title>" --body-file "$PR_BODY_FILE"
     ```
     Remove the PR body file after successful creation, or when a failed creation is no longer
     being retried.
   Never create a duplicate PR for the same branch.
8. Fetch the submitted PR state:
   ```bash
   gh pr view --json number,url,headRefOid,baseRefName,headRefName,closingIssuesReferences
   ```
   Return the PR number, URL, current `headRefOid`, linked implementation issue, and delivery parent
   when present. State whether the operation created a PR, updated one with a new commit, or only
   refreshed metadata. Before handoff, verify that an issue-backed PR does not accidentally close
   its parent or an unrelated sibling, and that the expected implementation issue appears when
   closing semantics should apply.

## Related Skills

- Use `issue-implement` to produce and validate the local changes before submission.
- Use `pr-self-review` after the submitted PR reflects the latest local changes.
- Use `pr-merge` only after all review and readiness checks are complete.
