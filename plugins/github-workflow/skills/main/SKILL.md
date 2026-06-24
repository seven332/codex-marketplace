---
name: main
description: Switch to the main branch and pull the latest remote changes.
---

# Main Branch

Use this skill when the user asks to switch back to the default branch, update `main`, or return to
a clean base after PR work.

## Workflow

1. Check working-tree state with `git status --short --branch`.
2. If there are uncommitted changes, stop and ask how to handle them.
3. Switch to `main` with `git switch main`.
4. Pull the latest remote changes with `git pull`.
5. Report the latest commit and whether the pull fast-forwarded.

Do not stash, discard, amend, reset, or force-push unless the user explicitly asks.
