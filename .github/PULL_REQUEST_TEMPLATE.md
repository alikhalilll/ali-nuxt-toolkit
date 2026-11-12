<!--
Thanks for contributing to ali-nuxt-toolkit.

PR TITLE must follow Conventional Commits — it becomes the squash-merge commit and is
validated by commitlint. Examples:

  feat(a-tel-input): add Zod async refine integration
  feat(a-smart-skeleton): add 'sweep' reveal strategy
  fix(api-provider): reject with ApiError when AbortSignal fires mid-retry
  fix(crypto): propagate SubtleCrypto errors untouched
  docs(auto-middleware): document RegExp patterns
  chore(repo): bump pnpm

Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, release.
Allowed scopes: a-tel-input, a-smart-skeleton, api-provider, crypto, auto-middleware,
                docs, playground, release, repo, ci, deps.
-->

## Summary

<!-- One or two sentences: what does this change and why. -->

## Scope

<!-- Tick what this PR touches. Keep PRs scoped — split unrelated changes. -->

- [ ] `@alikhalilll/a-tel-input`
- [ ] `@alikhalilll/a-smart-skeleton`
- [ ] `@alikhalilll/nuxt-api-provider`
- [ ] `@alikhalilll/nuxt-crypto`
- [ ] `@alikhalilll/nuxt-auto-middleware`
- [ ] Internal UI components (`a-input` / `a-popover` / `a-drawer` / `a-responsive-popover` / `a-ui-base`)
- [ ] `apps/docs`
- [ ] `playgrounds/nuxt`
- [ ] Repo / tooling / CI

## Change type

- [ ] Bug fix (no breaking change)
- [ ] New feature (no breaking change)
- [ ] Breaking change (requires a major bump — flag in **Breaking changes** below)
- [ ] Docs / tooling / internal only

## Details

<!--
What did you change, and why this approach over alternatives you considered? Note any
prior-art libraries or browser-API quirks you researched (CLAUDE.md §2). Link related
issues: "Fixes #123", "Refs #456".
-->

## Test plan

<!-- How did you verify? Include commands, screenshots, or a minimal repro. -->

- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm -r --if-present test` passes
- [ ] `pnpm build` passes
- [ ] `pnpm tk validate <package>` passes for every touched package (`publint` + `attw` + consumer install)
- [ ] Playground (`pnpm play`) exercises the change, if user-facing
- [ ] Docs updated under `apps/docs/content/` if behaviour or public API changed

## Breaking changes

<!-- Write "None" if none. Otherwise describe what breaks and the migration path. -->

## Changeset

- [ ] I added a changeset (`pnpm changeset`) — required for any user-facing change
- [ ] This PR is internal-only (CI / tooling / repo refactor with no behaviour change)

## Design-discipline checklist

<!-- See CLAUDE.md §1. Tick what applies. -->

- [ ] Types defined before implementations; public API surfaced through exported types
- [ ] Side effects confined to the smallest possible boundary (walkers / formatters stay pure)
- [ ] Runtime variants routed through a dispatch table, not an `if`-chain
- [ ] New runtime deps justified in **Details** (near-zero-deps policy)
- [ ] No cross-subpath imports (Nuxt module code stays out of `./core`)

## Final checklist

- [ ] PR title follows Conventional Commits (commitlint will verify)
- [ ] Public API changes include type exports and `apps/docs` updates
- [ ] No unrelated refactors bundled into this PR
- [ ] No secrets, credentials, passphrases, or `.env` files committed
- [ ] `package.json` `version` fields untouched (maintainer-managed — CLAUDE.md §3)
