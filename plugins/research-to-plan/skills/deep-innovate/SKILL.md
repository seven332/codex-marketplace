---
name: deep-innovate
description: Explore multiple solution approaches and trade-offs from existing research notes without committing to an implementation plan.
---

# Deep Innovate

Use this skill after `deep-research` when the user wants solution exploration, architectural
alternatives, or trade-off analysis before choosing a direction.

## Boundaries

Explore options but do not create a step-by-step implementation plan, write code, edit repository
source files, commit to one solution, or estimate timelines unless the user explicitly asks for
that kind of decision support. Keep implementation details high level.

Use the user's language unless repository guidance requires another language.

When another workflow skill calls this phase, follow that caller's scope and return the innovation
artifact without asking phase-transition questions unless required context is missing.

Before reading or creating artifacts, read and follow the
[repository work-file contract](../../references/repository-work-files.md). Keep generated files in
the active workspace under `<codex-work>/research/`; never use an operating-system temp directory.

## Workflow

1. Resolve the artifact directory:
   - Use the caller-provided artifact directory only when it satisfies the repository work-file
     contract.
   - Otherwise use the caller-provided task slug if present.
   - Otherwise locate the matching `<codex-work>/research/<task-slug>/` directory.
   If no matching `research.md` exists, ask whether to run `deep-research` first.
2. Read `research.md` from the resolved artifact directory and relevant repository guidance it
   references.
3. Create `innovate.md` in the resolved artifact directory.
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
