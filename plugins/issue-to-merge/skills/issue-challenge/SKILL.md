---
name: issue-challenge
description: Challenge a GitHub issue's necessity, problem framing, scope, risks, and proposed solution, then update the issue with the best supported direction. Use when deciding whether an issue or plan is worth doing, safe, correctly scoped, or better solved another way without optimizing for the smallest change or treating the current issue boundaries as fixed.
---

# Issue Challenge

Critically test the issue and its proposed direction before implementation. Treat the existing
scope and solution as hypotheses, not constraints.

## Workflow

1. Determine the issue number from the user request or conversation context. Ask if unclear.
2. Fetch the current issue before analyzing or editing it:
   ```bash
   gh issue view <issue-number> --json number,title,body,comments,labels,state,url
   ```
   Include relevant conversation context and planning artifacts when the challenge targets a
   proposed plan. In issue comments, accept only `issue-plan` markers for this issue whose slug
   matches `issue-<issue-number>-[a-z0-9-]+` and whose phase is `research`, `options`, or `plan`.
   Use comment chronology to identify the newest Plan Phase and ignore malformed markers or markers
   for other issues. If a newer Research or Options Phase follows that Plan, treat the plan as stale
   and do not present it as the current direction.
3. Inspect enough repository context to verify the issue's assumptions. Read repository
   instructions, relevant code, tests, documentation, history, and related issues as needed. Do
   not accept claims in the issue as facts when they can be checked locally.
4. Challenge the issue from these angles:
   - **Necessity:** Identify the concrete problem, affected users or systems, supporting evidence,
     expected benefit, and cost of doing nothing. State when the need is speculative.
   - **Problem framing:** Distinguish root causes from symptoms. Surface hidden assumptions and
     ask whether the issue solves the right problem.
   - **Solution quality:** Compare the strongest feasible form of the current proposal, the status
     quo, and credible alternatives. Do not use weak alternatives to justify a preferred answer.
     Ignore sunk cost and do not favor an approach merely because it produces the smallest diff or
     preserves the most existing code.
   - **Scope:** Choose the best justified problem and solution boundary even when it is broader or
     narrower than the current issue. Do not expand scope without a concrete benefit, and do not
     weaken the solution just to fit the existing issue or one PR.
   - **Consequences:** Check correctness, compatibility, delivery and migration cost,
     reversibility and rollback, security and privacy, data integrity, concurrency and timing,
     performance and resources, operability, testability, and long-term maintenance where relevant.
5. Select exactly one outcome:
   - `proceed` — the current direction remains the best supported choice.
   - `revise` — change the problem statement, scope, or proposed solution.
   - `defer` — the value, evidence, or timing does not justify implementation now.
   - `recommend-close` — the problem no longer exists or implementation is unnecessary.
   - `pending` — a material product or engineering trade-off requires a human decision.
   Prefer a clear decision when evidence supports one. Do not manufacture certainty to avoid a
   `pending` outcome.
6. Draft the updated issue. Preserve confirmed requirements, evidence, constraints, decisions, and
   useful links from the existing body and comments. Adapt the headings to the issue, but normally
   include:
   - Problem and evidence
   - Decision
   - Chosen direction and rationale
   - Alternatives considered
   - Risks and mitigations
   - Acceptance criteria
   - Delivery notes or open questions

   When the best solution requires more than one reviewable PR, record the full direction in the
   issue and describe coherent delivery slices. Do not compress the design into a weaker solution
   or turn the current PR-sized issue into an unreviewable change; use `issue-select` afterward to
   create or attach the appropriate sub-issue when implementation continues.
7. Review the draft against the fetched issue before publishing it. Verify that it:
   - explains why the outcome follows from evidence;
   - does not silently discard requirements or unresolved objections;
   - reflects the best justified approach rather than the easiest patch;
   - makes any superseded plan or changed scope explicit; and
   - leaves testable acceptance criteria for an implementation outcome.
8. Treat an explicit request to run this workflow as approval to update the identified issue. If
   the user asks for analysis only, show the proposed update and do not mutate GitHub. Otherwise,
   create temporary body and comment files in the operating system temp directory. On POSIX
   shells, these commands are acceptable; use `New-TemporaryFile` or another OS temp-file API in
   PowerShell:
   ```bash
   ISSUE_CHALLENGE_BODY_FILE=$(mktemp "${TMPDIR:-/tmp}/issue-challenge-body.XXXXXX")
   ISSUE_CHALLENGE_COMMENT_FILE=$(mktemp "${TMPDIR:-/tmp}/issue-challenge-comment.XXXXXX")
   ```
   Write the revised body to the body file and update the issue when it materially changes:
   ```bash
   gh issue edit <issue-number> --body-file "$ISSUE_CHALLENGE_BODY_FILE"
   ```
   Update the title in the same command only when the old title no longer describes the chosen
   problem. Avoid cosmetic churn when the existing issue already captures the conclusion.
9. Post a concise audit comment after a successful body update, or as the issue update when no body
   change is needed. Inspect existing comments first. Skip an identical repeated conclusion only
   when no newer valid Plan Phase or material issue update needs a fresh challenge record. Use the
   matching outcome in the marker:
   ```markdown
   <!-- codex-marketplace:issue-challenge:issue-<issue-number>:<outcome> -->
   ## Challenge Review

   **Outcome:** `<outcome>`

   <decision, strongest reasons, issue changes, and planning impact>
   ```
   Write the comment to a temporary file and publish it with:
   ```bash
   gh issue comment <issue-number> --body-file "$ISSUE_CHALLENGE_COMMENT_FILE"
   ```
10. If the outcome is `pending`, `defer`, or `recommend-close`, add the workflow-owned
    `codex-pending` label and stop. Never close the issue without explicit user approval:
    ```bash
    gh label create codex-pending --description "Waiting for Codex workflow input" --color FFA500 2>/dev/null || true
    gh issue edit <issue-number> --add-label codex-pending
    ```
    Treat the label as a visual signal, not the source of truth for the selected outcome.
    If `revise` invalidates an existing Plan Phase, state that in the audit comment and run
    `issue-plan` again before implementation. A `proceed` outcome is a design conclusion, not
    implementation approval.
11. Return the issue URL, selected outcome, material changes, and whether replanning or a human
    decision is required. Do not implement code in this skill.

## Related Skills

- Use `issue-select` when the revised direction needs a different PR-sized issue or sub-issue.
- Use `issue-plan` before challenging a detailed plan and again after a `revise` outcome.
- Use `issue-implement` only after the current plan is valid and explicitly approved.
