# Changesets

Changesets track **what changed and how to version it** on a per-PR basis. Instead of editing `package.json` by hand, you drop a small markdown file here whenever a PR changes user-facing behavior; the release flow consumes all accumulated changesets, bumps versions, writes `CHANGELOG.md`s, and publishes to npm.

## When to add one

You should add a changeset whenever your PR touches:

- Public API of `@alikhalilll/nuxt-api-provider`, `@alikhalilll/nuxt-crypto`, or `@alikhalilll/nuxt-auto-middleware`.
- Behavior visible to consumers (new option, changed default, bug fix users will feel).

Skip it for docs-only, CI, repo tooling, or refactors that don't change behavior.

## How

From the repo root:

```bash
pnpm changeset
```

You'll be asked which packages change, the bump level (`patch` / `minor` / `major`), and a summary. Commit the generated `.md` file with your PR.

- **patch** — bug fix, docs that affect the published package, internal perf.
- **minor** — new feature, new export, new option with a safe default.
- **major** — breaking change to public API, a removal, a changed default that breaks existing users.

## Release flow

Maintainers:

```bash
pnpm changeset version   # apply changesets → bump versions + update CHANGELOGs
pnpm install             # refresh lockfile
git commit -am "chore(release): version packages"
pnpm changeset publish   # publish to npm + push tags
```

`pnpm changeset status` shows what would be released.
