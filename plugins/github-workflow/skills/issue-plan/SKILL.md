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
   short title. Use only lowercase letters, numbers, and hyphens. If the sanitized title would be
   empty, use `task` as the title segment. This keeps artifact directories and comment markers
   unique per issue.
5. Select one artifact directory for this issue:
   - If issue comments already contain valid `issue-plan` markers for this issue, reuse the slug
     from the most recent marker by comment chronology before checking local artifact directories.
     Accept only markers whose slug matches `issue-<issue-number>-[a-z0-9-]+` and whose phase is
     `research`, `options`, or `plan`; ignore malformed markers and markers for other issues.
   - Check `<temp-dir>/deep-dive/<issue-task>/` for `research.md`, `innovate.md`, and `plan.md`.
   - When resuming older work, also look for directories matching `issue-<issue-number>-*` under
     `<temp-dir>/deep-dive/`. If multiple plausible directories exist and the intended one is
     unclear, ask which directory to use.
   - Use only sanitized artifact directories under `<temp-dir>/deep-dive/`. Do not follow symlinked
     artifact directories or files.
   - If reusing an existing directory whose basename differs from the initial slug, use that
     basename as `<issue-task>` so artifact paths and comment markers stay aligned.
   - Prefer an existing directory with artifacts. If none exists, use
     `<temp-dir>/deep-dive/<issue-task>/`.
   - Before reusing an existing phase artifact, compare it with later issue updates. Treat a phase
     as stale when the issue title, body, labels, or human comments after that phase was created or
     posted materially change its inputs. A human comment that only selects one of the posted
     options does not make Research or Options stale; use that selection as Plan input.
   - Do not split one run across artifact roots. Reuse existing non-stale phase artifacts from the
     selected directory and run only missing or stale phases, starting from the earliest affected
     phase. Still post any phase comment that is missing or regenerated according to step 7.
6. Require `deep-dive:deep-research`, `deep-dive:deep-innovate`, and `deep-dive:deep-plan`. If any
   of those prefixed skills is unavailable, stop and ask the user to install or enable the
   `deep-dive` plugin. Use the deep-dive skills in sequence for the planning phases:
   - Pass the issue title, body, comments, labels, and URL as the task context.
   - Pass the selected `<issue-task>` slug and artifact directory so all phases write to the same
     `<temp-dir>/deep-dive/<issue-task>/` directory.
   - Use `<temp-dir>/deep-dive/<issue-task>/research.md`,
     `<temp-dir>/deep-dive/<issue-task>/innovate.md`, and
     `<temp-dir>/deep-dive/<issue-task>/plan.md` as the planning artifacts.
   - After `deep-dive:deep-research`, publish the research artifact through step 7 as a Research
     Phase issue comment.
   - After `deep-dive:deep-innovate`, publish the innovation artifact through step 7 as an Options
     Phase issue comment.
   - After `deep-dive:deep-innovate`, select an approach only when the issue context, research, and
     option analysis make the choice clear. If a human decision is needed, add `pending` using the
     label command in step 8, and stop instead of forcing a plan.
   - After `deep-dive:deep-plan`, publish the plan artifact through step 7 as a Plan Phase issue
     comment.
   - This skill owns the phase transitions, issue comments, and approval label. Do not implement.
7. Post at most one comment per completed phase for this run in this order: Research, Options, Plan.
   Only post a phase when its artifact exists. If planning stops after Options while waiting for a
   human decision, skip the Plan Phase comment. Before posting a reused phase, inspect existing issue
   comments and skip it if the matching marker already exists. For reused phases only, if older
   comments do not have markers, treat a matching phase heading on the same issue as already posted.
   For the options phase, accept either `## Options Phase` or legacy `## Innovation Phase` headings.
   If a stale phase was regenerated, post the updated phase even when a prior matching marker or
   legacy heading exists, using the same marker so the latest matching marker by comment chronology
   is authoritative. Use a stable marker plus a visible heading in each generated comment body:
   ```markdown
   <!-- codex-marketplace:issue-plan:<issue-task>:research -->
   ## Research Phase

   <research.md content>
   ```
   Use marker suffixes `research`, `options`, and `plan`. Build each comment body in a temporary
   file by copying the relevant artifact below the heading, then post it with
   `gh issue comment <issue-number> --body-file <phase-comment-path>`.
8. Add or create a `pending` label when waiting for human input, including after posting a Plan
   Phase without explicit implementation approval:
   ```bash
   gh label create pending --description "Waiting for human input" --color FFA500 2>/dev/null || true
   gh issue edit <issue-number> --add-label pending
   ```

Do not implement before the plan is approved unless the user explicitly asks to proceed.
