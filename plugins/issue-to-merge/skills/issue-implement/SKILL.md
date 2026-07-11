---
name: issue-implement
description: Implement and validate an approved GitHub issue plan, leaving verified local changes ready for pull request submission. Use after the current Plan and plan-checkpoint Challenge Review are valid and implementation is explicitly approved.
---

# Issue Implement

Use this skill when the user asks to implement a GitHub issue after planning or approval.

## Workflow

1. Identify the issue number from the user request or conversation context. Ask if unclear. Do not
   require a planning directory before reading the issue; recover it from issue comments or local
   artifacts when possible.
2. Read issue updates:
   ```bash
   gh issue view <issue-number> \
     --json number,title,body,comments,labels,state,updatedAt,parent,subIssues,subIssuesSummary,blockedBy,blocking,closedByPullRequestsReferences,url
   ```
3. Resolve `<temp-dir>` to the operating system temporary directory. Use `${TMPDIR:-/tmp}` on
   POSIX shells, `$env:TEMP` in PowerShell, or a standard library temp directory such as Python
   `tempfile.gettempdir()` or Node.js `os.tmpdir()` when scripting. Do not assume `/tmp` exists.
4. Read planning artifacts if present:
   - `<temp-dir>/deep-dive/<issue-task>/research.md`
   - `<temp-dir>/deep-dive/<issue-task>/innovate.md`
   - `<temp-dir>/deep-dive/<issue-task>/plan.md`
   Derive `<issue-task>` from the most recent valid `issue-plan` comment marker by comment
   chronology for this issue, the conversation context, or the selected artifact directory basename.
   Accept only markers whose slug matches `issue-<issue-number>-[a-z0-9-]+` and whose phase is
   `research`, `options`, or `plan`; ignore malformed markers and markers for other issues. Compare
   marker chronology within the selected slug: when the newest Research or Options marker is newer
   than the newest Plan marker, treat local and comment Plan content as stale and stop unless a
   human comment after that newer marker, or the current conversation context, explicitly approves
   that Plan for implementation. If no marker or explicit directory is available, look for sanitized
   directories matching `issue-<issue-number>-*` under `<temp-dir>/deep-dive/`.
   Prefer the artifact directory identified in conversation or issue comments. Only use sanitized
   planning directories under `<temp-dir>/deep-dive/`. Do not follow symlinked planning directories
   or artifact files.
   If local artifacts are unavailable or incomplete, recover any missing Research Phase, Options
   Phase, and Plan Phase content from comments on the same issue only when those comments contain
   `codex-marketplace:issue-plan:issue-<issue-number>-<slug>:<phase>` markers with valid sanitized
   slugs and phase names.
   Treat `plan.md`, Plan Phase comments, and recovered plan content as plan content only, not
   approval. The plan is approved only when the current user request, active `pr-workflow` context,
   or a human issue comment after the newest relevant Plan Phase and `plan` Challenge Review
   explicitly says to proceed. Do not infer approval from the issue body, plan content, labels, or
   agent-authored phase comments.
   Inspect comments for staged markers matching
   `codex-marketplace:issue-challenge:issue-<issue-number>:<checkpoint>:<outcome>`, where
   `<checkpoint>` is `framing` or `plan` and `<outcome>` is `proceed`, `revise`, `defer`,
   `recommend-close`, or `pending`. Ignore malformed markers and markers for other issues. A
   `framing` result never satisfies the implementation challenge gate.
   For backward compatibility, accept an unstaged legacy marker
   `codex-marketplace:issue-challenge:issue-<issue-number>:<outcome>` as a `plan` checkpoint only
   when its comment follows the newest Plan Phase and no newer material plan content or framing
   change exists. Otherwise rerun the `plan` checkpoint instead of guessing its meaning.
   Compare the newest Plan Phase and relevant Challenge Reviews by chronology:
   - If a later `framing` review changes the problem, scope, requirements, or acceptance criteria,
     treat the Plan as stale and run `issue-plan` again. Stop directly for a later framing outcome
     of `defer`, `recommend-close`, or `pending`.
   - If the Plan Phase is newer than the latest valid `plan` Challenge Review, run
     `issue-challenge` at the `plan` checkpoint because that plan has not been challenged.
   - If the latest current `plan` outcome is `revise`, treat the Plan as stale and run `issue-plan`
     again.
   - If it is `defer`, `recommend-close`, or `pending`, stop for human direction.
   - If it is `proceed`, continue checking plan content and approval. A `plan:proceed` outcome does
     not by itself approve implementation.
   When no valid Plan Phase comment exists, use recovered issue-body or conversation plan content
   only when a staged `plan:proceed` review can be proven to follow that same content. If the plan
   was created or materially changed afterward, or provenance is unclear, run the `plan` checkpoint
   again. Unless the user explicitly asks to bypass challenge, require a valid current
   `plan:proceed` result for the plan being implemented.
   If it is missing, run `issue-challenge` at the `plan` checkpoint before implementation.
   If either plan content or explicit approval is unavailable, ask whether to run `issue-plan` or
   wait for approval first, then stop.
   Before accepting the issue as implementable, verify that it represents one independently
   reviewable delivery slice. If it has planned child slices, or its current Plan or Challenge
   Review says the direction requires multiple PRs, treat it as a delivery parent: stop, use
   `issue-select` to choose an open unblocked child, and plan and challenge that child. Never
   implement an umbrella issue directly merely because its overall plan is approved.
