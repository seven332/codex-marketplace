---
name: my-issues
description: List open GitHub issues assigned to or created by the current user, deduplicated and prioritized.
---

# My Issues

Use this skill when the user asks what GitHub issues they should work on.

## Workflow

1. Determine the current GitHub user:
   ```bash
   gh api user --jq '.login'
   ```
2. Fetch open issues assigned to that user and open issues authored by that user:
   ```bash
   gh issue list --assignee <user> --state open --json number,title,labels,assignees,author,createdAt,updatedAt --limit 50
   gh issue list --author <user> --state open --json number,title,labels,assignees,author,createdAt,updatedAt --limit 50
   ```
3. Include all assigned issues. Include authored issues only when unassigned or assigned only to
   the current user. Deduplicate by issue number.
4. Fetch issue bodies when needed to infer priority.
5. Sort into priority groups:
   - `P0`: blocks core functionality, data safety, security, or release.
   - `P1`: important user-facing work or newly assigned urgent tasks.
   - `P2`: useful improvements, scoped features, or non-blocking bugs.
   - `P3`: long-term maintenance or nice-to-have work.
6. Output a table grouped by priority, then suggest an execution order with rationale.
