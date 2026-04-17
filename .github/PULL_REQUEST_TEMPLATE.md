<!--
Thanks for contributing to ali-nuxt-toolkit!

PR title must follow Conventional Commits — it becomes a commit on merge and is validated by commitlint. Examples:

  feat(api-provider): add retry jitter option
  fix(crypto): propagate SubtleCrypto errors untouched
  docs(auto-middleware): document RegExp patterns
  chore(repo): bump pnpm

Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, release.
-->

## Summary

<!-- One or two sentences: what does this change and why. -->

## Scope

<!-- Check one or more. Keep PRs scoped to a single area when possible. -->

- [ ] `@alikhalilll/nuxt-api-provider`
- [ ] `@alikhalilll/nuxt-crypto`
- [ ] `@alikhalilll/nuxt-auto-middleware`
- [ ] `apps/docs`
- [ ] `playgrounds/nuxt`
- [ ] Repo / tooling / CI

## Change type

- [ ] Bug fix (no breaking change)
- [ ] New feature (no breaking change)
- [ ] Breaking change (requires a major bump)
- [ ] Docs / tooling / internal only

## Details

<!--
What did you change, and why this approach over alternatives you considered?
Link any related issues: "Fixes #123", "Refs #456".
-->

## Test plan

<!-- How did you verify? Include commands, screenshots, or a minimal repro. -->

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] Playground (`pnpm play`) exercises the change, if user-facing
- [ ] Docs updated (`apps/docs/content/*.md`) if behavior/API changed

## Breaking changes

<!-- If none, write "None". Otherwise describe what breaks and the migration path. -->

## Checklist

- [ ] Title follows Conventional Commits (will be commitlint-checked)
- [ ] Public API changes include type updates and `apps/docs` updates
- [ ] No unrelated refactors bundled into this PR
- [ ] No secrets, credentials, or passphrases committed
