---
name: deep-innovate
description: Explore multiple solution approaches and trade-offs from existing deep-dive research without committing to an implementation plan.
---

# Deep Innovate

Use this skill after `deep-research` when the user wants solution exploration, architectural
alternatives, or trade-off analysis before choosing a direction.

## Boundaries

Explore options but do not create a step-by-step implementation plan, write code, edit files,
commit to one solution, or estimate timelines unless the user explicitly asks for that kind of
decision support. Keep implementation details high level.

Use the user's language unless repository guidance requires another language.

When another workflow skill calls this phase, follow that caller's scope and return the innovation
artifact without asking phase-transition questions unless required context is missing.

Resolve `<temp-dir>` to the operating system temporary directory before reading or creating
artifacts. Use `${TMPDIR:-/tmp}` on POSIX shells, `$env:TEMP` in PowerShell, or a standard library
temp directory such as Python `tempfile.gettempdir()` or Node.js `os.tmpdir()` when scripting. Do
not assume `/tmp` exists.

## Workflow

1. Locate the matching `<temp-dir>/deep-dive/<task-slug>/research.md`. If no matching research exists,
   ask whether to run `deep-research` first.
2. Read the research document and relevant repository guidance it references.
3. Create `<temp-dir>/deep-dive/<task-slug>/innovate.md`.
4. Generate at least two credible approaches when possible. For each approach, document:
   - Core idea
   - Advantages
   - Risks and trade-offs
   - Fit with existing architecture and project conventions
   - Validation implications
5. Compare approaches explicitly:
   - Where they differ
   - What assumptions they depend on
   - What constraints from research matter most
6. Record open questions that should be answered before planning.

## Output

Report the innovation file path, summarize the main options, and ask which direction to plan unless
a caller workflow owns that decision.
