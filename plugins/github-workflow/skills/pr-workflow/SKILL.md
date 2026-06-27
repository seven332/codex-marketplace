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

1. Check `git status --short --branch`; stop if unrelated uncommitted changes are present.
2. Detect the default branch, switch to it, and run `git pull --ff-only`.
3. Use the `main` skill when available.

### 2. Select Or Create The PR Issue

Use one PR for one issue.

- If a suitable issue already exists, use that issue instead of creating a duplicate.
- If no suitable issue exists, use `issue-create` to create one.
- If the parent issue is broad, create or choose one sub-issue that can be completed and merged on
  its own.
- Ensure the issue explains the problem this PR solves, what is intentionally out of scope, and
  which later work remains in the parent issue.
- Do not split tests or documentation into separate follow-up issues when they are needed to make
  the code change reviewable. They belong in the same PR.

### 3. Plan The Issue

Use `issue-plan` for the issue before coding.

- Ensure the plan reads the relevant local code, issue discussion, `AGENTS.md`, README, and docs.
- Use `rg --files` to find repository-owned workflow, review, testing, or release docs when they
  are relevant.
- When a behavior must match a declared compatibility target, public contract, or upstream source,
  compare against the relevant compatibility docs, specs, or source before choosing an interface or
  validation rule.
- Prefer the smallest implementation that makes the issue complete.
- Avoid adding future abstractions, public APIs, or compatibility shims that this issue does not
  need.
- Do not implement before the plan is approved.

### 4. Implement The Approved Plan

Use `issue-implement` after the plan is approved.

- The implementation workflow should create or use a branch for the issue, implement the approved
  plan, run validation, commit, push, and create or update the PR.
- Use `feat/`, `fix/`, `docs/`, or `chore/` branch prefixes that match the intended Conventional
  Commit type, for example `feat/issue-123-short-name`.
- Keep edits scoped to the module, package, service, documentation, or behavior boundary owned by
  the issue.
- Update tests and documentation with the behavior change.
- Public-facing changes should update compatibility, API, or user documentation when the declared
  target or current scope changes.
- Do not amend existing commits during review updates. Add a new focused commit for each fix or
  documentation update.
- Use Conventional Commit messages, for example:

```sh
git commit -m "feat: add configuration model"
git commit -m "fix: reject duplicate ids"
git commit -m "docs: document PR workflow"
```

### 5. Verify Locally

Before opening or updating a PR, run the repository checks from the workspace root or as documented.

- If the repository documents exact validation commands, run those commands.
- If no local command is documented, inspect package scripts, language tooling, CI, and nearby tests
  to choose the narrowest credible checks.
- Only list commands in the PR body if they were run on the reviewed head.
- The PR body should include a summary of the behavior changed, explicit scope exclusions when
  relevant, a linked issue such as `Closes #123`, and verification commands actually run.

### 6. Run The Review Loop

Review changed behavior, not only changed lines. Use repository-specific review guidelines when
they exist. Run these focused review passes repeatedly. Stop only after one complete pass through
the checklist finds no new issues to fix or record:

1. Check logic, performance, tests, security, documentation, and code structure.
2. Check transient failures, races, and deadlocks, including concurrent execution when relevant.
3. Check resource leaks, including concurrent execution when relevant.
4. Check active sleeps, artificial delays, performance issues, and flaky tests.
5. Check edge cases that could produce incorrect behavior.

If any review pass finds an issue that belongs to the current PR, fix it directly, commit the fix,
rerun relevant validation, and restart the review loop from the first pass. If the issue is real but
outside the PR scope, link an existing suitable issue, or create one if no suitable issue exists.
Record the relationship on the parent issue when one exists, and then restart the loop. Do not stop
the loop just because one category was clean; stop only after a full pass finds no new issues.

### 7. Post The PR Review

After the review loop has no new findings, run `pr-review`. The PR review comment should summarize
the reviewed scope, findings, verification, and verdict. If `pr-review` finds new issues, fix them
and return to the review loop before merging.

### 8. Merge

Merge only when the review loop is clean, `pr-review` has no blocking findings, CI is green, and
GitHub reports a clean merge state:

```sh
gh pr checks <pr-number>
gh pr view <pr-number> --json mergeable,mergeStateStatus
```

Use squash merge unless the repository has a more specific instruction:

```sh
gh pr merge <pr-number> --squash --delete-branch
git switch <default-branch>
git pull --ff-only
```

After merge, continue from the latest default branch before starting the next issue.

## Related Skills

- Use `main` to update the default branch.
- Use `issue-create`, `issue-plan`, and `issue-implement` for issue-driven work.
- Use `pull-request` to create, update, comment on, or merge PRs.
- Use `pr-check` for CI and merge-state checks.
- Use `pr-review` for the final PR review comment.
