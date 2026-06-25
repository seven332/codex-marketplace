---
name: deep-plan
description: Create a concrete implementation plan from deep-dive research and option analysis without editing code or running implementation steps.
---

# Deep Plan

Use this skill after `deep-research` and `deep-innovate` when the user wants a concrete
implementation plan for an approved or selected direction.

## Boundaries

Plan the work only. Do not modify files, write code, run tests, create commits, or execute the
implementation. If the chosen direction is unclear, ask for confirmation before writing the final
plan.

Use the user's language unless repository guidance requires another language.

When another workflow skill calls this phase, follow that caller's scope, write the plan artifact,
and let the caller handle approval or publication.

Resolve `<temp-dir>` to the operating system temporary directory before reading or creating
artifacts. Use `${TMPDIR:-/tmp}` on POSIX shells, `$env:TEMP` in PowerShell, or a standard library
temp directory such as Python `tempfile.gettempdir()` or Node.js `os.tmpdir()` when scripting. Do
not assume `/tmp` exists.

Keep generated artifacts under `<temp-dir>/deep-dive/` unless the user explicitly requests another
output location. Use sanitized task slugs and avoid `..` path segments.

## Workflow

1. Resolve the artifact directory:
   - Use the caller-provided artifact directory only when it is under `<temp-dir>/deep-dive/` or
     the user explicitly requested that location.
   - Otherwise use the caller-provided task slug if present.
   - Otherwise locate the matching `<temp-dir>/deep-dive/<task-slug>/` directory.
2. Read `research.md` and `innovate.md` from the resolved artifact directory. If either is missing,
   ask whether to run the missing phase first.
3. Confirm the chosen approach if the user or caller workflow has not already selected one.
4. Create `plan.md` in the resolved artifact directory.
5. Write a concrete plan with:
   - Goal and chosen approach
   - Ordered implementation tasks
   - Files or modules likely to change
   - Data, API, migration, compatibility, or rollout notes when relevant
   - Test strategy and validation commands from repository docs
   - Risks, blockers, and open questions
   - Definition of done
6. Keep each task actionable, but avoid writing code or pseudo-code unless the user specifically
   requested technical sketching.

## Output

Report the plan file path and summarize the plan. Ask for approval before implementation unless a
caller workflow owns approval handling.
