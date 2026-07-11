---
name: issue-create
description: Create and assign to the current GitHub user clear standalone or parent-linked issues from conversation context, bug reports, feature requests, or an approved multi-PR delivery slice.
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
   - Is this a standalone issue or a delivery slice with a parent and prerequisite issues?
2. Ask concise clarifying questions when required details are missing. Do not invent reproduction
   steps, priority, user impact, or acceptance criteria.
3. Draft an issue title using a Conventional Commit-style prefix when appropriate:
   - `feat:`, `bug:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`
   - Use lowercase description and no trailing period.
4. Resolve the current GitHub user and stop if it cannot be determined:
   ```bash
   CURRENT_USER=$(gh api user --jq '.login')
   ```
   Assign every newly created issue to this user. Do not treat authorship as a substitute for
   assignment.
5. Create a temporary issue body file using the operating system temp directory. On POSIX shells,
   `ISSUE_BODY_FILE=$(mktemp "${TMPDIR:-/tmp}/issue-create.XXXXXX")` is acceptable; in PowerShell,
   use `New-TemporaryFile` or another OS temp-file API. Examples below use POSIX variable syntax;
   use equivalent syntax in other shells. Draft the body there. Adapt structure to the issue, but
   prefer:
   - Background
   - Problem or requirement
   - Acceptance criteria or reproduction steps
   - Relevant files, links, logs, screenshots, or decisions
   - Parent objective, slice boundary, dependencies, and intentionally deferred sibling work when
     this is part of a multi-PR delivery
   - Open questions
6. Choose labels if they exist in the repository, such as `bug`, `enhancement`, `documentation`,
   `tech-debt`, or `question`. Omit labels when no suitable label exists.
7. Create the issue with the form that matches its verified relationships. Pass parent and
   dependency context supplied by `issue-select`; do not infer relationships from similar titles:
   ```bash
   # Without labels
   gh issue create --title "<title>" --body-file "$ISSUE_BODY_FILE" --assignee "$CURRENT_USER"

   # With selected labels
   gh issue create --title "<title>" --body-file "$ISSUE_BODY_FILE" \
     --assignee "$CURRENT_USER" --label "<label-1>,<label-2>"

   # As a delivery slice; omit --blocked-by when it has no prerequisite
   gh issue create --title "<title>" --body-file "$ISSUE_BODY_FILE" \
     --assignee "$CURRENT_USER" --parent <parent-issue> \
     --blocked-by <prerequisite-issue-numbers>
   ```
8. Verify GitHub recorded the assignment and any intended relationships:
   ```bash
   gh issue view <issue-number> --json number,url,assignees,parent,blockedBy
   ```
   Stop and repair a missing current-user assignment or authorized relationship before handing the
   issue to planning. Return the issue number, URL, assignee, parent, and dependencies.
9. Remove the temporary issue body after successful creation, or after a failed attempt is no
   longer being retried. Do not leave issue content in transient files unnecessarily.

## Bug Reports

Include observed behavior, expected behavior, reproduction steps, environment details, error
messages, and impact. If reproduction is uncertain, make that explicit.

## Feature Requests

Describe user value and behavior, not implementation. Acceptance criteria should be testable.
