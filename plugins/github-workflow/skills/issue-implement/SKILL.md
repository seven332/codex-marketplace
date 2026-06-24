---
name: issue-implement
description: Implement an approved GitHub issue plan and create a pull request.
---

# Issue Implement

Use this skill when the user asks to implement a GitHub issue after planning or approval.

## Workflow

1. Identify the issue number and planning directory from conversation context. Ask if unclear.
2. Read issue updates:
   ```bash
   gh issue view <issue-number> --json title,body,comments,labels,url
   ```
3. Read planning artifacts if present:
   - `/tmp/github-workflow/<task>/research.md`
   - `/tmp/github-workflow/<task>/innovate.md`
   - `/tmp/github-workflow/<task>/plan.md`
4. If comments request plan changes or ask questions, update the plan or answer on the issue, add
   `pending`, and stop.
5. Remove `pending` when resuming approved work:
   ```bash
   gh issue edit <issue-number> --remove-label pending 2>/dev/null || true
   ```
6. Create or switch to a feature branch, for example `feat/issue-<number>-short-name`.
7. Implement the approved plan in small steps. Do not silently diverge from the approved direction.
8. Add or update tests for behavior changes.
9. Run documented validation commands.
10. Commit with Conventional Commits.
11. Push and create a PR. Include the issue link and validation commands in the PR body.

If implementation becomes blocked, post a concise issue comment explaining the blocker, create the
`pending` label if needed, add it, and stop:

```bash
gh label create pending --description "Waiting for human input" --color FFA500 2>/dev/null || true
gh issue edit <issue-number> --add-label pending
```
