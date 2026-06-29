---
name: pr-workflow-loop
description: Repeat `pr-workflow` one PR-sized issue at a time, letting each iteration reselect or split the best next issue after each merge until the scope is complete, blocked, or no suitable next issue remains.
---

# PR Workflow Loop

Use this skill as the outer loop around `pr-workflow`. Do not copy or bypass its steps.

## Workflow

1. Determine the loop scope from the user request. If no scope is specified, keep looking
   repository-wide after each successful merge.
2. For each iteration, run `pr-workflow` for exactly one PR-sized issue.
3. If `pr-workflow` can fix in-scope problems and rerun checks, continue the same iteration.
4. After a successful merge, return to the latest default branch and re-evaluate the whole scope
   before starting the next `pr-workflow` iteration. Prefer an existing PR-sized issue; otherwise
   let that iteration's `issue-select` split the best broad issue. In repository-wide loops, do not
   keep using the same parent unless it is still the best fit.
5. Stop when the scope is complete, the current issue is blocked or needs human input, useful
   splitting is blocked, no suitable next issue remains, or an iteration leaves an unmerged PR.

## Related Skills

- Use `pr-workflow` for each single-PR iteration.
- Use `issue-select` inside each `pr-workflow` iteration to choose one PR-sized issue.
