---
name: pr-check
description: Check pull request CI status and apply conservative lint or format fixes when safe.
---

# PR Check

Use this skill when the user asks to check a PR, inspect CI, or fix straightforward CI failures.

## Workflow

1. Identify the PR:
   - Use an explicit PR number or URL if provided.
   - Otherwise detect the PR for the current branch with `gh pr list --head "$(git branch --show-current)"`.
2. Check status:
   - `gh pr checks <pr-number>`
   - `gh pr view <pr-number> --json mergeable,mergeStateStatus,headRefName,title,url`
3. Classify the result:
   - Merge conflict or dirty merge state: report conflict and recommend rebasing or merging from
     the repository default branch.
   - All checks passed or skipped: report success.
   - Pending checks only: report pending checks and do not loop unless the user asks to watch.
   - Failed checks: inspect the failed run logs.
4. For lint/format failures only, run documented format/lint fix commands if the repository has
   them. Before changing files:
   - Check `git status --short --branch`.
   - Confirm the current branch matches the PR head branch.
   - Stop if unrelated uncommitted changes are present.
   After auto-fix commands run, rerun the failed lint/format command and relevant repository
   validation. If validation still fails, stop and report the remaining failure. If it passes,
   inspect the diff, stage only mechanical lint/format changes, commit them, and push to the PR
   branch.
5. For type, test, build, or product failures, report the failing job, relevant log excerpt, and
   likely next investigation step.

Do not auto-merge. Do not retry CI repeatedly unless the user asks.
