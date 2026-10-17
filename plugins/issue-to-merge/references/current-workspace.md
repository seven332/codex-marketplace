# Current Workspace

Reuse the provided Git directory throughout the workflow. Never create another Git worktree,
clone, or alternate checkout as implicit preparation or as a workaround for existing work. If the
provided directory is already a worktree, continue there; do not move or delete it.

Directory reuse does not mean branch reuse. Resume a matching issue/PR on its own branch. For an
independent requirement, preserve the earlier branch and PR, then use the correct feature branch
in this same directory. An unrelated open PR does not itself block new work or need to be merged.

## Prepare For New Work

Use the conversation and existing approvals to decide how to preserve earlier work. Do not ask
again when they clearly authorize the required action. A new requirement allows context-supported
preservation, not blanket permission to commit or publish unknown work. This preparation does not
apply merely because a standalone sync, review, check, or rebase needs a clean working tree; those
operations retain their own authorization and clean-head gates. Read-only invocations stay read-only.

1. Inspect `git status --short --branch`, staged and unstaged diffs, relevant untracked files, the
   current branch/HEAD, and related PR state before switching. Distinguish earlier work from the
   requested implementation. Stop for unclear ownership/scope, unresolved conflicts, an unfinished
   Git operation, or changes that cannot be safely preserved, including dirty submodules.
2. Inspect the branch's configured upstream and intended push destination. Fetch the relevant
   configured remote and compare actual commits; a clean working tree or an empty ahead count
   without a valid upstream does not prove the work was pushed. Do not guess a remote or first-push
   destination when context and configuration do not resolve it.
3. Already committed and pushed work needs no extra checkpoint. For uncommitted earlier work that
   context shows is ready and authorized to commit, validate it, stage only its intended files,
   inspect the staged diff, and make a normal commit. Never bundle unrelated changes, secrets, or
   ignored workflow artifacts, amend history, or commit the new implementation early as preparation.
4. Push unpublished earlier commits when context authorizes their publication to the verified
   destination; verify the result. Use the intended earlier-work feature branch, creating one here
   when needed; general workflow authority does not authorize pushing directly to a default or
   protected target branch. Do not create an extra PR just to preserve earlier work. If a
   push is rejected, reassess rather than force-pushing. When publication is unavailable or not
   appropriate, retain the commits on their named original branch and report them as unpublished.
   Continue only if the requested work does not depend on publishing them and its base is clear;
   ask when publication intent or destination needs a decision. A stash does not preserve commits.
5. When committing is not appropriate but context permits preserving the understood local changes,
   use the recoverable-stash procedure below, then continue in this directory. Do not stop solely
   because known earlier work is uncommitted. If neither checkpointing nor stashing is safe, ask
   for direction here instead of creating another checkout or discarding changes.
6. Recheck status and preservation before switching. Fetch the intended base's configured remote
   and synchronize as the caller requires, then create or switch to the feature branch here. Use
   that verified remote target tip for independent new work unless another base is explicitly
   intended. A local default branch with unpublished commits is not automatically a valid base;
   preserve it, do not reset it or
   silently carry its commits into the new PR. Protect local files against checkout collisions.

## Recoverable Stashes

- Inspect the paths to preserve, including staged/unstaged differences and relevant untracked
  files. Use a unique, task-identifying stash message and preserve both index and working-tree
  changes. Include untracked files when needed, for example with `git stash push --include-untracked`
  scoped to the understood paths. Do not use `--all` to sweep ignored files or `codex-work/` into
  the stash. Unknown files need assessment, not a blind stash or cleanup.
- Verify the new stash's unique identity and saved content, then capture its full object ID, not
  just the shifting `stash@{n}` position. Do not mistake another operation's latest stash for this
  one; stop if attribution is ambiguous. Before switching, follow the [work-file contract](repository-work-files.md)
  and retain a unique recovery receipt under
  `<codex-work>/state/issue-to-merge/workspace/`. Record the stash ID, repository, original branch
  and HEAD, preserved paths/index state, reason, and restoration instructions. Verify that the
  intended changes were saved and that the working tree is safe to switch. If stashing fails or
  leaves changes behind, inspect the result before any retry; do not reset or force a checkout.
- Leave earlier stashes alone unless their identity and scope are verified for the work being
  resumed. Restore on the appropriate original branch, with a safe working tree and any intervening
  branch changes understood; never automatically apply old work to the unrelated new feature.
  Prefer `git stash apply --index <stash-object-id>` so the saved index can be restored while the
  stash remains available. On conflicts or incomplete recovery, keep the stash and receipt and
  stop for resolution. Do not use `stash pop` or drop a stash before verifying complete recovery.
- Report any still-unpublished branch and any retained stash's object ID, original branch, receipt
  path, and next restoration step in the handoff. Finishing the new requirement does not authorize
  dropping earlier work. Remove a receipt only after the preserved work is recovered and verified;
  transient command-file cleanup must not remove it.
