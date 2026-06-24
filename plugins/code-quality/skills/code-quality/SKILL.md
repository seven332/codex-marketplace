---
name: code-quality
description: Review code changes, identify quality risks, and guide focused cleanup across general software projects.
---

# Code Quality

Use this skill when the user asks for a code review, quality audit, bug-risk scan, test-quality
review, refactoring recommendation, or cleanup of avoidable defensive code.

## Operations

This skill supports two explicit operations:

1. `review <pr-id|commit-id|commit-range|description>` - Review code changes and write review
   artifacts.
2. `cleanup` - Find and clean up a narrow class of quality issues when the user asks for code
   changes.

If the user does not name an operation, infer the likely operation from their request. Use `review`
for audit/review requests and `cleanup` only when the user asks to modify code.

## First Principles

- Read the repository's own guidance first: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, README
  files, project docs, package scripts, lint/type/test configuration, and nearby tests.
- Treat local project conventions as the source of truth when they are explicit.
- Do not assume framework, language, test runner, package manager, or service layout before
  inspecting the repository.
- Prefer concrete findings over broad style commentary.
- For reviews, lead with bugs, regressions, security issues, and missing tests.
- For cleanup, make small behavior-preserving changes and verify them with the narrowest reliable
  command set available in the project.

## Project Documentation Discovery

Before reviewing code, look for project-owned quality rules and test strategy documents. Search
common locations with `rg --files` and read the relevant files before applying generic heuristics.

Prioritize files whose names or paths include:

