---
name: pr-workflow
description: Run an end-to-end GitHub pull request workflow from an up-to-date default branch through issue selection, planning, implementation, commit, PR creation, review loops, PR review, and merge readiness checks.
---

# PR Workflow

Use this skill when the user asks to run, follow, or enforce a full pull request workflow rather
than a single PR command.

## Workflow

1. Read repository guidance before acting:
   - `AGENTS.md`, `CONTRIBUTING.md`, README files, package scripts, and CI configuration.
   - Use `rg --files` to find repository-owned PR workflow, review, testing, or release docs.
   Follow repository-specific docs over this generic workflow. Apply project-specific notes only
   when they match the current repository.
2. Determine the current phase from the user request and repository state:
   - starting a new PR-sized task
   - selecting or creating an issue
   - planning an issue
   - implementing an approved plan
   - verifying and reviewing an open PR
   - preparing to merge
3. For a new PR-sized task, start from the default branch:
   - Check `git status --short --branch`; stop if unrelated uncommitted changes are present.
   - Detect the default branch, switch to it, and pull with `git pull --ff-only`.
   - Use the `main` skill when available.
4. Select exactly one issue for the PR:
   - Reuse a suitable existing issue instead of creating a duplicate.
   - If the parent issue is broad, choose or create one independently reviewable sub-issue.
   - If no suitable issue exists, use `issue-create`.
   - Keep tests and documentation in the same issue when they are needed to make the behavior
     reviewable.
5. Plan before coding:
   - Use `issue-plan` for the selected issue.
   - Ensure the plan reads local repository guidance, issue discussion, relevant source, tests, and
     docs.
   - Prefer the smallest complete implementation. Avoid speculative abstractions, public APIs, or
     compatibility layers outside the current issue.
   - Do not implement until the plan is explicitly approved.
6. Implement the approved plan:
   - Use `issue-implement` when available.
   - Create or use a branch whose prefix matches the intended Conventional Commit type, such as
     `feat/issue-123-short-name` or `fix/issue-123-short-name`.
   - Keep edits scoped to the issue boundary.
   - Update tests and documentation with behavior changes.
   - Do not amend review updates; add focused follow-up commits.
7. Commit the implementation:
   - Run commands documented by the repository.
   - If no local command is documented, inspect package scripts, language tooling, CI, and nearby
     tests to choose the narrowest credible checks.
   - Inspect the diff, stage only intended files, and commit with Conventional Commits.
   - Do not amend existing commits unless the user explicitly requests it.
8. Create or update the PR:
   - Use `pull-request` for creation or updates.
   - Include a concise summary, linked issue such as `Closes #123`, explicit exclusions when
     relevant, and verification commands actually run.
9. Run the review loop on the open PR until clean:
   - Review logic, performance, tests, security, documentation, and code structure.
   - Check race conditions, transient failures, resource leaks, active sleeps, artificial delays,
     flaky tests, and edge cases.
   - If an issue belongs to the current PR, fix it directly, commit, rerun relevant validation, and
     restart the review loop from the first category.
   - If a real issue is outside the current PR scope, link or create a follow-up issue and record
     the relationship before continuing.
   - Stop only after one complete pass finds no new issues to fix or record.
10. Post the PR review:
    - Use `pr-review` after the review loop is clean.
    - If `pr-review` finds new issues, fix them and return to the review loop before merging.
11. Check merge readiness:
    - Use `pr-check` or run `gh pr checks <pr-number>` and
      `gh pr view <pr-number> --json mergeable,mergeStateStatus`.
    - Merge only when CI is green, merge state is clean, and review has no blocking findings.
    - Use the repository's preferred merge strategy. If unknown, prefer squash merge.
    - After merge, switch to the default branch and pull latest before starting the next PR-sized
      issue.

## Related Skills

- Use `main` to update the default branch.
- Use `issue-create`, `issue-plan`, and `issue-implement` for issue-driven work.
- Use `pull-request` to create, update, comment on, or merge PRs.
- Use `pr-check` for CI and merge-state checks.
- Use `pr-review` for the final PR review comment.
