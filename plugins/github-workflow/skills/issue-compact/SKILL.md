---
name: issue-compact
description: Consolidate a GitHub issue discussion into a clean handoff-ready issue body.
---

# Issue Compact

Use this skill when the user asks to compact or consolidate a GitHub issue discussion.

## Workflow

1. Determine the issue number from the user request or conversation context. Ask if unclear.
2. Fetch issue content:
   ```bash
   gh issue view <issue-number> --json number,title,body,comments,url
   ```
3. Analyze the issue body, comments, and relevant conversation context.
4. Draft a new issue body that preserves:
   - Original requirement and current scope
   - Decisions and rationale
   - Technical discoveries and constraints
   - Current status
   - Next steps
   - Open questions and blockers
5. Add compact metadata at the bottom:
   ```markdown
   ---
   > Compacted on YYYY-MM-DD from N comments.
   ```
6. Write the draft to `/tmp/issue-<number>-compact.md`.
7. Before deleting comments, show the summary of what will be preserved and ask for explicit user
   confirmation unless the user already explicitly requested comment deletion.
8. Update the issue body:
   ```bash
   gh issue edit <issue-number> --body-file /tmp/issue-<number>-compact.md
   ```
9. If confirmed, delete superseded comments through the GitHub API. Report how many comments were
   removed.

Do not lose requirements, decisions, or blockers. If the issue has no comments, report that there
is nothing to compact.