- `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `DEVELOPMENT.md`, `README.md`
- `docs/`, `.github/`, `guides/`, `architecture/`, `adr/`
- `quality`, `code-quality`, `bad-smell`, `testing`, `test`, `lint`, `typecheck`, `style`
- framework-specific testing docs such as `api-testing`, `cli-testing`, `app-testing`, or
  `e2e-testing`

Extract these facts from the docs:

- Required verification commands and where they must be run.
- Commit, PR, language, and review conventions.
- Test strategy: unit vs integration vs E2E, mock boundaries, fixture setup, cleanup, and
  framework-specific helpers.
- Code quality rules: type strictness, lint suppressions, error handling, configuration,
  dependency loading, public API expectations, and security requirements.
- Known exceptions or technical debt that should not be treated as a new finding.

If the project has no explicit docs, say that and continue with the generic checklist below.

## Default Baseline Bad Smells

Use these defaults when the repository has no explicit rule, or when local docs do not cover the
area. If local project guidance conflicts with this list, follow the local guidance and mention the
conflict when it matters to the review.

### Type Safety

- Unjustified `any`, unsafe casts, broad type assertions, or erased generics.
- `unknown` values used without type narrowing.
- Public functions, API responses, or serialized data without clear types.

### Suppressed Diagnostics

- `eslint-disable`, `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error`, formatter ignores, or
  equivalent suppression comments without a narrow documented reason.
- Configuration changes that weaken linting, typechecking, tests, or CI instead of fixing the
  underlying issue.

### Mocking Boundaries

- Tests that mock internal modules, relative imports, database layers, filesystem layers, or core
  business services when a public entry point can exercise the real behavior.
- Tests that assert only mock calls rather than user-visible, API-visible, CLI-visible, or
  persisted behavior.
- Direct HTTP/fetch mocking when the project has a network-level mock pattern such as MSW, VCR, or
  local fake services.

### Test Realism And Stability

- Unit tests for private/internal functions when the same behavior can be covered through a public
  entry point.
- Fake timers, arbitrary sleeps, timeout increases, polling loops, or artificial delays used to
  make tests pass.
- Filesystem, database, queue, cache, or clock mocks that hide behavior the project can test with
  isolated real resources.
- Tests that verify framework/library behavior instead of project behavior.
- Missing regression tests for bug fixes, migrations, authorization changes, parsing changes, or
  cross-boundary workflows.

### Error Handling And Fallbacks

- Catch blocks that only log and rethrow, return a generic fallback, silently return
  `null`/`undefined`, or hide the original error.
- Fallback configuration, default secrets, fallback URLs, permissive retries, or recovery branches
  that mask deployment/configuration errors.
- Retrying without limits, backoff, cancellation, idempotency, or visibility.
- Swallowed promise rejections and fire-and-forget work without ownership or failure reporting.

### Configuration And Dependency Loading

- Hardcoded environment-specific URLs, credentials, paths, feature flags, model names, or service
  endpoints.
- Dynamic imports or lazy dependency loading without a real boundary such as optional dependency
  support, code splitting, or plugin loading.
- Runtime configuration reads spread through business logic instead of centralized validation.

### API, Data, And Security

- Public API contract changes without compatibility handling, migration notes, or tests.
- Authorization, tenancy, ownership, or permission checks that are missing on new read/write paths.
- Sensitive data in logs, errors, telemetry, snapshots, test fixtures, or generated artifacts.
- Non-idempotent writes, partial failure paths, migration drift, or cleanup gaps.
- Injection, path traversal, SSRF, unsafe deserialization, command construction, or unsafe file
  access.

### Maintainability And Design

- Premature abstractions, broad helpers, duplicated business rules, dead code, and options added
  without current callers.
- Changes that make the common path harder to understand in order to support speculative cases.
- Large mixed-purpose commits that combine behavior changes, formatting, renames, and refactors.
- New dependencies where a standard library, existing local helper, or smaller scoped change would
  suffice.

## Review Workflow

1. Determine scope from the user's request:
   - Pull request number: inspect PR metadata and commits with `gh pr view` when available.
   - Commit range: use `git rev-list`, `git diff`, and `git show`.
   - Single commit: inspect that commit and its affected tests.
   - Working tree: inspect `git status`, staged changes, and unstaged changes.
   - Path or feature description: search with `rg` and inspect the relevant modules.
2. Identify the verification surface:
   - Build, lint, typecheck, unit tests, integration tests, and targeted smoke checks.
   - Prefer commands documented by the repo over guessed commands.
3. Build a project-specific review rubric from the docs discovered above.
4. Create review artifacts when the review spans commits or a PR:
   - Create `codereviews/YYYYMMDD/` using the current local date.
   - Create `codereviews/YYYYMMDD/commit-list.md`.
   - Create one `codereviews/YYYYMMDD/review-{short-hash}.md` file for each reviewed commit.
   - For working-tree or path-only reviews, create `codereviews/YYYYMMDD/review-working-tree.md`
     when a durable report is useful.
5. Review changed behavior, not just changed lines:
   - Trace callers and public entry points.
   - Check data validation, error propagation, concurrency, IO, authorization, and state changes.
   - Inspect tests for meaningful coverage of behavior and failure modes.
6. Track issue counts by rubric category so summaries show the shape of the risk, not just a list
   of findings.
7. Report findings in severity order:
   - `P0`: correctness, data loss, security, or release-blocking regression.
   - `P1`: likely user-visible bug, broken workflow, or important missing test.
   - `P2`: maintainability risk, brittle test, unclear API, or follow-up cleanup.
8. Include file and line references when possible.
9. If no findings are found, say that clearly and call out remaining test gaps or unverified areas.

## Review Artifact Format

Use this structure for `commit-list.md`:

```markdown
# Code Review: YYYYMMDD

## Scope

- Input: `<original review scope>`
- Repository: `<repo>`
- Base/head or commits: `<range>`

## Review Rubric

- Project docs read: `<list>`
- Verification commands identified: `<list>`
- Key local conventions: `<summary>`

## Commits

- [ ] [`short-hash`](./review-short-hash.md) Commit subject

## Review Summary

**Total Commits Reviewed:** 0

### Findings By Severity

- P0: 0
- P1: 0
- P2: 0

### Quality Statistics

- Correctness: 0
- Tests: 0
- Mock boundaries: 0
- Error handling: 0
- Security/privacy: 0
- Data/migrations: 0
- Performance: 0
- Maintainability: 0

### Action Items

