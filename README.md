# Codex Marketplace

Repo-local marketplace scaffold for Codex plugins.

## Layout

```text
.
├── .agents/plugins/marketplace.json
├── plugins/
│   ├── code-quality/
│   │   ├── .codex-plugin/plugin.json
│   │   └── skills/code-quality/SKILL.md
│   ├── deep-dive/
│   │   ├── .codex-plugin/plugin.json
│   │   └── skills/
│   └── github-workflow/
│       ├── .codex-plugin/plugin.json
│       └── skills/
├── schemas/
│   ├── marketplace.schema.json
│   └── plugin.schema.json
└── scripts/
    ├── validate-marketplace.mjs
    └── validate-marketplace.test.mjs
```

## Use Locally

From this repository root:

```bash
codex plugin marketplace add .
codex plugin marketplace list
```

Then restart Codex, open the plugin directory, select `Codex Marketplace`, and install
`Code Quality`, `Deep Dive`, or `GitHub Workflow`.

For development, edit files under `plugins/<plugin-name>/`, then reinstall the plugin or refresh
the marketplace from Codex.

## Add A Plugin

1. Create `plugins/<plugin-name>/.codex-plugin/plugin.json`.
2. Put skills under `plugins/<plugin-name>/skills/`.
3. Add a matching entry to `.agents/plugins/marketplace.json`.
4. Run the full validation suite:

```bash
npm test
```

For a quick schema and repository-structure check without regression tests, run:

```bash
npm run validate
```

Marketplace entries and plugin manifests are checked against project-owned JSON Schemas in `schemas/`.
These schemas are not official Codex schemas; they are derived from the current `openai/codex`
marketplace and plugin manifest parsers and kept in this repository for CI. The validator adds
repository-local safety checks for local plugin sources, including path containment, symlink escape
protection, manifest name matching, and skill file checks. Local marketplace entries should keep
plugin paths relative to the repository root and stay inside this repository. Pull requests run the
same validation in GitHub Actions.

## Plugins

- `code-quality` - General-purpose review and cleanup workflows that start from each repository's
  own quality and testing documentation.
- `deep-dive` - Structured research, option exploration, and planning phases for complex software
  tasks before implementation.
- `github-workflow` - GitHub issue and pull request workflows for planning, implementation,
  review, CI checks, rebasing, and issue maintenance.
