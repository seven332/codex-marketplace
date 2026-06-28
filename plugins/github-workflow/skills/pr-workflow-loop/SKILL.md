---
name: pr-workflow-loop
description: Repeat the end-to-end `pr-workflow` for one PR-sized issue at a time until the requested scope is complete, no clear next issue remains, or a blocker requires user input.
---

# PR Workflow Loop

Use this skill as the outer loop around `pr-workflow`. Do not copy or bypass its steps.

## Workflow

1. Determine the loop scope from the user request: count, parent issue, issue list, or stopping
   condition. If no scope is specified, run one iteration and reassess after each merge.
2. For each iteration, run `pr-workflow` for exactly one PR-sized issue.
3. While `pr-workflow` can fix in-scope problems and rerun its checks, continue the same iteration.
4. Stop when the current issue needs human input, is blocked, cannot be recovered safely, or leaves
   an unmerged PR.
5. After a successful merge, return to the latest default branch. Start the next iteration only when
   the next PR-sized issue is clear and within scope.

## Related Skills

- Use `pr-workflow` for each single-PR iteration.
- Use `issue-select` inside each `pr-workflow` iteration to choose one PR-sized issue.
