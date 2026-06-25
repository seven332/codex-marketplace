---
name: deep-research
description: Research a complex software task before solution discussion by gathering facts, mapping code, and writing deep-dive research notes.
---

# Deep Research

Use this skill for the research phase of complex work when the user wants investigation, codebase
understanding, root-cause analysis, or technical discovery before discussing solutions.

## Boundaries

During this phase, gather facts only. Do not propose fixes, designs, implementation approaches,
roadmaps, or recommendations. It is acceptable to record constraints, risks, unknowns, and observed
trade-offs as facts.

Use the user's language unless repository guidance requires another language.

When another workflow skill calls this phase, follow that caller's scope and return the research
artifact without asking phase-transition questions unless required context is missing.

Resolve `<temp-dir>` to the operating system temporary directory before creating artifacts. Use
`${TMPDIR:-/tmp}` on POSIX shells, `$env:TEMP` in PowerShell, or a standard library temp directory
such as Python `tempfile.gettempdir()` or Node.js `os.tmpdir()` when scripting. Do not assume
`/tmp` exists.

Keep generated artifacts under `<temp-dir>/deep-dive/` unless the user explicitly requests another
output location. Use sanitized task slugs and avoid `..` path segments.

## Workflow

1. Clarify the task only when the scope is ambiguous.
2. Resolve the artifact directory:
   - Use the caller-provided artifact directory only when it is under `<temp-dir>/deep-dive/` or
     the user explicitly requested that location.
   - Otherwise use the caller-provided task slug if present.
   - Otherwise choose a sanitized task slug using lowercase letters, numbers, and hyphens.
   The default artifact directory is `<temp-dir>/deep-dive/<task-slug>/`.
3. Create `research.md` in the resolved artifact directory.
4. Read repository guidance first, such as `AGENTS.md`, `CONTRIBUTING.md`, README files, docs,
   package scripts, test configuration, and nearby tests.
5. Research systematically:
   - Identify relevant entry points, modules, commands, data flows, and dependencies.
   - Trace callers and state changes rather than only reading changed lines.
   - Separate known facts from assumptions and unknowns.
   - Check project docs before applying generic conventions.
   - For third-party APIs, SDKs, protocols, or current external behavior, use official
     documentation or current sources when needed.
6. Write findings to `research.md` as you go. Prefer concise sections such as:
   - Scope
   - Repository Guidance Read
   - Relevant Files And Flows
   - Constraints
   - Unknowns
   - Verification Surface
7. Finish by summarizing factual findings and asking what should happen next, unless a caller
   workflow owns the next step.

## Output

Report the research file path and a short facts-only summary. Do not include recommendations in the
research summary.
