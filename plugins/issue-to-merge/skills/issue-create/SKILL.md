---
name: issue-create
description: Create clear GitHub issues from conversation context, bug reports, or feature requests.
---

# Issue Create

Use this skill when the user asks to create a GitHub issue from a conversation, bug report, feature
request, investigation, or task.

## Operations

- `create`: synthesize an issue from current conversation context.
- `bug`: create a reproducible bug report.
- `feature`: create a feature request with acceptance criteria.

## Workflow

1. Analyze the conversation and repository context:
   - What problem, task, or opportunity is being tracked?
   - What decisions, constraints, files, and examples matter?
   - What remains unknown?
2. Ask concise clarifying questions when required details are missing. Do not invent reproduction
   steps, priority, user impact, or acceptance criteria.
3. Draft an issue title using a Conventional Commit-style prefix when appropriate:
   - `feat:`, `bug:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`
   - Use lowercase description and no trailing period.
4. Create a temporary issue body file using the operating system temp directory. On POSIX shells,
   `ISSUE_BODY_FILE=$(mktemp "${TMPDIR:-/tmp}/issue-create.XXXXXX")` is acceptable; in PowerShell,
   use `New-TemporaryFile` or another OS temp-file API. Examples below use POSIX variable syntax;
   use equivalent syntax in other shells. Draft the body there. Adapt structure to the issue, but
   prefer:
   - Background
   - Problem or requirement
   - Acceptance criteria or reproduction steps
   - Relevant files, links, logs, screenshots, or decisions
   - Open questions
5. Choose labels if they exist in the repository, such as `bug`, `enhancement`, `documentation`,
   `tech-debt`, or `question`. Omit labels when no suitable label exists.
6. Create the issue with exactly one of these forms:
   ```bash
   # Without labels
   gh issue create --title "<title>" --body-file "$ISSUE_BODY_FILE"

   # With selected labels
   gh issue create --title "<title>" --body-file "$ISSUE_BODY_FILE" --label "<label-1>,<label-2>"
   ```
7. Return the issue URL.

## Bug Reports

Include observed behavior, expected behavior, reproduction steps, environment details, error
messages, and impact. If reproduction is uncertain, make that explicit.

## Feature Requests

Describe user value and behavior, not implementation. Acceptance criteria should be testable.
