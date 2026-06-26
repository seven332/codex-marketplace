---
name: issue-implement
description: Implement an approved GitHub issue plan after planning or approval and hand off changes to the PR workflow.
---

# Issue Implement

Use this skill when the user asks to implement a GitHub issue after planning or approval.

## Workflow

1. Identify the issue number from the user request or conversation context. Ask if unclear. Do not
   require a planning directory before reading the issue; recover it from issue comments or local
   artifacts when possible.
2. Read issue updates:
   ```bash
   gh issue view <issue-number> --json title,body,comments,labels,url
   ```
3. Resolve `<temp-dir>` to the operating system temporary directory. Use `${TMPDIR:-/tmp}` on
   POSIX shells, `$env:TEMP` in PowerShell, or a standard library temp directory such as Python
   `tempfile.gettempdir()` or Node.js `os.tmpdir()` when scripting. Do not assume `/tmp` exists.
4. Read planning artifacts if present:
   - `<temp-dir>/deep-dive/<issue-task>/research.md`
   - `<temp-dir>/deep-dive/<issue-task>/innovate.md`
   - `<temp-dir>/deep-dive/<issue-task>/plan.md`
   - `<temp-dir>/github-workflow/<issue-task>/research.md`
   - `<temp-dir>/github-workflow/<issue-task>/innovate.md`
   - `<temp-dir>/github-workflow/<issue-task>/plan.md`
   Derive `<issue-task>` from the most recent `issue-plan` comment marker by comment chronology for
   this issue, the conversation context, or the selected artifact directory basename. Do not fall
   back to an older Plan Phase marker when a newer Research or Options marker exists; if the latest
   marker slug has no approved plan, stop for approval instead. If no marker or explicit directory
   is available, look for sanitized directories matching `issue-<issue-number>-*` under both
   planning roots.
   Prefer the artifact directory identified in conversation or issue comments. If both roots have
   plausible artifacts and the intended one is unclear, ask which to use. Only use sanitized
   planning directories under `<temp-dir>/deep-dive/` or `<temp-dir>/github-workflow/`. Do not
   follow symlinked planning directories or artifact files.
   If local artifacts are unavailable or incomplete, recover any missing Research Phase, Options
   Phase, and Plan Phase content from comments on the same issue. Prefer
   `codex-marketplace:issue-plan:issue-<issue-number>-<slug>:<phase>` markers, and fall back to the
   phase headings only for older comments without markers. Treat `## Innovation Phase` as a legacy
   heading for the options phase.
   If no approved plan is available in artifacts, issue body, issue comments, or conversation
   context, ask whether to run `issue-plan` first and stop.
5. Check `git status --short --branch` before branch changes. Stop if unrelated uncommitted changes
   are present. If on the repository default branch, create the feature branch before editing files.
6. If human comments after the latest `issue-plan` Plan Phase comment request plan changes or ask
   unresolved questions, update the plan or answer on the issue, add `pending`, and stop. Do not
   treat `issue-plan` phase artifact content itself, such as Options Phase open questions, as a new
   request unless a human explicitly asks about it.
7. Remove `pending` when resuming approved work:
   ```bash
   gh issue edit <issue-number> --remove-label pending 2>/dev/null || true
   ```
8. Create or switch to a feature branch, for example `feat/issue-<number>-short-name`.
9. Implement the approved plan in small steps. Do not silently diverge from the approved direction.
10. Add or update tests for behavior changes.
11. Run documented validation commands.
12. Commit, push, and create a PR. If the `pull-request` skill is installed, use its `create`
    workflow for these steps instead of running a separate PR flow. Otherwise commit with
    Conventional Commits, push the branch, and create a PR. Include the issue link and validation
    commands in the PR body.

If implementation becomes blocked, post a concise issue comment explaining the blocker, create the
`pending` label if needed, add it, and stop:

```bash
gh label create pending --description "Waiting for human input" --color FFA500 2>/dev/null || true
gh issue edit <issue-number> --add-label pending
```
