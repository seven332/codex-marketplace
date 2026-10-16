# Current Issue State

Use this contract when reading or maintaining issue plans, workflow state, or delivery progress.
The issue body holds the current problem and requirements. Three persistent phase comments hold
Research, Options, and Plan. Replanning updates those same comments; it neither merges them into
one output nor appends another set. The primary goal is current, correct information that cannot
mislead later implementation, not merely a fixed comment count. Keep discarded drafts and full
working notes local.

- [Open-issue writes](#open-issue-write-gate)
- [Three editable phase comments](#three-editable-phase-comments)
- [Current inputs and review fingerprints](#published-inputs-and-fingerprints)
- [Phase-local state and approval](#phase-local-state-and-approval)
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

## Three Editable Phase Comments

Maintain one agent-owned comment per phase. Its first non-whitespace line must be exactly:

```markdown
<!-- codex-marketplace:issue-plan:issue-<number>-<slug>:research -->
## Research Phase
```

Use suffixes `research`, `options`, and `plan` with headings Research Phase, Options Phase, and
Plan Phase. Use one sanitized `issue-<number>-<slug>` task identity for all three comments and the
local artifact directory; retain it across title changes. Resolve existing comments by verified
issue/phase identity, not the latest comment or a newly generated title slug.

Resolve the authenticated identity with `gh api user --jq '.login'`. Trust a phase comment only
when `viewerDidAuthor` is true and `author.login` matches that identity, or repository guidance
names another exact trusted agent producer. Query missing provenance and paginate comments
through GraphQL. A marker, author association, or account identity alone is insufficient.

Publish completed phases sequentially. Create a comment only when that phase has none; otherwise
edit its retained comment ID. Preserve unaffected phases and skip identical payloads. A completed
planning run has three phase comments, including after replanning. Human discussion and unrelated
comments do not count toward those three and must not be removed to achieve a comment count.

Research publishes verified findings; Options publishes credible alternatives, trade-offs, and
the chosen direction or required decision; Plan publishes the complete current implementation
plan, validation, risks, and delivery slices when applicable. Research/Options may summarize large
local notes, but all outputs must be understandable on GitHub, and Plan must not depend on
unpublished details. Do not duplicate the implementation plan in the issue body or create a
standalone `Current Workflow State` comment.
Keep each output within GitHub's accepted comment size. Do not split a phase into extra comments
or silently truncate the plan; revisit its delivery boundaries if a self-contained plan cannot fit.

On each revision, check all three outputs against current evidence, requirements, and human
decisions. Correct or remove obsolete/incorrect facts and recommendations in their owning phase;
updating only Plan or marking known wrong text superseded is insufficient. Retain rejected
alternatives only as accurate, explicitly non-selected rationale, not as competing current
directions. Before implementation or handoff, verify no stale generated conclusion remains in
any retained phase or verified superseded copy awaiting cleanup.

Use `**Status:** current` for completed Research/Options and `**Status:** proposed` for a completed
Plan. Use `**Status:** pending` with the reason/next step instead of invalid conclusions or tasks
while replanning. Before replacing changed inputs, first invalidate an existing affected Plan
and its review/approval/completion, then mark any other stale downstream phase pending. Resume
from the earliest affected phase after an interrupted run; do not leave the old plan executable.

A framing challenge before Research exists may create its pending Research comment with the
verified framing result and known facts. Planning later fills that same comment. A pending phase
output is distinct from a pending checkpoint outcome; a valid framing result can authorize
research, but implementation requires all three completed phases.

Read and follow the [work-file contract](repository-work-files.md); prepare exact comment bodies
in command files. Create with `gh issue comment <issue-number> --body-file <file>` or update with
`gh api --method PATCH repos/<owner>/<repo>/issues/comments/<comment-id> -F body=@<file>`.
Immediately before each write, re-fetch the issue and target comment, require `OPEN`, and compare
the body, all phase contents/state, relationships, and feedback with the analyzed snapshot. After
each write verify the exact saved result before continuing. A changed snapshot requires
reassessment, not overwriting newer content or blindly retrying creation after an uncertain result.

## Published Inputs And Fingerprints

Keep confirmed problem facts, requirements, acceptance criteria, and open requirement questions
in the body. Maintain delivery progress, when needed, in a separate body block with markers
`codex-marketplace:issue-progress:issue-<number>:start` and `:end`. Keep it after problem framing;
progress-only edits must not reformat framing or the phase outputs. Stop on malformed or
conflicting managed blocks rather than selecting one by position.

Compute SHA-256 fingerprints from the actual fetched content, not from a claimed marker value:

- Normalize text by converting CRLF to LF and trimming leading/trailing whitespace.
- `framing`: hash UTF-8 compact JSON with keys `title`, `body`, `parent`, and `blockedBy` in that
  order. Use the normalized title and body excluding the managed progress block, the parent
  issue URL or `null`, and a sorted array of prerequisite issue URLs. Dependency completion status
  and workflow labels are not inputs.
- For each phase payload, exclude its first-line identity marker and the phase-local state block
  below, then normalize the remaining published content, including its heading/status. Do not
  hash local artifacts in place of the saved public payloads.
- `plan`: hash UTF-8 compact JSON with keys `framing`, `research`, `options`, and `plan` in that
  order, using the framing fingerprint and the three phase payloads. Missing, pending, or
  unresolved duplicate phases have no usable plan fingerprint.

Plan-ready framing requires `proceed` or a completed, plan-ready `revise` covering the current
framing fingerprint. Implementation requires `plan:proceed` covering the current plan fingerprint
and explicit approval. `pending`, `defer`, and `recommend-close` never permit downstream work.
Meaningful human requests still need to be incorporated or answered; matching hashes do not
override unresolved feedback.
Revalidate affected checkpoints after fingerprint changes, even when only clarification changed;
never copy a prior review onto a new fingerprint without checking its inputs.

When a requirement or phase changes materially, clear affected reviews, plan approval, and
delivery completion before updating its inputs. Never leave an invalid plan executable. A revised
plan needs fresh review and approval even if its text later returns to an earlier version.

## Phase-Local State And Approval

Keep workflow metadata in a managed block inside the relevant phase comment, not a fourth comment:

```markdown
<!-- codex-marketplace:issue-state:issue-<number>:plan:start -->
<details>
<summary>Workflow state</summary>

<current fingerprints, review outcome, approval reference, blocker, and next step>

</details>
<!-- codex-marketplace:issue-state:issue-<number>:plan:end -->
```

Use the corresponding `research` or `options` suffix for metadata in those phases. Research owns
the framing fingerprint, framing outcome/reviewed fingerprint, and framing blocker. Options owns
the current choice/question and planning blocker. Plan owns the current plan fingerprint,
plan outcome/reviewed fingerprint, publication time, approval reference, implementation blocker,
delivery/completion evidence, and any active close-attempt ID. Keep the task slug and next step
with the applicable state. Read these fields together; do not collapse the three visible outputs
to centralize metadata. Preserve unrelated valid fields and visible phase content on state-only
updates. Checkpoint outcomes are `proceed`, `revise`, `defer`, `recommend-close`, or `pending`.
Allow at most one correctly matched state block per phase; stop on malformed or conflicting
blocks rather than hashing or editing around an ambiguous boundary.

Record the Plan comment's verified server `updatedAt` when a new plan fingerprint is published;
publishing changed input bindings counts even when the Plan's visible tasks did not change.
Preserve that publication time on later metadata-only, progress, or blocker updates. State blocks
are excluded from fingerprints, so writing a review does not invalidate itself.

An approval field is a reference, not approval itself. Re-read the referenced authorized human
comment and verify that it covers this plan, or use explicit current conversation/active workflow
authority. An old generic approval before a replacement plan was published cannot approve it.
Never infer approval from agent-written state, a label, or a successful challenge result.

## Remove Superseded Agent Content

Preserve the retained Research, Options, and Plan comments, including during compaction. A phase
comment is not obsolete merely because its findings also appear in the issue body or local files.
When duplicate agent comments exist for a phase, consolidate useful current facts, decisions, and
state into one retained comment ID. Stop for disputed outcomes; never choose by comment chronology.
Verify all retained outputs and recheck affected gates before deleting duplicates.

Only then remove verified superseded agent comments. Check exact issue-specific workflow markers
and provenance before deleting each with
`gh api --method DELETE repos/<owner>/<repo>/issues/comments/<comment-id>`. Recognized candidates
include duplicate `issue-plan:issue-<number>-<slug>:research|options|plan`, standalone
`issue-state:issue-<number>`,
`issue-challenge:issue-<number>:framing|plan:<outcome>`,
`issue-implement:issue-<number>:blocked|resumed`, and
`pr-workflow-loop:issue-<number>:pr-<pr>:merged` or `pr-workflow-loop:issue-<number>:complete`,
all under the exact `<!-- codex-marketplace:... -->` first-line wrapper.
Use sanitized slugs and the checkpoint outcomes above, not permissive substring matching.
Preserve human discussion and unrecognized comments; account identity or marker-shaped text alone
is insufficient. Do not remove an unresolved concern before representing it in the current body
or appropriate phase. Re-fetch each comment immediately before deletion, require its content and
provenance to match what was consolidated, and verify deletion; preserve and reassess any
concurrent edit. Incomplete cleanup blocks an implementation handoff while misleading generated
content remains; do not treat a newly correct Plan as sufficient.

Do not keep a body plan, superseded copy, or standalone state comment as an alternate current
source. If publishing or cleanup fails, retain the verified current phases, report remaining
obsolete content or pending publication, and retry only while the issue stays open.

## Agent-Close Receipts And Reopening

Automatic reopening may undo only the latest close event proven to come from the agent's own
successful close invocation. Matching the current GitHub username or a completion comment is not
proof: a person can close an issue under the same account.

Before an authorized close, while the issue is open:

1. Verify the completion gate, resolve the work root, and create a unique attempt record under
   `<codex-work>/state/issue-to-merge/issue-<number>/close-<attempt-id>.json`.
2. Record repository/issue identity, attempt ID, authenticated actor, current plan fingerprint,
   previous latest close-event ID, and the verified pre-close snapshot. Put the same attempt ID in
   the Plan Phase state block and recheck the completion snapshot after that expected state update.
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
