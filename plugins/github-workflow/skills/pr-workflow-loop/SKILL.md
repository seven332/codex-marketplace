---
name: pr-workflow-loop
description: Repeat `pr-workflow` one PR-sized issue at a time, selecting the next issue after each merge until the scope is complete, blocked, or no clear next issue remains.
---

# PR Workflow Loop

Use this skill as the outer loop around `pr-workflow`. Do not copy or bypass its steps.

## Workflow

1. Determine the loop scope from the user request: count, parent issue, issue list, repository-wide
   continuation, or stopping condition. If no scope is specified, keep looking repository-wide after
   each successful merge.
2. For each iteration, run `pr-workflow` for exactly one PR-sized issue, including its
   `issue-select` step.
3. While `pr-workflow` can fix in-scope problems and rerun its checks, continue the same iteration.
4. Stop when the current issue needs human input, is blocked, cannot be recovered safely, or leaves
   an unmerged PR.
5. After a successful merge, return to the latest default branch and start the next `pr-workflow`
   iteration only when the next PR-sized issue is clear within scope. Stop when the scope is
   complete, no clear next issue remains, or the current iteration leaves an unmerged PR.

## Related Skills

- Use `pr-workflow` for each single-PR iteration.
- Use `issue-select` inside each `pr-workflow` iteration to choose one PR-sized issue.
