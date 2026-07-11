---
name: pr-workflow-loop
description: Repeatedly run the full PR workflow for one PR-sized issue at a time and merge each ready PR until the requested scope is complete, blocked, or has no suitable next issue. Use only when the user explicitly requests a multi-PR merge loop.
---

# PR Workflow Loop

Treat an explicit request to run this skill as approval to normally merge each PR that reaches
current-head readiness. It does not authorize admin bypasses, destructive cleanup, or force-pushing
without the separate approval required by those actions.

## Workflow

1. Determine the loop scope from the user request. If none is specified, re-evaluate suitable work
   repository-wide after each merge.
2. For each iteration, run `pr-workflow` for exactly one PR-sized issue with merge approval supplied
   by this loop invocation. Do not bypass any planning, challenge, review, feedback, or CI stage.
3. Fix recoverable in-scope problems inside the same iteration and repeat the current-head review
   loop. Stop when the workflow needs a material human decision.
4. After a successful merge, use `sync-default-branch` and re-evaluate the whole requested scope.
   Prefer an existing PR-sized issue; otherwise let the next `issue-select` split the best broad
   issue. Do not keep selecting the same parent automatically when another issue is now a better fit.
5. Stop when the scope is complete, the current issue or PR is blocked, useful splitting is blocked,
   no suitable issue remains, a merge is not authorized, or an iteration leaves an unmerged PR.

## Related Skills

- Use `pr-workflow` for each single-PR iteration.
- Use `issue-select` inside each iteration to choose one PR-sized issue.
