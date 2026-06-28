---
name: pr-review-loop
description: Run the pre-merge PR self-review loop, fixing in-scope issues, recording out-of-scope issues, and repeating focused review passes until clean.
---

# PR Review Loop

Use this skill when the user asks to run the PR review loop, self-review a submitted pull request,
or repeatedly inspect and fix PR issues before final PR review or merge.

## Workflow

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

## Related Skills

- Use `pull-request` before this skill when a PR has not been created or updated yet.
- Use `pr-review` after this skill completes with no new findings.
