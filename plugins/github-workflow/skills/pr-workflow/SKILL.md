---
name: pr-workflow
description: Run an end-to-end GitHub pull request workflow from an up-to-date default branch through issue selection, planning, implementation, commit, PR creation, review loops, PR review, and merge readiness checks.
---

# PR Workflow

Use this skill when the user asks to run, follow, or enforce a full pull request workflow rather
than a single PR command.

Follow repository-specific instructions over this generic workflow. Treat instructions tied to a
specific project, directory, product, platform, or technology as applicable only when the current
repository has the same context.

## Workflow

### 1. Start From Main

Always begin from an up-to-date default branch before creating, planning, or implementing the next
PR-sized issue.

Use `main` for the branch switch and pull.

### 2. Select Or Create The PR Issue

Use `issue-select` to select or create one PR-sized issue before planning.

### 3. Plan The Issue

Use `issue-plan` for the issue before coding.

The plan must choose the best clear direction for the current issue, weighing correctness,
performance, and long-term maintainability against repository guidance, public contracts, and known
future constraints when they matter. If planning leaves multiple viable approaches with no clear
best choice, stop for a human decision.

Treat the user's explicit request to run this end-to-end `pr-workflow` as approval to continue from
the completed plan into implementation unless the user asks to wait for separate approval.

### 4. Implement The Approved Plan

Use `issue-implement` after the plan is approved.

Keep implementation scoped to the approved plan and return to planning if the approved direction
needs to change.

### 5. Verify Locally

Use the validation commands required by the repository and by the implementation and PR creation
skills before opening or updating the PR.

### 6. Run The Review Loop

Use `pr-review-loop` after the branch has been pushed and the PR has been created or updated.

### 7. Post The PR Review

After the review loop has no new findings, run `pr-review`. If it finds new issues, fix them and
return to the review loop before merging.

### 8. Merge

Use `pr-check` and `pull-request` merge only when the review loop is clean, `pr-review` has no
blocking findings, CI is green, and GitHub reports a clean merge state.

After merge, continue from the latest default branch before starting the next issue.

## Related Skills

- Use `main` to update the default branch.
- Use `issue-select`, `issue-create`, `issue-plan`, and `issue-implement` for issue-driven work.
- Use `pull-request` to create, update, comment on, or merge PRs.
- Use `pr-check` for CI and merge-state checks.
- Use `pr-review-loop` for repeated focused PR self-review.
- Use `pr-review` for the final PR review comment.
- Use `pr-workflow-loop` only when the user asks to run multiple `pr-workflow` cycles.
