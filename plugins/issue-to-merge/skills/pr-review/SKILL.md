---
name: pr-review
description: Review the current head of a GitHub pull request with the code-quality workflow and post a concise, head-specific review verdict as a PR comment.
---

# PR Review

## Workflow

1. Identify the PR from an explicit number or URL, or from the current branch.
2. Read PR metadata, including the exact head being reviewed:
   ```bash
   gh pr view <pr-number> --json number,title,body,author,url,headRefName,headRefOid,baseRefName,comments
   ```
3. Read changed files and the submitted diff:
   ```bash
   gh pr diff <pr-number> --name-only
   gh pr diff <pr-number>
   ```
4. Require `code-quality:code-quality`. If that prefixed skill is unavailable, stop and ask the
   user to install or enable the `code-quality` plugin. Use it for the detailed review and read any
   generated `codereviews/YYYYMMDD/` artifacts before preparing the PR comment.
5. Classify findings:
   - `P0`: data loss, security, release blocker, or missing critical coverage.
   - `P1`: likely user-visible bug, broken workflow, important missing test, or serious convention
     violation.
   - `P2`: maintainability risk, unclear API, or follow-up cleanup.
6. Choose one verdict: `lgtm`, `changes-requested`, or `needs-discussion`. Bind it to the fetched
   `headRefOid` with a stable marker:
   ```markdown
   <!-- codex-marketplace:pr-review:pr-<number>:<head-sha>:<verdict> -->
   ## Code Review: PR #<number>

   **Reviewed head:** `<head-sha>`

   ### Summary
   <short summary>

   ### Findings
   <severity, location, impact, and recommendation, or "No findings.">

   ### Testing
   <coverage, validation, and unverified areas>

   ### Verdict
   <LGTM / Changes Requested / Needs Discussion>
   ```
7. Inspect existing PR comments before posting. If the same head already has an identical current
   verdict and no new evidence exists, report the existing review instead of posting a duplicate.
   Otherwise write the review to a temporary Markdown file and post it with
   `gh pr comment <pr-number> --body-file "$PR_REVIEW_FILE"`. Remove that transient file after a
   successful post or when the attempt is abandoned. Keep any separate `code-quality` review
   artifacts according to that skill's workflow.
8. Re-fetch `headRefOid` after posting. If it changed during review, report the review as stale and
   do not treat its verdict as current.

Keep the comment focused on actionable findings. A non-`lgtm` verdict returns the workflow to
`pr-self-review`; after any new commit, run this skill again for the new head.

## Related Skills

- Use `pr-self-review` before final review and after fixes.
- Use `pr-address-review` for human, bot, or GitHub App feedback.
- Use `pr-check` after an `lgtm` verdict on the current head.
