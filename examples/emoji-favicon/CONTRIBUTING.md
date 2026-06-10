# Contributing

Thanks for considering a contribution.

## Dev loop

```bash
git clone https://github.com/yourname/emoji-favicon.git
cd emoji-favicon
pnpm install
pnpm dev:prepare   # tsdown --stub
pnpm test
```

## Playground

The `playground/` folder is a Nuxt 3 app pre-wired to consume this module from the local stub. Use it to manually verify changes.

```bash
cd playground
pnpm install
pnpm dev
```

## Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commitlint will reject anything else.

Allowed scopes: `core`, `vite`, `vue`, `nuxt`, `resolver`, `docs`, `ci`, `release`, `deps`.

Examples:

- `feat(vue): add useEmojiFavicon composable`
- `fix(core): handle null background option`
- `docs: setup-first README rewrite`

## Pull requests

Open a draft early. Fill out the PR template. Add a test when you add behaviour.

Local must-pass before requesting review:

```bash
pnpm lint
pnpm test
pnpm build
```

## Project conventions

- **`src/core/`** — pure TypeScript. No framework imports. Ever.
- **`src/<adapter>/`** — imports from `src/core` only, never sideways.
- **`src/**/runtime/`** — ships to the browser. **Never imports `@nuxt/kit`\*\* (build-time only). CI enforces this.
- Public types live in `src/core/types.ts` and are re-exported by every adapter.
- `package.json` `exports` order: `types` first, `default` last.

## Release

Tag-driven via GitHub Actions:

```bash
git tag v0.1.0
git push --tags
```

The `Release` workflow builds, tests, lints, dry-runs the tarball, then publishes with `--provenance`.
