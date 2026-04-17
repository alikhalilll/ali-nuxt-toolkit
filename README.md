# ali-nuxt-toolkit

A monorepo of three focused, strongly-typed Nuxt 3/4 modules published under the `@alikhalilll` npm scope. Each package is independently usable.

| Package | Purpose |
| --- | --- |
| [`@alikhalilll/nuxt-api-provider`](./packages/api-provider) | Typed `fetch` client with interceptors, retry, and pluggable hooks. |
| [`@alikhalilll/nuxt-crypto`](./packages/crypto) | Symmetric encryption via Web Crypto (AES-GCM + PBKDF2), with key caching and pluggable algorithms. |
| [`@alikhalilll/nuxt-auto-middleware`](./packages/auto-middleware) | Declarative layout-based middleware with glob matching and per-page overrides. |

Each package ships:

- A Nuxt module (default export from `.`)
- A framework-agnostic core (`./core` subpath) for non-Nuxt consumers
- Full type exports (`./types` subpath)

## Monorepo layout

```
packages/
  api-provider/
  crypto/
  auto-middleware/
playgrounds/
  nuxt/             # Integration playground
```

## Scripts

```bash
pnpm install
pnpm build          # Build all packages
pnpm typecheck      # Type-check all packages
pnpm play           # Run the Nuxt playground
```

Each package supports `pnpm -C packages/<name> build|typecheck`.

## Releasing

The release flow bumps the version, builds, publishes to npm, commits a `chore(release): <pkg>@<version>` commit, tags it, and pushes.

```bash
# Interactive (pick packages, bump, dist-tag, confirm):
pnpm release

# All packages, fully interactive:
pnpm release:all

# Target one package by name:
pnpm release:api-provider
pnpm release:crypto
pnpm release:auto-middleware

# Preview without writing anything:
pnpm release:dry

# Fully non-interactive:
node scripts/release/index.mjs --all --bump patch --tag latest
node scripts/release/index.mjs --pkg api-provider,crypto --bump minor
```

Flags: `--pkg <names>` (comma-separated), `--all`, `--bump <patch|minor|major|prerelease|none>`, `--tag <latest|next|beta|...>`, `--branch <name>`, `--interactive`, `--dry-run`, `--skip-git`, `--skip-publish`.

To create tarballs without publishing:

```bash
pnpm pack:all               # all three into ./artifacts/
pnpm pack:api-provider      # one
```

You'll need to be logged in (`npm login`) and have publish rights to the `@alikhalilll` scope.
