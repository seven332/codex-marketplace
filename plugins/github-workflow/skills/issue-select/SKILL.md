---
name: issue-select
description: Select or create one PR-sized GitHub issue, including sub-issue selection and GitHub sub-issue relationships, before planning or implementation work.
---

# Issue Select

Use this skill when the user asks to choose the next issue for a PR, avoid duplicate GitHub issues,
or split a broad GitHub issue into one PR-sized sub-issue.

## Workflow

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

## Related Skills

- Use `issue-create` when a new issue must be created from conversation or repository context.
- Use `issue-plan` after selecting the issue.
