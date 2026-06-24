---
name: pr-review
description: Review a pull request and optionally post concise findings as a PR comment.
---

# PR Review

Use this skill when the user asks to review a GitHub pull request.

## Workflow

1. Determine the PR number:
   - Extract it from a PR URL or issue URL.
   - Use an explicit number if provided.
   - Otherwise detect from the current branch with `gh pr list --head "$(git branch --show-current)"`.
2. Read PR metadata:
   ```bash
   gh pr view <pr-number> --json title,body,author,url,headRefName,baseRefName
   ```
3. Read the changed files and diff:
   ```bash
   gh pr diff <pr-number> --name-only
   gh pr diff <pr-number>
   ```
4. If the `code-quality` skill is installed, use it for the detailed review and read any generated
   `codereviews/YYYYMMDD/` artifacts. If it is unavailable, perform the same review directly:
   - Read repository guidance such as `AGENTS.md`, `CONTRIBUTING.md`, and testing docs.
   - Review correctness, security, tests, API contracts, data changes, performance, and maintainability.
   - Check changed tests for meaningful behavior assertions and project-specific conventions.
5. Classify findings:
   - `P0`: data loss, security, release blocker, or missing tests for critical feature/fix.
   - `P1`: likely user-visible bug, broken workflow, important missing test, or serious test convention violation.
   - `P2`: maintainability risk, unclear API, or follow-up cleanup.
6. Prepare a concise PR comment in `/tmp/pr-review-<number>.md`:
   ```markdown
   ## Code Review: PR #<number>

   ### Summary
   <short summary>

   ### Findings
   - P1 `path/file.ext:42` Short issue title.
     Impact: ...
     Recommendation: ...

   ### Testing
   <coverage and convention notes>

   ### Verdict
   <LGTM / Changes Requested / Needs Discussion>
   ```
7. Ask before posting unless the user explicitly requested posting. Post with:
   ```bash
   gh pr comment <pr-number> --body-file /tmp/pr-review-<number>.md
   ```

Keep PR comments focused on actionable findings. If there are no findings, say so and include any
unverified areas.
