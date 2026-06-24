---
name: pull-request
description: Create, update, list, comment on, and merge GitHub pull requests.
---

# Pull Request

Use this skill when the user asks to create a PR, update an existing PR, list PRs, summarize a
discussion as a PR comment, or merge a PR.

## Operations

- `create`: create or update a PR for current changes.
- `merge`: validate and merge a PR.
- `list`: list open PRs.
- `comment <pr-number>`: post a summarized comment.

Infer the operation from the user request when it is not explicit.

## Create Workflow

1. Check state:
   - `git status --short --branch`
   - `git branch --show-current`
   - `gh pr view --json number,state,mergedAt,url` when on an existing PR branch.
2. Detect the default branch:
   ```bash
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || echo main)
   ```
3. If on the default branch or a merged PR branch, create a new branch named
   `<type>/<short-description>`, for example `feat/add-github-workflow`. If the current branch
   already has an open PR, keep updating that PR branch.
4. Inspect changes with `git diff`, `git diff --cached`, and `git log --oneline -5`.
5. Run relevant validation from repository docs.
6. Stage only intended files and commit with Conventional Commits:
   `<type>[optional scope]: <description>`.
7. Push the branch.
8. If the current branch already has an open PR, report that PR URL instead of creating a duplicate.
   Otherwise create a PR body in a temporary Markdown file from `mktemp`, then create the PR:
   ```bash
   PR_BODY_FILE=$(mktemp "${TMPDIR:-/tmp}/pr-body.XXXXXX.md")
   # Write the PR body to "$PR_BODY_FILE", then:
   gh pr create --base "$DEFAULT_BRANCH" --head <branch> --title "<title>" --body-file "$PR_BODY_FILE"
   ```

Do not amend or force-push unless the user explicitly asks.

## Merge Workflow

1. Identify the PR from the current branch or the user's PR number.
2. Check `gh pr checks <pr-number>` and `gh pr view <pr-number> --json mergeable,mergeStateStatus`.
3. If checks are failing, stop and report the failures.
4. If checks are pending, ask whether to wait or leave it pending.
5. Detect the default branch and use it as the merge base.
6. If merge conflicts exist, rebase or merge from `origin/$DEFAULT_BRANCH` only with user approval.
7. Merge with the repository's preferred strategy. If unknown, prefer squash merge:
   ```bash
   gh pr merge <pr-number> --squash --delete-branch
   ```
8. Switch to the default branch and pull latest.

## List Workflow

Run `gh pr list --state open` and summarize number, title, branch, author, and status.

## Comment Workflow

1. Determine PR number from args, URL, current branch, or conversation context.
2. Summarize the relevant discussion into a concise Markdown comment in a temporary Markdown file
   from `mktemp`.
3. Post with:
   ```bash
   PR_COMMENT_FILE=$(mktemp "${TMPDIR:-/tmp}/pr-comment.XXXXXX.md")
   # Write the comment to "$PR_COMMENT_FILE", then:
   gh pr comment <pr-number> --body-file "$PR_COMMENT_FILE"
   ```
4. Report the PR URL.

## Related Skills

- Use `pr-check` for CI status and mechanical lint/format fixes.
- Use `pr-review` for code review comments.
