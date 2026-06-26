---
name: issue-plan
description: Research a GitHub issue, explore options, and post phase comments with an implementation plan.
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
4. Choose an `<issue-task>` slug that starts with `issue-<issue-number>-`, followed by a sanitized
   short title. Use only lowercase letters, numbers, and hyphens. This keeps artifact directories
   and comment markers unique per issue.
5. Select one artifact directory for this issue:
   - If issue comments already contain `issue-plan` markers for this issue, reuse the latest marker
     slug as `<issue-task>` before checking local artifact directories.
   - Check `<temp-dir>/deep-dive/<issue-task>/` and
     `<temp-dir>/github-workflow/<issue-task>/` for `research.md`, `innovate.md`, and `plan.md`.
   - When resuming older work, also look for directories matching `issue-<issue-number>-*` under
     those two roots. If multiple plausible directories exist and the intended one is unclear, ask
     which directory to use.
   - Use only sanitized artifact directories under those roots. Do not follow symlinked artifact
     directories or files.
   - If reusing an existing directory whose basename differs from the initial slug, use that
     basename as `<issue-task>` so artifact paths and comment markers stay aligned.
   - Prefer an existing directory with artifacts. If none exists, use
     `<temp-dir>/deep-dive/<issue-task>/` for the full `deep-dive` workflow or
     `<temp-dir>/github-workflow/<issue-task>/` for the built-in fallback.
   - Do not split one run across artifact roots. Reuse existing phase artifacts from the selected
     directory and run only missing phases. Still post any phase comment that is not already present
     according to step 8.
6. If the selected artifact directory is under `<temp-dir>/deep-dive/` and the `deep-research`,
   `deep-innovate`, and `deep-plan` skills are installed, use them in sequence for the planning
   phases:
   - Pass the issue title, body, comments, labels, and URL as the task context.
   - Pass the selected `<issue-task>` slug and artifact directory so all phases write to the same
     `<temp-dir>/deep-dive/<issue-task>/` directory.
   - Use `<temp-dir>/deep-dive/<issue-task>/research.md`,
     `<temp-dir>/deep-dive/<issue-task>/innovate.md`, and
     `<temp-dir>/deep-dive/<issue-task>/plan.md` as the planning artifacts.
   - After `deep-research`, post the research artifact as a Research Phase issue comment.
   - After `deep-innovate`, post the innovation artifact as an Options Phase issue comment.
   - After `deep-innovate`, select an approach only when the issue context, research, and option
     analysis make the choice clear. If a human decision is needed, add `pending` using the label
     command in step 9, and stop instead of forcing a plan.
   - After `deep-plan`, post the plan artifact as a Plan Phase issue comment.
   - This skill owns the phase transitions, issue comments, and approval label. Do not implement.
7. If the full `deep-dive` workflow is unavailable or the selected artifact directory is under
   `<temp-dir>/github-workflow/`, use the built-in fallback in the selected artifact directory.
   Create the artifact directory before writing files:
   - Research: read repository guidance such as `AGENTS.md`, README, tests, and relevant docs;
     search with `rg`; identify affected modules, constraints, patterns, and risks; write
     `research.md`, then post it as a Research Phase issue comment.
   - Options: compare plausible approaches and trade-offs; call out rejected approaches and why;
     write `innovate.md`, then post it as an Options Phase issue comment.
   - Plan: produce concrete implementation steps only when the direction is clear. If a human
     decision is needed, add `pending` using the label command in step 9, and stop. Otherwise
     include test strategy, validation commands, and rollout, migration, or compatibility notes when
     relevant; write `plan.md`, then post it as a Plan Phase issue comment.
8. Post at most one comment per completed phase in this order: Research, Options, Plan. Only post a
   phase when its artifact exists. If planning stops after Options while waiting for a human
   decision, skip the Plan Phase comment. Before posting a phase, inspect existing issue comments
   and skip it if the matching marker already exists. If older comments do not have markers, treat a
   matching phase heading on the same issue as already posted. For the options phase, accept either
   `## Options Phase` or legacy `## Innovation Phase` headings. Use a stable marker plus a visible
   heading in each generated comment body:
   ```markdown
   <!-- codex-marketplace:issue-plan:<issue-task>:research -->
   ## Research Phase

   <research.md content>
   ```
   Use marker suffixes `research`, `options`, and `plan`. Build each comment body in a temporary
   file by copying the relevant artifact below the heading, then post it with
   `gh issue comment <issue-number> --body-file <phase-comment-path>`.
9. Add or create a `pending` label when waiting for human approval:
   ```bash
   gh label create pending --description "Waiting for human input" --color FFA500 2>/dev/null || true
   gh issue edit <issue-number> --add-label pending
   ```

Do not implement before the plan is approved unless the user explicitly asks to proceed.
