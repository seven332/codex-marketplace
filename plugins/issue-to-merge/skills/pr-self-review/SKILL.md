---
name: pr-self-review
description: Self-review a submitted pull request before final review or merge, fixing and publishing in-scope issues, recording authorized out-of-scope work, and repeating focused passes until the current PR head is clean.
---

# PR Self Review

Review the submitted PR, not an unpushed local approximation of it.

## Workflow

1. Identify the PR from an explicit number or URL, or from the current branch. Read its
   `number`, `url`, `headRefName`, `headRefOid`, and `baseRefName`.
2. Require a clean working tree and confirm that the current branch matches `headRefName` before
   making fixes. Stop when unrelated changes are present or the PR branch cannot be updated safely.
3. Read the submitted diff and repository-specific review guidance. Record the starting
   `headRefOid`. Review changed behavior, not only changed lines.
4. Treat the following six passes as one full loop. Run each pass as a separate focused inspection
   in order and track whether it found an issue:
   1. Check scope and approach fit: whether the PR follows its scope and any approved plan, and
      uses the best clear in-scope approach rather than the smallest patch.
   2. Check correctness and edge cases: logic, data flow, boundary inputs, error paths,
      compatibility, and user-visible behavior.
   3. Check tests and documentation: meaningful coverage, validation commands, docs, and missing
      regression tests.
   4. Check concurrency, timing, and performance: transient failures, races, deadlocks, active
      sleeps, artificial delays, flaky tests, and avoidable regressions.
   5. Check resource, IO, and security risks: leaks, cleanup, file/network/database effects, path
      safety, authorization, secrets, and sensitive output.
   6. Check maintainability and structure: unclear shortcuts, over-fitted special cases,
      duplication, unnecessary abstractions, and structural debt.
5. For an in-scope finding, implement the best supported fix, update tests or docs when relevant,
   and run the required validation. Use `pr-submit` to commit, push, and update the submitted PR.
   Re-fetch `headRefOid` and the PR diff, then rerun the same pass against the new head.
6. For a valid out-of-scope finding, search for a suitable existing issue first. Link it, or create
   one only when the user or active workflow authorized issue recording. If the user requested an
   analysis-only review, report the proposed issue without creating it. Never move a change needed
   for this PR's correctness, tests, documentation, or reviewability out of scope.
7. Do not record the same out-of-scope finding more than once during the review session. Advance
   only when the current pass has no unresolved finding.
8. After pass 6, run another full loop when any pass found an issue. If the PR head changes outside
   this workflow, restart the loop on the new head. Stop only after one complete loop finishes all
   six passes without findings and `headRefOid` remains unchanged.
9. Report the clean head SHA, fixes submitted, validation run, and linked follow-up issues.

## Related Skills

- Use `pr-submit` before this skill when the PR does not yet contain the latest local changes.
- Use `pr-review` after this skill completes cleanly on the current head.
