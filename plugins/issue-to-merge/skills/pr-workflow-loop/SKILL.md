---
name: pr-workflow-loop
description: Deliver a broad GitHub issue or repository work queue through repeated, merged PR-sized workflow cycles, preserving progress and closing a parent-bound delivery issue after its completion gate passes. Use only when the user explicitly requests a multi-PR merge loop.
---

# PR Workflow Loop

Treat an explicit request to run this skill as approval to normally merge each PR that reaches
current-head readiness. In parent-bound mode, it also authorizes closing the delivery parent as
completed after the completion gate passes, unless the user explicitly asks to leave it open. This
authority does not apply in repository-queue mode. It does not authorize admin bypasses,
destructive cleanup, plain `git push --force`, or history rewrites outside the current iteration's
`rebase-default-branch` flow. That flow may rebase the current PR branch and update the same remote
branch with `git push --force-with-lease` without separate approval.

Read and follow the [current issue-state contract](../../references/current-issue-state.md).
Maintain three editable phase comments and phase-local state. Keep progress in the body's progress
block and the Plan Phase state, not an append-only comment log or a separate status comment.
All issue mutations require `OPEN`, except reopening the latest close proven to be
the agent's own operation under that contract. A matching GitHub username is not sufficient.
Read and follow the [repository work-file contract](../../references/repository-work-files.md)
for command payloads under `<codex-work>/tmp/issue-to-merge/pr-workflow-loop/` and retained close
receipts under `<codex-work>/state/issue-to-merge/`. Do not use operating-system temp files.

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
   Inspect the retained Plan Phase, fingerprint-bound phase-local state, child states, native
   `blockedBy` relationships, linked PRs, and current progress. A completion record is usable only
   when it covers the current challenged plan, accepted slice set, and verified evidence; it is not valid
   merely because it is the newest comment. Never recreate a slice or restart a merged iteration
   because local context was lost.
   For an open parent lacking a valid challenged direction, run framing, planning, and the plan
   checkpoint before selecting a child. For a closed parent, first inspect completion read-only.
   If accepted work is incomplete or recorded completion is invalid, automatically reopen only
   after verifying the latest close event against the agent-close receipt rule. Verify `OPEN`,
   invalidate completion, and return to the affected checkpoints. Missing receipts, a manual
   close, or any later close event require human direction; do not use an old completion comment
   or the closing account as proof. An already closed, completed parent that still passes the
   completion gate needs no new comment or other mutation.
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
     acceptance criteria. While it is still open, prepare and verify the agent-close attempt and
     receipt described in the shared contract. Close it with
     `gh issue close <implementation-issue-url> --reason completed`, then re-fetch it and verify
     `state` is `CLOSED` and `stateReason` is `COMPLETED`. Capture the successful close result and
     actual close-event ID in the local receipt. A closing keyword that already closed the issue
     does not prove an agent-owned explicit close; do not write to that closed issue. Do not close
     an intentionally non-closing release, backport, or partial-delivery issue;
   - for an iteration recorded as completing its implementation issue, require that exact issue to
     be `CLOSED` with `stateReason` `COMPLETED` before recording parent progress. Treat every other
     close reason as a state mismatch unless the current challenged plan explicitly replaced or
     removed that slice with a rationale;
   - when the implementation issue has a delivery parent, re-fetch that parent and its children.
     While it is open, update the managed Delivery Progress body block and Plan Phase state with the
     merged child/PR, validation evidence, completed slices, remaining or blocked slices, and next
     eligible slice. Preserve the plan and its valid reviews; progress-only changes do not change
     the plan fingerprint. Skip identical updates and clean up superseded agent progress comments
     only after verification. If the parent is closed, do not post, edit, label, or clean up it;
     route a parent-bound mismatch through step 2, or report it in queue mode.
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
   - the current framing and plan reviews cover their actual fingerprints, and no unresolved
     parent feedback, pending decision, blocker, or stale approval/completion state remains.
   If an acceptance criterion is unmet, return to parent planning and challenge when the delivery
   direction must change, then use `issue-select` for another coherent slice; stop for any required
   human decision instead of marking the parent complete.
8. In parent-bound mode, after the completion gate passes, immediately re-fetch the remote
   default-branch head OID and the full parent snapshot from step 2, including the body, current
   state, all comments, children, dependencies, `updatedAt`, `state`, and `stateReason`. Compare
   them with the gate snapshot from step 7. If anything changed, rerun the gate before publishing
   completion or closing. If the parent is already closed, require reason `COMPLETED` and the
   verified gate; do not write a summary to it. Report any other closed reason as a mismatch.

   While the parent is open, update the existing progress block and Plan Phase state with completion
   evidence: challenged plan fingerprint, accepted slices, merged children/PRs, default-branch
   OID, final validation, acceptance evidence, and remaining risks. Do not append a completion
   comment. Verify the saved progress/state, preserve the current three phase comments during
   superseded-copy cleanup, and re-fetch the head and full snapshot. Account only for this run's
   exact verified writes; any other change requires rechecking the gate. When the user asked to
   leave the parent open, report it as ready to close.

   Otherwise, prepare the unique close-attempt receipt and publish its identifier while the
   parent is still open, following the shared contract. Recheck the gate snapshot after that
   expected state update. Immediately before closing, require `OPEN` and unchanged gate inputs:
   ```bash
   gh issue close <parent-issue-url> --reason completed
   gh issue view <parent-issue-url> \
     --json number,title,body,state,stateReason,closedAt,updatedAt,labels,comments,parent,subIssues,subIssuesSummary,blockedBy,blocking,url
   ```
   Capture the close result and actual new close-event ID in the retained receipt. Require `state`
   to be `CLOSED` and `stateReason` to be `COMPLETED`, re-fetch the remote default-branch head OID,
   and compare both results with the pre-close snapshot. Ignore only the
   expected changes to `state`, `stateReason`, `closedAt`, and `updatedAt` caused by this run's
   close. If the head OID changed or another material change invalidated step 7 while the close was
   in flight, compensate only after verifying that the latest close event is this run's proven
   agent close. Apply every reopen prerequisite in the shared contract, then reopen, verify
   `OPEN`, invalidate completion, and rerun the gate. If another close intervened, attribution is
   ambiguous, or reopening/verification fails, leave the closed issue untouched and report the
   mismatch for direction. Never add post-close comments or bypass the receipt rule to repair a
   race.

   In repository-queue mode, retain current progress on affected open parents, but do not infer
   parent completion from queue exhaustion. Skip parent completion publication and closure, then
   continue selecting within the queue scope.
9. Stop when the requested scope passes its completion gate and every authorized terminal issue
   state change is verified, the current issue or PR is blocked, useful splitting is blocked, no
   suitable work remains in queue mode, a required merge is not authorized, or an iteration leaves
   an unmerged PR.

## Related Skills

- Use `pr-workflow` for each single-PR iteration.
- Use `issue-select` inside each iteration to choose one PR-sized issue and preserve delivery
  parent, sibling, and dependency context.
