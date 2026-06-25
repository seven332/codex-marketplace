---
name: issue-plan
description: Research a GitHub issue, explore options, and post an implementation plan.
---

# Issue Plan

Use this skill when the user asks to start planning work for a GitHub issue.

## Workflow

1. Determine the issue number from the user request or conversation context. Ask if unclear.
2. Fetch issue details:
   ```bash
   gh issue view <issue-number> --json title,body,comments,labels,url
   ```
3. Resolve `<temp-dir>` to the operating system temporary directory. Use `${TMPDIR:-/tmp}` on
   POSIX shells, `$env:TEMP` in PowerShell, or a standard library temp directory such as Python
   `tempfile.gettempdir()` or Node.js `os.tmpdir()` when scripting. Do not assume `/tmp` exists.
4. Choose an `<issue-task>` slug with only lowercase letters, numbers, and hyphens.
5. If the `deep-research`, `deep-innovate`, and `deep-plan` skills are installed, use them in
   sequence for the planning phases:
   - Pass the issue title, body, comments, labels, and URL as the task context.
   - Pass the selected `<issue-task>` slug and artifact directory so all phases write to the same
     `<temp-dir>/deep-dive/<issue-task>/` directory.
   - Use `<temp-dir>/deep-dive/<issue-task>/research.md`,
     `<temp-dir>/deep-dive/<issue-task>/innovate.md`, and
     `<temp-dir>/deep-dive/<issue-task>/plan.md` as the planning artifacts.
   - After `deep-innovate`, select an approach only when the issue context, research, and option
     analysis make the choice clear. If a human decision is needed, post the options summary or
     `innovate.md` to the issue, add `pending`, and stop instead of forcing a plan.
   - This skill owns the phase transitions, issue comments, and approval label. Do not implement.
6. If the full `deep-dive` workflow is unavailable, use the built-in fallback under
   `<temp-dir>/github-workflow/<issue-task>/`:
   - Research: read repository guidance such as `AGENTS.md`, README, tests, and relevant docs;
     search with `rg`; identify affected modules, constraints, patterns, and risks; write
     `research.md`.
   - Options: compare plausible approaches and trade-offs; call out rejected approaches and why;
     write `innovate.md`.
   - Plan: produce concrete implementation steps, test strategy, validation commands, and rollout,
     migration, or compatibility notes when relevant; write `plan.md`.
7. Post the final plan artifact or summary to the issue. Use the selected `plan.md` path:
   ```bash
   gh issue comment <issue-number> --body-file <selected-plan-path>
   ```
8. Add or create a `pending` label when waiting for human approval:
   ```bash
   gh label create pending --description "Waiting for human input" --color FFA500 2>/dev/null || true
   gh issue edit <issue-number> --add-label pending
   ```

Do not implement before the plan is approved unless the user explicitly asks to proceed.
