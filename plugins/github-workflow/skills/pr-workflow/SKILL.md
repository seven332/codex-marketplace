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

Use `issue-select` to select or create one PR-sized issue before planning.

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

Use `pr-review-loop` after the branch has been pushed and the PR has been created or updated.

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
- Use `issue-select`, `issue-create`, `issue-plan`, and `issue-implement` for issue-driven work.
- Use `pull-request` to create, update, comment on, or merge PRs.
- Use `pr-check` for CI and merge-state checks.
- Use `pr-review-loop` for repeated focused PR self-review.
- Use `pr-review` for the final PR review comment.