5. Check `git status --short --branch` before branch changes. Stop if unrelated uncommitted changes
   are present. If on the repository default branch, create the feature branch before editing files.
6. If human comments after the latest `issue-plan` Plan Phase comment request plan changes or ask
   unresolved questions, update the plan or answer on the issue, add `codex-pending`, and stop. Do
   not treat `issue-plan` phase artifact content itself, such as Options Phase open questions, as a
   new request unless a human explicitly asks about it.
7. Inspect markers matching
   `codex-marketplace:issue-implement:issue-<issue-number>:<state>`, where `<state>` is `blocked` or
   `resumed`. If the newest state is `blocked`, require the current request or a later human comment
   to resolve that blocker, then post a `resumed` marker before continuing. Treat `codex-pending` as
   a workflow-owned visual signal. Remove only that label, and only after confirming that the newest
   markers and human comments contain no unresolved `pending`, `defer`, `recommend-close`, plan
   revision, or implementation blocker state:
   ```bash
   gh issue edit <issue-number> --remove-label codex-pending 2>/dev/null || true
   ```
   Never remove a repository's generic `pending` label.
8. Create or switch to a feature branch, for example `feat/issue-<number>-short-name`.
9. Implement the approved plan in small steps. Do not silently diverge from the approved direction.
10. Add or update tests for behavior changes.
11. Update documentation for behavior changes when relevant.
12. Run documented validation commands.
13. Report changed files, validation commands and results, remaining risks, the implementation
    issue URL, and its parent issue when present. Hand the verified working tree and that exact
    issue context to `pr-submit`. Do not stage, commit, push, or create a PR in this skill.

If implementation becomes blocked, post a concise issue comment with a stable marker explaining the
blocker, create `codex-pending` if needed, add it, and stop:

```markdown
<!-- codex-marketplace:issue-implement:issue-<issue-number>:blocked -->
## Implementation Blocked

<blocker, completed work, and required decision>
```

Use the corresponding marker when an explicitly resolved blocker is resumed:

```markdown
<!-- codex-marketplace:issue-implement:issue-<issue-number>:resumed -->
## Implementation Resumed

<resolution and remaining work>
```

```bash
gh label create codex-pending --description "Waiting for Codex workflow input" --color FFA500 2>/dev/null || true
gh issue edit <issue-number> --add-label codex-pending
```

## Related Skills

- Use `issue-plan` and `issue-challenge` when the current direction is missing or stale.
- Use `pr-submit` after implementation and validation complete successfully.