- [ ] ...
```

Use this structure for each `review-{short-hash}.md`:

````markdown
# Code Review: short-hash

## Commit Information

- Hash: `full-hash`
- Subject: `subject`
- Author: `name <email>`
- Date: `date`

## Changes Summary

```text
git show --stat output
```

## Findings

### P1: Short issue title

- Location: `path/file.ext:42`
- Category: Tests
- Impact: Explain the concrete failing scenario.
- Recommendation: Describe the smallest credible fix.

## Category Notes

- Correctness: ...
- Tests: ...
- Mock boundaries: ...
- Error handling: ...
- Security/privacy: ...
- Data/migrations: ...
- Performance: ...
- Maintainability: ...

## Verification

- Ran: `...`
- Not run: `...`
````

After reviewing, update `commit-list.md` so each commit checkbox is checked, links point to review
files, severity totals are accurate, and quality statistics count concrete findings. Avoid inflated
counts: count one root problem once even if it appears in several nearby lines.

## Review Commands

Useful commands for gathering review context:

- PR commits: `gh pr view <pr-id> --json commits --jq '.commits[].oid'`
- Commit range: `git rev-list <range> --reverse`
- Single commit metadata: `git show --stat <commit>`
- Commit patch: `git show <commit>`
- Working tree: `git status --short`, `git diff`, and `git diff --cached`
- Recent commits for a description-only review: `git log --since="1 week ago" --pretty=format:"%H"`

Do not treat these as mandatory if the repository documents a better workflow.

## Quality Checklist

Check the relevant items for the scoped change:

- Correctness: edge cases, null/empty inputs, error paths, retries, ordering, time zones, and
  backwards compatibility.
- API and interface design: breaking changes, confusing names, leaky abstractions, and undocumented
  contract changes.
- Tests: meaningful assertions, integration coverage for public behavior, flaky timing, excessive
  mocking, test isolation, and missing regression tests.
- Mock boundaries: prefer mocking external services over internal implementation; check whether the
  project documents exceptions.
- Test realism: avoid tests that only assert mock calls, implementation details, or library behavior
  unless the project explicitly wants that coverage.
- IO tests: prefer real filesystem, database, and HTTP boundaries with controlled fixtures when the
  project supports them; otherwise follow local test infrastructure.
- Time and async: avoid artificial sleeps, broad fake timers, floating promises, and race-prone
  cleanup unless local docs prescribe a safe pattern.
- Error handling: swallowed errors, generic fallbacks, log-and-return patterns, retry loops without
  limits, and catch blocks that cannot recover meaningfully.
- Security and privacy: injection, authorization checks, secret handling, unsafe filesystem access,
  SSRF, path traversal, and sensitive logging.
- Data and migrations: idempotency, rollback behavior, default values, schema drift, and partial
  failures.
- Performance: avoidable N+1 work, unbounded loops, unnecessary network calls, blocking IO, and
  memory growth.
- Maintainability: duplicated logic, unused abstractions, over-broad helpers, confusing control
  flow, type escapes, dynamic imports without a clear need, hardcoded configuration, and suppressed
  diagnostics.

## Cleanup Workflow

Use this mode only when the user asks to modify code.

1. Find a narrow cleanup target, such as avoidable defensive `try`/`catch` blocks, duplicated
   branches, unused abstractions, stale suppressions, or brittle test setup.
2. Confirm each change is behavior-preserving or intentionally behavior-changing.
3. Prefer deleting unnecessary code over adding replacement abstraction.
4. Keep commits focused and use Conventional Commit messages.
5. Run the most relevant verification command before reporting completion.

For defensive error handling cleanup, remove a catch block only when:

- The catch block only logs and rethrows, returns a generic fallback, or silently returns
  `null`/`undefined`.
- There is no required cleanup, rollback, retry, audit, or domain error translation.
- The caller or framework has a clearer error boundary.
- The change does not hide a user-facing error message requirement.

Do not remove catch blocks that perform meaningful recovery, resource cleanup, per-item isolation,
security auditing, or domain-specific error conversion.

## Output

For review tasks, use this structure:

```markdown
Findings:
- P1 `path/file.ext:42` Short issue title.
  Explain impact and the concrete failing scenario.
  Suggested fix: ...

Open questions:
- ...

Verification:
- Ran `...`
- Not run: ...
```

For cleanup tasks, summarize:

- Files changed.
- Behavior preserved or intentionally changed.
- Verification run.
- Remaining risks or follow-up work.

## Source Inspiration

This workflow was generalized from common repository quality practices and from public vm0 project
docs covering bad smells and testing strategy. Do not assume vm0-specific paths, commands, or rules
unless reviewing the vm0 repository itself.
