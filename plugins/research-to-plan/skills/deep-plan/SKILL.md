---
name: deep-plan
description: Create a concrete implementation plan from research notes and option analysis without editing code or running implementation steps.
---

# Deep Plan

Use this skill after `deep-research` and `deep-innovate` when the user wants a concrete
implementation plan for an approved or selected direction.

## Boundaries

Plan the work only. Do not modify repository source files, write code, run tests, create commits, or
execute the implementation. If the chosen direction is unclear, ask for confirmation before
writing the final plan.

Use the user's language unless repository guidance requires another language.

When another workflow skill calls this phase, follow that caller's scope, write the plan artifact,
and let the caller handle approval or publication.

Before reading or creating artifacts, read and follow the
[repository work-file contract](../../references/repository-work-files.md). Keep generated files in
the active workspace under `<codex-work>/research/`; never use an operating-system temp directory.

## Workflow

1. Resolve the artifact directory:
   - Use the caller-provided artifact directory only when it satisfies the repository work-file
     contract.
   - Otherwise use the caller-provided task slug if present.
   - Otherwise locate the matching `<codex-work>/research/<task-slug>/` directory.
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
