---
name: pr-review
description: Review a pull request and post concise findings as a PR comment.
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
4. Require the `code-quality` skill. Use it for the detailed review and read any generated
   `codereviews/YYYYMMDD/` artifacts before preparing the PR comment.
5. Classify findings:
   - `P0`: data loss, security, release blocker, or missing tests for critical feature/fix.
   - `P1`: likely user-visible bug, broken workflow, important missing test, or serious test convention violation.
   - `P2`: maintainability risk, unclear API, or follow-up cleanup.
6. Prepare a concise PR comment in a temporary Markdown file. On POSIX shells, `mktemp` is
   acceptable; in PowerShell, use `New-TemporaryFile` or another OS temp-file API. The example
   below uses POSIX variable syntax; use equivalent syntax in other shells:
   ```bash
   PR_REVIEW_FILE=$(mktemp "${TMPDIR:-/tmp}/pr-review.XXXXXX")
   ```
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
7. Post the review comment directly:
   ```bash
   gh pr comment <pr-number> --body-file "$PR_REVIEW_FILE"
   ```

Keep PR comments focused on actionable findings. If there are no findings, say so and include any
unverified areas.
