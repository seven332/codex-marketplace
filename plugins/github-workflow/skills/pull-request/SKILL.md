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
   - `gh pr view --json state,mergedAt,url` when on an existing PR branch.
2. If on `main` or a merged PR branch, create a new branch named
   `<type>/<short-description>`, for example `feat/add-github-workflow`.
3. Inspect changes with `git diff`, `git diff --cached`, and `git log --oneline -5`.
4. Run relevant validation from repository docs.
5. Stage only intended files and commit with Conventional Commits:
   `<type>[optional scope]: <description>`.
6. Push the branch.
7. Create the PR with a concise summary and validation section:
   ```bash
   gh pr create --base main --head <branch> --title "<title>" --body "<body>"
   ```

Do not amend or force-push unless the user explicitly asks.

## Merge Workflow

1. Identify the PR from the current branch or the user's PR number.
2. Check `gh pr checks <pr-number>` and `gh pr view <pr-number> --json mergeable,mergeStateStatus`.
3. If checks are failing, stop and report the failures.
4. If checks are pending, ask whether to wait or leave it pending.
5. If merge conflicts exist, rebase or merge from `origin/main` only with user approval.
6. Merge with the repository's preferred strategy. If unknown, prefer squash merge:
   ```bash
   gh pr merge <pr-number> --squash --delete-branch
   ```
7. Switch to `main` and pull latest.

## List Workflow

Run `gh pr list --state open` and summarize number, title, branch, author, and status.

## Comment Workflow

1. Determine PR number from args, URL, current branch, or conversation context.
2. Summarize the relevant discussion into a concise Markdown comment.
3. Post with:
   ```bash
   gh pr comment <pr-number> --body "<comment>"
   ```
4. Report the PR URL.

## Related Skills

- Use `pr-check` for CI status and mechanical lint/format fixes.
- Use `pr-review` for code review comments.
