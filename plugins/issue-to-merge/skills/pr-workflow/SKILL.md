---
name: pr-workflow
description: Start or resume an end-to-end GitHub pull request workflow through issue selection, planning, challenge, implementation, submission, current-head review, CI and feedback handling, and merge readiness. Merge only when the original request explicitly authorizes it.
---

# PR Workflow

Follow repository-specific instructions over this generic workflow. Treat an explicit request to
run this workflow as approval for normal issue creation or updates, implementation, PR submission,
in-scope fixes, and review comments. It does not authorize merging, history rewrites, discarding
changes, or bypassing protections unless the user explicitly includes those actions.

## Workflow

### 1. Start Or Resume

Inspect `git status --short --branch`, the current branch, conversation context, and GitHub state
before switching branches.

- If the current branch has an open PR that matches the requested scope, resume at the earliest
  incomplete PR stage for its current `headRefOid`. Stop for direction when it belongs to different
  work.
- If an explicit issue has a linked open PR, resume that PR only when switching to its head branch
  is safe.
- If an explicit issue has valid Plan, Challenge, approval, or blocker markers but no PR, resume
  from the earliest incomplete issue or implementation stage on a safe branch instead of selecting
  a new issue.
- If a feature branch has approved implementation work but no PR, resume implementation or
  submission on that branch.
- Only for genuinely new work, use `sync-default-branch` before issue selection.
- Stop rather than overwrite, stash, or mix unrelated uncommitted changes.
- When durable state cannot prove that a review or check completed for the current head, rerun that
  stage instead of assuming it passed.

### 2. Select An Implementation Issue Or Planning Parent

For new work, use `issue-select`. This workflow invocation authorizes the issue or sub-issue
creation and relationship updates needed for a justified decomposition and selection.

- Continue directly when it returns one independently reviewable implementation issue.
- When an explicit issue is too broad and lacks a challenged delivery direction, retain it as the
  planning parent and continue through steps 3 and 4 before creating child issues. Never send a
  planning parent directly to implementation.
- Preserve the selected parent, child, sibling, and dependency context throughout the workflow.

### 3. Plan The Issue

Use `issue-plan` on the selected implementation issue or planning parent. Require a clear direction
that weighs correctness, performance, compatibility, and long-term maintainability against
repository guidance and known future constraints. For a planning parent, require parent-level
acceptance criteria, coherent delivery slices, dependency order, and integration or rollout gates.
Stop for a human decision when material alternatives remain tied.

### 4. Challenge The Issue And Plan

Use `issue-challenge` after planning. Do not treat the current issue boundary or smallest diff as a
constraint on the best justified direction.

- On `revise`, update the issue, run `issue-plan` again, and challenge the replacement plan.
- On `defer`, `recommend-close`, or `pending`, stop for human direction.
- When the best direction needs multiple PRs, keep the current issue as the delivery parent. Use
  `issue-select` to materialize justified slices and select one open, unblocked child, then return
  to step 3 to plan and challenge that child. A clean parent Challenge Review does not replace the
  child's own Plan and Challenge Review. Repeat decomposition if a proposed child is still too
  broad instead of implementing an umbrella issue.
- Before leaving a `proceed` parent for its selected child, remove the workflow-owned
  `codex-pending` label only when this invocation authorizes continuing and comment chronology
  confirms that the label represented the now-resolved parent Plan wait. Preserve it when any
  pending decision, blocker, `defer`, `recommend-close`, or stale Plan/Challenge state remains.
  ```bash
  gh issue edit <parent-issue> --remove-label codex-pending 2>/dev/null || true
  ```
- If child planning changes the overall design, dependencies, or parent acceptance criteria,
  return to `issue-plan` and `issue-challenge` for the delivery parent, then replan and rechallenge
  every affected child before implementation.
- Continue only after a `proceed` outcome for the latest Plan. This workflow invocation supplies
  implementation approval unless the user asked to pause after planning.

### 5. Implement And Verify

Use `issue-implement` only for the selected PR-sized child or standalone implementation issue. Change
code, tests, and documentation and run required validation. If implementation invalidates the
challenged direction or parent delivery plan, return to the affected planning and challenge stages.

### 6. Submit The PR

Use `pr-submit` to commit and push intended changes and create or update the PR. Link the exact
implementation issue; never use one child PR to close its delivery parent. Record the PR number,
URL, submitted `headRefOid`, implementation issue, and parent when present.

### 7. Self-Review The Submitted Head

Use `pr-self-review`. Every fix must go through `pr-submit`, after which self-review restarts on the
new submitted head. Continue only after a full clean loop on an unchanged `headRefOid`.

### 8. Post The Current-Head Review

Use `pr-review`. Require an `lgtm` marker for the current `headRefOid`. For `changes-requested` or
`needs-discussion`, return to self-review; after any fix, submit it and repeat both review stages.

### 9. Check CI, Feedback, And Merge State

Run `pr-check` in read-only `check` mode against the reviewed head.

Also run `pr-address-review inspect` to scan top-level and inline feedback from
people, bots, and GitHub Apps; automated feedback does not always affect `reviewDecision`.

- For pending checks, report readiness as pending. Use `watch` only when requested.
- For an explicitly authorized mechanical lint or format fix, use `pr-check fix`, then return to
  step 7 for the new head.
- For type, test, build, or product failures, return to implementation, submit the fix, and restart
  at step 7.
- For actionable human, bot, or GitHub App feedback, run `pr-address-review address`. If it changes
  the PR head, restart at step 7; for reply-only work on the same head, repeat step 9.
- For merge conflicts, use `rebase-default-branch`. Obtain explicit approval before rewriting a
  pushed PR branch, then restart at step 7 for the rebased head.

Repeat steps 7 through 9 until the same head has a clean self-review, an `lgtm` Code Review marker,
green required checks, no blocking feedback, and a clean merge state.

### 10. Finish At Merge Readiness Or Merge

Report the PR as ready with its reviewed head SHA and remaining unverified areas. If the original
user request explicitly authorized merging, use `pr-merge`. Otherwise stop at readiness and wait
for a separate merge request.

For a child issue, also report the delivery parent, completed and remaining materialized siblings,
blocked dependencies, and any planned slices not yet materialized. A single `pr-workflow` invocation
never starts the next child PR automatically. Use `pr-workflow-loop` only after an explicit request
for repeated merge-authorized iterations.

After a completed merge, use `sync-default-branch`, confirm the implementation issue and parent
relationship state, then report parent progress. Do not close the delivery parent unless the user
explicitly authorized that action and its full acceptance criteria have been verified.

## Related Skills

- Use `pr-workflow-loop` only for an explicitly requested sequence of merged PR-sized iterations.
- Use `pr-submit`, `pr-self-review`, `pr-review`, `pr-check`, and `pr-address-review` for the PR
  feedback loop.
- Use `pr-merge` only with explicit merge authorization.
