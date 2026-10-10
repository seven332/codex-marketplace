# Current Issue State

Use this contract when reading or maintaining issue plans, workflow state, or delivery progress.
The issue body is the published source of the current problem and plan. Keep research transcripts
and discarded proposals in local work files, not in the issue discussion.

- [Open-issue writes](#open-issue-write-gate)
- [Current body and review fingerprints](#published-body-and-fingerprints)
- [Editable state and approval](#one-current-state-comment)
- [Superseded comment cleanup](#remove-superseded-agent-content)
- [Agent-close proof and reopening](#agent-close-receipts-and-reopening)

## Open-Issue Write Gate

Read `state` with the issue snapshot. Immediately before each body, title, comment, label,
assignment, relationship, or close mutation, re-fetch the affected issue and require `OPEN`.
For relationship writes, require both issues to be open; a completed prerequisite can be recorded
as satisfied context without adding a new blocking relationship. If an issue closes during the
operation, stop further writes and report the incomplete update. Reading closed issues and their
completion evidence is allowed. Reopening is allowed only under the agent-close rule below.

This gate limits existing authority; it does not authorize issue edits, cleanup, closing, or
reopening by itself. An active issue-planning/update workflow authorizes normal maintenance of its
own generated content. An analysis-only invocation does not publish or clean up GitHub content.

## Published Body And Fingerprints

Keep confirmed facts, requirements, decisions, acceptance criteria, and unresolved questions in
the body. Maintain one current plan in a managed block:

```markdown
<!-- codex-marketplace:issue-plan:issue-<number>-<slug>:start -->
## Current Plan

**Status:** proposed

<chosen approach, implementation tasks, validation, risks, and delivery slices when applicable>
<!-- codex-marketplace:issue-plan:issue-<number>-<slug>:end -->
```

Use the same sanitized task slug as the local research directory. Maintain current delivery
progress, when needed, in a separate block with markers
`codex-marketplace:issue-progress:issue-<number>:start` and `:end`. Keep managed blocks after the
problem framing so progress-only edits do not reformat it. Preserve unrelated body content; stop
on conflicting or malformed managed blocks rather than choosing one by its position.
Use `**Status:** pending` with the current reason/next step instead of invalid executable tasks
while replanning. A `proposed` plan is content, not review or implementation approval. Ensure
published bodies/comments fit GitHub's accepted limits and stay self-contained; keep full
transcripts local rather than splitting a canonical plan across discussion comments.

Compute SHA-256 fingerprints from the actual fetched content, not from a claimed marker value:

- Normalize text by converting CRLF to LF and trimming leading/trailing whitespace.
- `framing`: hash UTF-8 compact JSON with keys `title`, `body`, `parent`, and `blockedBy` in that
  order. Use the normalized title and body excluding the managed plan/progress blocks, the parent
  issue URL or `null`, and a sorted array of prerequisite issue URLs. Dependency completion status
  and workflow labels are not inputs.
- `plan`: hash UTF-8 compact JSON with keys `framing` and `plan` in that order, using the framing
  fingerprint and normalized text inside a `proposed` plan block. A pending or absent plan has no
  usable plan fingerprint.

Plan-ready framing requires `proceed` or a completed, plan-ready `revise` covering the current
framing fingerprint. Implementation requires `plan:proceed` covering the current plan fingerprint
and explicit approval. `pending`, `defer`, and `recommend-close` never permit downstream work.
Meaningful human requests still need to be incorporated or answered; matching hashes do not
override unresolved feedback.
Revalidate affected checkpoints after fingerprint changes, even when only clarification changed;
never copy a prior review onto a new fingerprint without checking its inputs.

When a requirement or plan changes materially, clear affected reviews, plan approval, and delivery
completion. Replace obsolete conclusions with current facts or a concise pending statement while
replanning. Never leave an invalid plan presented as executable. A revised plan needs fresh review
and approval even if its text later returns to an earlier version.

## One Current State Comment

Maintain one agent-owned comment whose first non-whitespace line is exactly:

```markdown
<!-- codex-marketplace:issue-state:issue-<number> -->
## Current Workflow State
```

Resolve the authenticated identity with `gh api user --jq '.login'`. Trust a state comment only
when `viewerDidAuthor` is true and `author.login` matches that identity, or repository guidance
names another exact trusted agent producer. Query missing provenance through GraphQL. Body
markers, author association, and account identity alone do not establish agent ownership.

Keep this comment self-contained: task slug; current fingerprints; framing and plan outcomes with
their reviewed fingerprints; current plan publication time; any approval reference bound to that
plan; unresolved questions/blocker; current delivery/completion evidence; and an active close
attempt identifier when applicable. Preserve unrelated valid fields when updating one result.
Use `proceed`, `revise`, `defer`, `recommend-close`, or `pending` for checkpoint outcomes.

Create the comment only when none exists; otherwise update the verified comment by ID using the
issue-comment API. If multiple trusted state comments exist, consolidate their useful current
fields into one retained comment; disputed outcomes are pending, not resolved by comment order.
Recheck affected gates before removing duplicates. Skip an identical update. Read and follow the
[work-file contract](repository-work-files.md); prepare exact bodies in command files. Create with
`gh issue comment <issue-number> --body-file <file>` or update with
`gh api --method PATCH repos/<owner>/<repo>/issues/comments/<comment-id> -F body=@<file>`.
Re-fetch before each write and compare body, comments, relationships, and state with the analyzed
snapshot. Verify the exact saved result; do not silently accept a concurrent overwrite.

Record the body's server `updatedAt` from the verified plan publication; preserve that publication
time when plan inputs are unchanged, including progress-only or blocker updates. A state field is
an approval reference, not approval itself. Re-read the referenced authorized human comment and
verify that it covers this plan, or use explicit current conversation/active workflow authority.
An old generic approval before the replacement plan was published cannot approve that replacement.
Never infer approval from an
agent-written status, a label, or a successful challenge result.

## Remove Superseded Agent Content

After the replacement body and current state are saved and verified, remove generated comments
whose useful facts and current decisions have been incorporated. This includes superseded phase,
challenge, blocker/resume, and delivery-progress comments, and duplicate current-state comments.
Verify exact issue-specific workflow markers and agent provenance before deleting each comment
with `gh api --method DELETE repos/<owner>/<repo>/issues/comments/<comment-id>`. Recognized
superseded comment markers are `issue-plan:issue-<number>-<slug>:research|options|plan`,
`issue-challenge:issue-<number>:framing|plan:<outcome>`,
`issue-implement:issue-<number>:blocked|resumed`, and
`pr-workflow-loop:issue-<number>:pr-<pr>:merged` or `pr-workflow-loop:issue-<number>:complete`,
all under the exact `<!-- codex-marketplace:... -->` first-line wrapper.
Use sanitized slugs and the checkpoint outcomes above, not permissive substring matching.
Preserve human discussion and unrecognized comments; account identity or marker-shaped text alone
is insufficient. Do not remove an unresolved concern before representing it in the current
body/state. Re-fetch each comment immediately before deletion, require its content/provenance to
match what was consolidated, and verify deletion; preserve and reassess any concurrent edit.

Old phase comments may supply evidence for consolidation, but are not current plans or review
gates. Do not preserve append-only chronology as an alternate source of workflow state. If
publishing or cleanup fails, retain the verified current body/state, report remaining obsolete
content, and retry only those operations while the issue stays open.

## Agent-Close Receipts And Reopening

Automatic reopening may undo only the latest close event proven to come from the agent's own
successful close invocation. Matching the current GitHub username or a completion comment is not
proof: a person can close an issue under the same account.

Before an authorized close, while the issue is open:

1. Verify the completion gate, resolve the work root, and create a unique attempt record under
   `<codex-work>/state/issue-to-merge/issue-<number>/close-<attempt-id>.json`.
2. Record repository/issue identity, attempt ID, authenticated actor, current plan fingerprint,
   previous latest close-event ID, and the verified pre-close snapshot. Put the same attempt ID in
   the current state comment and recheck the completion snapshot after that expected state update.
3. Execute the close and capture its actual success result, not a no-op for an already closed
   issue. Fetch the issue timeline and identify the newly created `ClosedEvent`/`closed` event,
   its ID, actor, and timestamp. Record that event and the command result in the local receipt.
   If attribution is ambiguous, including a concurrent same-account close, keep it unverified.

Do not add a receipt comment after closing the issue. Local receipts survive for workflow resume;
never treat an unverified intent record or a GitHub closing keyword as a verified explicit close.

Before automatically reopening, require all of these:

- The current request/workflow authorizes continuing or correcting this delivery.
- The issue is closed and its latest close-event ID exactly matches a verified receipt for this
  issue, or the current run's directly observed successful close and matching event.
- The actor and active attempt match the trusted pre-close state record; no later close event
  replaced the one recorded by the agent. Inspect the full paginated close/reopen timeline even
  when the actor did not change, and compare IDs from the same API representation.
- Current evidence shows the recorded completion is invalid. Re-fetch state and latest close
  event immediately before reopening and verify `OPEN` afterward.

If proof is missing, the issue was closed manually, or a later close superseded the agent's event,
leave it closed and report the mismatch. After a permitted reopen, invalidate the completion
state and update the now-open issue through normal maintenance. This rule also applies when
compensating for a completion check invalidated during the agent's own close operation.
