# Codex Marketplace

Repo-local marketplace scaffold for Codex plugins.

## Layout

```text
.
├── .agents/plugins/marketplace.json
├── plugins/
│   └── marketplace-starter/
│       ├── .codex-plugin/plugin.json
│       └── skills/marketplace-starter/SKILL.md
└── scripts/validate-marketplace.mjs
```

## Use Locally

From this repository root:

```bash
codex plugin marketplace add .
codex plugin marketplace list
```

Then restart Codex, open the plugin directory, select `Codex Marketplace`, and install
`Marketplace Starter`.

For development, edit files under `plugins/<plugin-name>/`, then reinstall the plugin or refresh
the marketplace from Codex.

## Add A Plugin

1. Create `plugins/<plugin-name>/.codex-plugin/plugin.json`.
2. Put skills under `plugins/<plugin-name>/skills/`.
3. Add a matching entry to `.agents/plugins/marketplace.json`.
4. Run:

```bash
node scripts/validate-marketplace.mjs
```

or:

```bash
npm run validate
```

Marketplace entries should keep `source.path` relative to the repository root and start with `./`.

## Plugins

- `marketplace-starter` - Example plugin for validating this marketplace scaffold.
- `code-quality` - General-purpose review and cleanup workflows that start from each repository's
  own quality and testing documentation.
