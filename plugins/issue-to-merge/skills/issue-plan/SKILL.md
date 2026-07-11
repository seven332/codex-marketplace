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
   gh issue view <issue-number> \
     --json title,body,comments,labels,parent,subIssues,subIssuesSummary,blockedBy,blocking,url
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
   - When resuming planning work, also look for directories matching `issue-<issue-number>-*` under
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
     selected directory, rerun from the earliest missing or stale phase, and publish each completed
     phase through step 7.
6. Require `research-to-plan:deep-research`, `research-to-plan:deep-innovate`, and
   `research-to-plan:deep-plan`. If any
   of those prefixed skills is unavailable, stop and ask the user to install or enable the
   `research-to-plan` plugin. Use the Research to Plan skills in sequence for the planning phases:
   - Pass the issue title, body, comments, labels, and URL as the task context.
   - Pass the selected `<issue-task>` slug and artifact directory so all phases write to the same
     `<temp-dir>/deep-dive/<issue-task>/` directory.
   - Complete Research by running `research-to-plan:deep-research` or reusing non-stale
     `research.md`, then publish it through step 7 before continuing.
   - Complete Options by running `research-to-plan:deep-innovate` or reusing non-stale
     `innovate.md`, then publish it through step 7 before continuing.
   - Select an approach only when the issue context, research, and option analysis make the choice
     clear. If a human decision is needed, add `codex-pending` using the label command in step 8,
     and stop instead of forcing a plan.
   - Complete Plan by running `research-to-plan:deep-plan` or reusing non-stale `plan.md`, then
     publish it through step 7.
   - If the best direction cannot fit one independently reviewable PR, treat this issue as a
     planning parent. Keep the end-to-end design and acceptance criteria in its Plan, define
     coherent delivery slices and dependencies, and identify integration, migration, and rollout
     gates. Do not disguise a multi-PR delivery as one implementation task or create weak slices
     merely to minimize each diff.
   - This skill owns the phase transitions, issue comments, and approval label. Do not implement.
7. To publish a phase comment, inspect existing issue comments first. Skip only when reusing a
   non-stale artifact whose matching marker already exists and no earlier phase comment was posted
   in this run. Never post phase comments in parallel; wait for each `gh issue comment` to finish
   before continuing. Use a stable marker plus a visible heading in each generated comment body:
   ```markdown
   <!-- codex-marketplace:issue-plan:<issue-task>:research -->
   ## Research Phase

   <research.md content>
   ```
   Use marker suffixes `research`, `options`, and `plan`. Build each comment body in a temporary
   file by copying the relevant artifact below the heading, then post it with
   `gh issue comment <issue-number> --body-file <phase-comment-path>`.
   Before posting, ensure the comment fits GitHub's accepted body size. If a Research or Options
   artifact is too large, publish a self-contained summary and keep the complete local artifact.
   Keep the Plan Phase complete enough to implement without relying on unpublished details.
8. Add or create the workflow-owned `codex-pending` label when waiting for human input, including
   after posting a Plan Phase without explicit implementation approval:
   ```bash
   gh label create codex-pending --description "Waiting for Codex workflow input" --color FFA500 2>/dev/null || true
   gh issue edit <issue-number> --add-label codex-pending
   ```
   Treat the label as a visual signal only. Use phase markers, comment chronology, and explicit
   approval as the authoritative workflow state.

Do not implement before the plan is approved unless the user explicitly asks to proceed.
