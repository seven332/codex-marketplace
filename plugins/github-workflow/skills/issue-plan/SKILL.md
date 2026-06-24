---
name: issue-plan
description: Research a GitHub issue, explore options, and post an implementation plan.
---

# Issue Plan

Use this skill when the user asks to start planning work for a GitHub issue.

## Workflow

1. Determine the issue number from the user request or conversation context. Ask if unclear.
2. Fetch issue details:
   ```bash
   gh issue view <issue-number> --json title,body,comments,labels,url
   ```
3. Create or reuse a planning directory under `/tmp/github-workflow/<issue-number>-<short-task-name>/`.
   Use a sanitized slug with only lowercase letters, numbers, and hyphens.
4. Research phase:
   - Read repository guidance such as `AGENTS.md`, README, tests, and relevant docs.
   - Search the codebase with `rg`.
   - Identify affected modules, constraints, existing patterns, and risks.
   - Write `/tmp/github-workflow/<issue-task>/research.md`.
5. Options phase:
   - Compare plausible approaches and trade-offs.
   - Call out rejected approaches and why.
   - Write `/tmp/github-workflow/<issue-task>/innovate.md`.
6. Plan phase:
   - Produce concrete implementation steps.
   - Include test strategy and validation commands.
   - Include rollout, migration, or compatibility notes when relevant.
   - Write `/tmp/github-workflow/<issue-task>/plan.md`.
7. Post the plan artifacts or summaries to the issue:
   ```bash
   gh issue comment <issue-number> --body-file /tmp/github-workflow/<issue-task>/plan.md
   ```
8. Add or create a `pending` label when waiting for human approval:
   ```bash
   gh label create pending --description "Waiting for human input" --color FFA500 2>/dev/null || true
   gh issue edit <issue-number> --add-label pending
   ```

Do not implement before the plan is approved unless the user explicitly asks to proceed.
