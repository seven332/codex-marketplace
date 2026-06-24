# Repository Guidelines

## Project Structure & Module Organization

This repository is a Codex plugin marketplace. Marketplace metadata lives in
`.agents/plugins/marketplace.json`. Installable plugins live under
`plugins/<plugin-name>/`, and each plugin must include
`plugins/<plugin-name>/.codex-plugin/plugin.json`. Plugin skills belong in
`plugins/<plugin-name>/skills/<skill-name>/SKILL.md`. Validation tooling is in
`scripts/`, currently `scripts/validate-marketplace.mjs`.

## Build, Test, and Development Commands

- `npm run validate` - validates marketplace entries, plugin manifests, plugin paths, and skill files.
- `npm test` - runs validator regression tests, then runs marketplace validation.
- `python3 /Users/liangyou/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/<plugin-name>` - validates an individual plugin against Codex plugin manifest rules.

Run validation before opening or updating a pull request.

## Coding Style & Naming Conventions

Use JSON for marketplace and plugin manifests, with two-space indentation. Plugin names should be
lowercase kebab-case, for example `code-quality` or `github-tools`. Keep paths relative and
prefixed with `./` where Codex expects relative paths, such as `./plugins/code-quality` and
`./skills/`. Markdown files should be concise, structured with clear headings, and written in
English.

## Testing Guidelines

There is no application runtime test suite yet. Treat validation as the required test surface:
`npm test` for validator regression coverage and marketplace validation, plus `validate_plugin.py`
for every plugin changed. When editing a skill, read it as rendered Markdown and check for broken
code fences, stale paths, and project-specific assumptions that should not apply globally.

## Commit & Pull Request Guidelines

Use Conventional Commits, matching existing history:
`feat: add code quality plugin (#2)`. Prefer lowercase descriptions and no trailing period. Pull
requests should explain what plugin or marketplace behavior changed, list validation commands run,
and link relevant source material when a plugin is adapted from another project.

## Agent-Specific Instructions

Do not overwrite an existing plugin without checking its manifest and marketplace entry. Preserve
unrelated user changes. Avoid `git commit --amend` and force pushes unless the user explicitly asks.
