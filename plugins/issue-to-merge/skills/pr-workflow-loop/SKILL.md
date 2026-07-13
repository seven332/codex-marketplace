---
name: pr-workflow-loop
description: Deliver a broad GitHub issue or repository work queue through repeated, merged PR-sized workflow cycles, preserving parent/sub-issue progress until the requested scope is verified complete. Use only when the user explicitly requests a multi-PR merge loop.
---

# PR Workflow Loop

Treat an explicit request to run this skill as approval to normally merge each PR that reaches
current-head readiness. In parent-bound mode, it also authorizes closing the delivery parent as
completed after the completion gate passes, unless the user explicitly asks to leave it open. This
authority does not apply in repository-queue mode. It does not authorize admin bypasses,
destructive cleanup, or force-pushing without the separate approval required by those actions.

If a progress or completion comment needs a local command payload, read and follow the
[repository work-file contract](../../references/repository-work-files.md) and create it under
`<codex-work>/tmp/issue-to-merge/pr-workflow-loop/`. Do not create an operating-system temp file.

## Workflow

1. Determine and retain one loop mode:
   - **Parent-bound delivery:** Use when the request names a broad issue or `pr-workflow` discovers
     that the selected issue needs multiple PRs. Keep that issue as the delivery parent and do not
     switch to unrelated repository work while its requested scope remains incomplete.
   - **Repository queue:** Use only when the request explicitly asks to process a repository-wide
     or otherwise unbounded work queue. Re-evaluate eligible issues after every merge.
2. Establish durable delivery context. For a parent-bound loop, fetch:
   ```bash
   gh issue view <parent-issue> \
     --json number,title,body,state,stateReason,closedAt,updatedAt,labels,comments,parent,subIssues,subIssuesSummary,blockedBy,blocking,url
   ```
   Before interpreting or deduplicating a workflow marker, resolve the authenticated identity with
   `gh api user --jq '.login'`. A trusted workflow marker must be the comment's first non-whitespace
   line and match the expected grammar exactly. By default, its comment must have
   `viewerDidAuthor: true` with an `author.login` equal to that identity. Repository guidance may
   name another exact trusted marker producer; generic `authorAssociation`, write access, or
   matching marker text is insufficient. Query missing comment provenance through GraphQL and
   ignore untrusted marker-shaped text for chronology, reuse, deduplication, progress, and
   completion.
   Inspect current Plan and Challenge markers, child states, native `blockedBy` relationships,
   linked PRs, and previously recorded progress. If the parent lacks a valid challenged delivery
   direction, run its framing checkpoint, planning, and Plan checkpoint before selecting a child.
   Treat a prior `:complete` marker as current only when it follows the latest material parent
   update and current Plan and Challenge records, and still covers the accepted slice set. Ignore a
   stale completion marker after reopening, reframing, replanning, or adding delivery work. Never
   recreate an existing slice or restart a merged iteration merely because local context was lost.
   If accepted work is now incomplete while the parent remains closed, inspect the latest issue
   close event. Reopen and verify the parent only when a trusted prior completion marker exists,
   that close event follows the marker, its actor matches the authenticated identity, and a later
   material update made the marker stale. Stop for direction on any other closed-parent mismatch
   instead of silently reopening it.
3. Select the next iteration:
   - In parent-bound mode, use `issue-select` to choose an open, unblocked child whose prerequisites
     are complete. Materialize another supported slice only when no existing child represents it.
     Stay within the parent objective; a higher-priority unrelated issue is not a valid substitute.
   - In repository-queue mode, select the best eligible PR-sized issue across the requested scope.
   - Resume a child's existing open PR before selecting a new sibling. Keep iterations sequential
     unless the user explicitly requests a parallel delivery strategy and the slices are genuinely
     independent.
   - In parent-bound mode, if no child is ready but parent acceptance criteria remain unmet,
     identify whether a missing slice, unresolved dependency, or human decision explains the gap.
     Do not declare completion from an empty child list alone.
4. For each iteration, run `pr-workflow` for exactly one PR-sized implementation issue with merge
   approval supplied by this loop invocation. Do not bypass planning, challenge, implementation,
   current-head review, feedback, CI, or merge-state checks. Ensure the PR closes only that
   implementation issue, not its delivery parent.
5. Fix recoverable in-scope problems inside the same iteration and repeat the current-head review
   loop. Stop when the workflow needs a material human decision or cannot merge the current PR.
