# Codex Marketplace

Repo-local marketplace scaffold for Codex plugins.

## Layout

```text
.
├── .agents/plugins/marketplace.json
├── plugins/
│   ├── code-quality/
│   │   ├── .codex-plugin/plugin.json
│   │   ├── references/repository-work-files.md
│   │   └── skills/code-quality/SKILL.md
│   ├── issue-to-merge/
│   │   ├── .codex-plugin/plugin.json
│   │   ├── references/
│   │   │   ├── current-issue-state.md
│   │   │   └── repository-work-files.md
│   │   └── skills/
│   └── research-to-plan/
│       ├── .codex-plugin/plugin.json
│       ├── references/repository-work-files.md
│       └── skills/
├── schemas/
│   ├── marketplace.schema.json
│   └── plugin.schema.json
└── scripts/
    ├── validate-marketplace.mjs
    └── validate-marketplace.test.mjs
```

Each `repository-work-files.md` is an internal contract shared by skills in that independently
installable plugin. It is packaged with the plugin and loaded only when a referencing skill needs
to create or read workflow-owned files.
Issue to Merge also packages `current-issue-state.md` for three editable phase comments, review state,
open-issue write checks, and proof-based reopening of the agent's own latest close.

## Use Locally

From this repository root:

```bash
codex plugin marketplace add .
codex plugin marketplace list
```

Then restart Codex, open the plugin directory, select `Codex Marketplace`, and install
`Code Quality`, `Issue to Merge`, or `Research to Plan`.

For development, edit files under `plugins/<plugin-name>/`, then reinstall the plugin or refresh
the marketplace from Codex.

Skills that generate research, review reports, drafts, or command payloads keep them under the
active repository's ignored `codex-work/` directory. They do not write new artifacts to the
operating system's temporary directory. Resumable artifacts stay in `research/` or `reviews/`;
reviewable drafts stay in `drafts/`; close receipts stay in `state/`; short-lived GitHub command
payloads use `tmp/` and are removed after use.

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
- `research-to-plan` - Structured research, option exploration, and planning phases for complex software
  tasks before implementation.
- `issue-to-merge` - GitHub issue and pull request workflows for pre-plan framing challenge,
  planning, post-plan solution challenge, PR-sized decomposition and parent delivery tracking,
  implementation, submission, human and automated review feedback, CI checks, explicit merging,
  branch updates, and issue maintenance. Planning maintains three Research, Options, and Plan
  comments on each open issue. Replanning edits those same comments instead of combining them or
  appending another set; workflow state stays inside the relevant phase. The body holds current
  requirements and delivery progress. Verified superseded agent copies are removed after
  consolidation, while the current three phases and human discussion are preserved. Closed issues
  remain read-only unless the workflow can prove it is undoing the agent's own latest close.
