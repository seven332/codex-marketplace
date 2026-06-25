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
6. Create a temporary compact body file using the operating system temp directory. On POSIX shells,
   `ISSUE_COMPACT_FILE=$(mktemp "${TMPDIR:-/tmp}/issue-compact.XXXXXX")` is acceptable; in
   PowerShell, use `New-TemporaryFile` or another OS temp-file API. Examples below use POSIX
   variable syntax; use equivalent syntax in other shells. Write the draft there.
7. Show the draft path and a concise summary of what will be preserved. Ask for explicit user
   confirmation before updating the issue body unless the user already explicitly approved the
   compacted body update.
8. Update the issue body only after confirmation:
   ```bash
   gh issue edit <issue-number> --body-file "$ISSUE_COMPACT_FILE"
   ```
9. Before deleting comments, list the exact comment IDs, authors, timestamps, and one-line summaries
   that would be deleted. Ask for separate explicit confirmation unless the user already explicitly
   requested deletion of those exact comments. If confirmed, delete only the listed superseded
   comments through the GitHub API. Report how many comments were removed.

Do not lose requirements, decisions, or blockers. If the issue has no comments, report that there
is nothing to compact.