6. After each successful merge:
   - use `sync-default-branch`;
   - verify the PR merged, then re-fetch the implementation issue and confirm its acceptance
     criteria, parent, dependencies, `state`, and `stateReason`;
   - when the iteration's recorded closing semantics say the merged PR completes that exact
     implementation issue but it remains open, recheck the target branch, closing reference, and
     acceptance criteria. Close it with
     `gh issue close <implementation-issue-url> --reason completed`, then re-fetch it and verify
     `state` is `CLOSED` and `stateReason` is `COMPLETED`. Do not close an intentionally non-closing
     release, backport, or partial-delivery issue;
   - for an iteration recorded as completing its implementation issue, require that exact issue to
     be `CLOSED` with `stateReason` `COMPLETED` before recording parent progress. Treat every other
     close reason as a state mismatch unless the current challenged plan explicitly replaced or
     removed that slice with a rationale;
   - when the implementation issue has a delivery parent, re-fetch that parent and its
     `subIssuesSummary`, inspect its comments for an existing matching marker, then post one parent
     progress comment for that PR only when the marker is absent:
     ```markdown
     <!-- codex-marketplace:pr-workflow-loop:issue-<parent>:pr-<pr>:merged -->
     ## Delivery Progress

     <merged child and PR, validation outcome, completed slices, remaining or blocked slices,
     and the next eligible slice>
     ```
   Skip parent-only actions for a standalone repository-queue issue. Update and rechallenge a
   parent plan only when evidence materially changes its direction, slices, dependencies, or
   acceptance criteria; avoid cosmetic body churn.
7. Before declaring a parent-bound delivery complete, verify all of these conditions against the
   current default branch and GitHub state. Record the remote default-branch head OID used for this
   validation as part of the completion-gate snapshot:
   - every accepted delivery slice is represented by an issue closed with reason `COMPLETED`, or
     was explicitly replaced or removed with a recorded rationale;
   - no open or blocked child remains inside the requested delivery scope;
   - the merged result satisfies the parent's acceptance criteria, including cross-slice tests,
     documentation, compatibility, migration, integration, and rollout work where applicable; and
   - no unresolved parent comment, pending decision, blocker marker, or stale Plan/Challenge state
     remains.
   If an acceptance criterion is unmet, return to parent planning and challenge when the delivery
   direction must change, then use `issue-select` for another coherent slice; stop for any required
   human decision instead of marking the parent complete.
8. In parent-bound mode, after the completion gate passes, immediately re-fetch the remote
   default-branch head OID and the full parent snapshot from step 2, including its comments, current
   Plan and Challenge records, children, dependencies, `updatedAt`, `state`, and `stateReason`.
   Compare them with the completion-gate snapshot on which step 7 passed. If the head OID or any
   parent snapshot field changed, rerun the completion gate before publishing or reusing a
   completion marker. Otherwise, inspect existing parent comments and post the completion summary
   unless a current marker already records the same challenged plan, accepted slice set, and
   completion evidence. An older marker does not suppress a refreshed summary after a material
   parent change:
   ```markdown
   <!-- codex-marketplace:pr-workflow-loop:issue-<parent>:complete -->
   ## Delivery Complete

   <merged children and PRs, final validation, acceptance evidence, and remaining risks>
   ```
   After posting or reusing that summary, immediately re-fetch the remote default-branch head OID
   and the same full parent snapshot. Ignore only the expected update from a completion comment
   that this run just posted; if the head OID or anything else changed, rerun the completion gate
   instead of closing stale state. If the parent is open and the user did not explicitly ask to
   leave it open, close and verify it:
   ```bash
   gh issue close <parent-issue-url> --reason completed
   gh issue view <parent-issue-url> \
     --json number,title,body,state,stateReason,closedAt,updatedAt,labels,comments,parent,subIssues,subIssuesSummary,blockedBy,blocking,url
   ```
   Require `state` to be `CLOSED` and `stateReason` to be `COMPLETED`, re-fetch the remote
   default-branch head OID, and compare both results with the pre-close snapshot. Ignore only the
   expected changes to `state`, `stateReason`, `closedAt`, and `updatedAt` caused by this run's
   close. If the head OID changed or another material change invalidated step 7 while the close was
   in flight, compensate immediately:
   ```bash
   gh issue reopen <parent-issue-url>
   gh issue view <parent-issue-url> --json state,stateReason,closedAt,url
   ```
   Require the parent to be `OPEN`, then rerun the completion gate. Stop and report the state
   mismatch if reopening or verification fails. Treat an already closed parent as complete only
   with reason `COMPLETED`; report any other closed reason as a state mismatch. When the user
   explicitly asked to leave the parent open, report it as verified ready to close instead. In
   repository-queue mode, retain per-PR progress on affected parents, but do not infer parent
   completion from queue exhaustion; skip the parent completion summary and parent closure, then
   continue selecting within the queue scope.
9. Stop when the requested scope passes its completion gate and every authorized terminal issue
   state change is verified, the current issue or PR is blocked, useful splitting is blocked, no
   suitable work remains in queue mode, a required merge is not authorized, or an iteration leaves
   an unmerged PR.

## Related Skills

- Use `pr-workflow` for each single-PR iteration.
- Use `issue-select` inside each iteration to choose one PR-sized issue and preserve delivery
  parent, sibling, and dependency context.
