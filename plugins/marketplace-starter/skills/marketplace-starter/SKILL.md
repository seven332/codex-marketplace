---
name: marketplace-starter
description: Explain this Codex marketplace scaffold and help add new plugins to it.
---

# Marketplace Starter

Use this skill when the user asks how this marketplace is structured or wants to add another
Codex plugin to this repository.

## Workflow

1. Inspect `.agents/plugins/marketplace.json`.
2. Create or update the plugin directory under `plugins/<plugin-name>/`.
3. Keep the plugin manifest at `plugins/<plugin-name>/.codex-plugin/plugin.json`.
4. Put reusable task instructions under `plugins/<plugin-name>/skills/<skill-name>/SKILL.md`.
5. Add one matching marketplace entry with `source.path` set to `./plugins/<plugin-name>`.
6. Run `node scripts/validate-marketplace.mjs` before handing back changes.

## Rules

- Plugin names should be lower-case kebab-case.
- Manifest paths should be relative to the plugin root and start with `./`.
- Marketplace source paths should be relative to the repository root and start with `./`.
- Every marketplace entry should include `policy.installation`, `policy.authentication`, and
  `category`.
