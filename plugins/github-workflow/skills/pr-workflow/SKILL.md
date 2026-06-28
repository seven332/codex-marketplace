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

Use one PR for one clear issue. Keep the PR small enough to review independently.

- If a suitable issue already exists, use that issue instead of creating a duplicate.
- If no suitable issue exists, use `issue-create` to create one.
- If the parent issue is broad, create or choose one sub-issue that can be completed and merged on
  its own.
- When using a sub-issue, record the GitHub sub-issue relationship so the roadmap stays traceable:
  create a new sub-issue with `gh issue create --parent <parent-issue>` or attach an existing issue
  with `gh issue edit <parent-issue> --add-sub-issue <child-issue>`.
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
- Choose the best complete design for the issue after weighing correctness, performance, and
  long-term maintainability.
- Identify performance-sensitive paths, expected scale or concurrency, and how the plan will
  validate or protect performance when they matter.
- Account for known future constraints and established extension points when they materially affect
  the right design now.
- Avoid speculative abstractions, public APIs, or compatibility shims that do not improve the
  current design or a known near-term requirement.
- Treat the user's explicit request to run this end-to-end `pr-workflow` as approval to continue
  from the completed plan into implementation unless the user asks to wait for separate approval or
  planning leaves multiple viable approaches with no clear best choice.

### 4. Implement The Approved Plan

Use `issue-implement` after the plan is approved.

- The implementation workflow should create or use a branch for the issue, implement the approved
  plan, run the local verification in section 5, commit, push, and create or update the PR.
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
This is the local validation step referenced by section 4 before the branch is pushed and the PR is
created or updated.

- If the repository documents exact validation commands, run those commands.
- If no local command is documented, inspect package scripts, language tooling, CI, and nearby tests
  to choose the narrowest credible checks.
- Only list commands in the PR body if they were run on the reviewed head.
- The PR body should include a summary of the behavior changed, explicit scope exclusions when
  relevant, a linked issue such as `Closes #123`, and verification commands actually run.

### 6. Run The Review Loop

Run the review loop after the branch has been pushed and the PR has been created or updated, so the
review is against the submitted PR diff. Review changed behavior, not only changed lines. Use
repository-specific review guidelines when they exist. Treat the following checklist as one full
review loop. Run each numbered pass as a separate focused inspection, in order, and track whether
any pass found issues in the current loop:

1. Check logic, performance, tests, security, documentation, and code structure.
2. Check transient failures, races, and deadlocks, including concurrent execution when relevant.
3. Check resource leaks, including concurrent execution when relevant.
4. Check active sleeps, artificial delays, performance issues, and flaky tests.
5. Check edge cases that could produce incorrect behavior.

For each pass, inspect only that category deeply enough to form a clear verdict. If the pass finds
an issue that belongs to the current PR, fix it directly, commit the fix, rerun relevant validation,
mark the current loop as having found issues, and rerun the same pass. If the issue is real but
outside the PR scope, link an existing suitable issue, or create one if no suitable issue exists.
Record the relationship on the parent issue when one exists, mark the current loop as having found
issues, and rerun the same pass. Do not re-record the same out-of-scope issue after it has already
been linked or created; treat it as handled for this loop unless new evidence changes the scope.
Advance to the next pass only when the current pass finds no issues to fix or record. After pass 5,
run another full loop if any pass in the current loop found issues. Stop only after one full loop
completes passes 1 through 5 without finding any issue to fix or record.

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
