# Contributing

Thanks for your interest in improving **ali-nuxt-toolkit**. This guide takes you from a fresh
clone to a mergeable pull request.

## Code of conduct

Be kind, stay on topic, assume good intent. See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).
Abuse, harassment, or dismissive behaviour will get you removed from the project.

---

## Prerequisites

| Tool    | Version                                                        |
| ------- | -------------------------------------------------------------- |
| Node.js | `>= 20.19.0` (see `engines`)                                   |
| pnpm    | `10.32.x` (pinned via `packageManager` in root `package.json`) |
| Git     | any recent                                                     |

Corepack gives you the correct pnpm version automatically:

```bash
corepack enable
```

---

## Setup

```bash
git clone https://github.com/alikhalilll/ali-nuxt-toolkit.git
cd ali-nuxt-toolkit
pnpm install
pnpm build          # build every workspace package so cross-package deps resolve
```

Everyday scripts:

```bash
pnpm build                  # build all workspace packages
pnpm typecheck              # type-check all workspace packages
pnpm lint                   # ESLint
pnpm lint:fix               # ESLint + autofix
pnpm format                 # Prettier write
pnpm format:check           # Prettier verify
pnpm -r --if-present test   # Vitest, where present
pnpm play                   # run the Nuxt playground
pnpm -C apps/docs dev       # run the docs site
pnpm -C packages/<name> build   # build one package
```

Everything else goes through the **`tk` CLI** — see [`scripts/tk.ts`](./scripts/tk.ts) for the
full surface:

```bash
pnpm tk                        # interactive menu
pnpm tk build a-tel-input      # build one package
pnpm tk pack all               # build .tgz tarballs → ./artifacts/ (no publish)
pnpm tk validate all           # build + publint + attw + consumer install
pnpm tk consumer --pkg crypto  # consumer-install check only (faster)
pnpm tk dev play:packed        # playground running against packed tarballs
```

---

## Repo layout

```
packages/
  api-provider/                # @alikhalilll/nuxt-api-provider
  crypto/                      # @alikhalilll/nuxt-crypto
  auto-middleware/             # @alikhalilll/nuxt-auto-middleware
  ui-components/
    ATelInput/                 # @alikhalilll/a-tel-input
    ASmartSkeleton/            # @alikhalilll/a-smart-skeleton
    AInput/ APopover/ ADrawer/ # internal — bundled into the UI packages' dist
    AResponsivePopover/ AUiBase/
apps/
  docs/                        # Nuxt Content docs site (GitHub Pages)
playgrounds/
  nuxt/                        # integration playground
scripts/
  tk.ts                        # single entry point to every task
  release/ build/ pack/ validate/ playground/ lib/
```

Every **Nuxt-module package** exposes three entry points:

| Subpath   | What it is                                   |
| --------- | -------------------------------------------- |
| `.`       | Nuxt module (default export)                 |
| `./core`  | Framework-agnostic core — Node / Bun / tests |
| `./types` | Type-only exports                            |

Public API changes must update **all three** surfaces when relevant.

**UI component packages** (`a-tel-input`, `a-smart-skeleton`) ship a different shape:

| Subpath          | What it is                                 |
| ---------------- | ------------------------------------------ |
| `.`              | Plain Vue 3 component (works outside Nuxt) |
| `./nuxt`         | Nuxt module auto-register                  |
| `./styles.css`   | Bundled stylesheet                         |
| `./resolver`     | `unplugin-vue-components` resolver         |
| `./zod`          | Zod helpers (where applicable)             |
| `./vee-validate` | VeeValidate composables (where applicable) |

---

## Design discipline

Non-negotiable — enforced in review. See [`CLAUDE.md`](./CLAUDE.md) for the full policy.

- **Types first.** Public API is defined by exported types, implementations second.
  Discriminated unions over boolean flags.
- **Pure-function first.** Side effects (DOM reads, `localStorage`, network) confined to the
  smallest possible boundary. Walkers, transformers, formatters stay pure and testable.
- **Strategy pattern over `if` chains.** Runtime variants (reveal modes, auth presets, cache
  strategies) are entries in a dispatch table.
- **Composition over inheritance.** Render-function composition, composables, slot trees.
- **SSR-safe.** No `window` / `document` at module scope. Browser-only effects behind
  `onMounted`. Hydration-stable DOM.
- **Boundary purity.** `./core` must not import from the Nuxt module surface and vice versa.

For non-trivial features: survey ≥ 2–3 prior-art libraries and check MDN for the
browser-API quirks **before** writing code. Capture the research as inline comments
naming the alternatives considered.

---

## Branching

Work off `master`. Branch names:

- `feat/<scope>-<short-description>`
- `fix/<scope>-<short-description>`
- `docs/<topic>`
- `chore/<what>`

One logical change per PR. Do **not** force-push to `master`. Force-pushing your own branch
during review is fine — prefer `--force-with-lease`.

---

## Commits

**Conventional Commits**, enforced by commitlint via a Husky `commit-msg` hook and by
`wagoid/commitlint-github-action` in CI.

```
<type>(<scope>): <subject>

feat(a-tel-input): add Zod async refine integration
feat(a-smart-skeleton): add 'sweep' reveal strategy
fix(api-provider): reject with ApiError when AbortSignal fires mid-retry
docs(auto-middleware): document RegExp patterns
chore(repo): bump pnpm
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, `revert`, `release`.

Useful scopes: `a-tel-input`, `a-smart-skeleton`, `api-provider`, `crypto`,
`auto-middleware`, `docs`, `playground`, `release`, `repo`, `ci`, `deps`.

- `feat:` / `fix:` land in the changelog and trigger a minor / patch bump.
- `feat!:` or a `BREAKING CHANGE:` footer indicates a major bump — flag it in the PR too.
- Subject: ≤ 100 chars, imperative mood, no trailing period.
- One commit per logical change; squash fixups locally before pushing.

---

## Pull requests

1. Open the PR against `master`.
2. Fill in the PR template — summary, scope, test plan, breaking changes, design checklist.
3. PR **title** must also follow Conventional Commits — it becomes the squash-merge commit.
4. CI must pass (see [Quality gates](#quality-gates) below).
5. Keep the diff small. Split unrelated cleanup into a separate PR.
6. For public API changes, update **`apps/docs/content/*.md`** in the same PR.
7. **Add a changeset** (`pnpm changeset`) for any user-facing change — see
   [Versioning](#versioning).
8. One approving review is enough for non-breaking changes.

### What to expect in review

- Correctness and type safety first.
- No new runtime dependencies without justification — every package aims for near-zero deps.
- Public API shape is conservative: adding is cheap, renaming is expensive. We'll push for
  additive over breaking.

---

## Quality gates

The pipeline is layered — fast checks fail fast; expensive checks only run where they
catch real bugs.

| Check               | Where it runs                    | How to run locally             |
| ------------------- | -------------------------------- | ------------------------------ |
| Lint                | CI every PR / push               | `pnpm lint`                    |
| Format              | CI every PR / push               | `pnpm format:check`            |
| Commit messages     | CI every PR                      | (husky pre-commit hook, local) |
| Typecheck           | CI every PR / push               | `pnpm typecheck`               |
| Vitest              | CI every PR / push               | `pnpm -r --if-present test`    |
| Build (Node 20, 22) | CI every PR / push               | `pnpm build`                   |
| Packaging validate  | CI on PRs; pre-flight on release | `pnpm tk validate all`         |
| Dependency review   | CI every PR                      | (GitHub-side only)             |
| CodeQL              | CI every PR / push + weekly cron | (GitHub-side only)             |

`pnpm tk validate` runs `publint` + `@arethetypeswrong/cli` + a real consumer install for
every publishable package — this catches `exports` misconfig and type-resolution bugs that
a plain `pnpm build` can't.

---

## Writing code

### Style

Prettier formats on commit via `lint-staged`. ESLint enforces the rest. If in doubt:
`pnpm lint:fix && pnpm format`.

### Types

Every exported value or type has a corresponding entry in the package's `types.ts`. Don't
re-export ambient internals — cut narrow, named surfaces.

### Tests

- Unit tests live alongside the code (see `packages/ui-components/ASmartSkeleton/tests/`
  for the current reference).
- Run via Vitest; add a `"test": "vitest run"` script to any package that doesn't have one
  yet and tests will pick up automatically in CI (`pnpm -r --if-present test`).
- Integration behaviour is exercised through `playgrounds/nuxt` during development; add
  coverage there for module-level features (config parsing, virtual file emission, plugin
  registration).

### Docs

Behaviour changes **require** doc updates:

- `apps/docs/content/<package>.md` — the user-facing guide.
- Per-package `README.md` — if the change is API-shape-level (new module option, new
  public type, new subpath).
- Root `README.md` — rarely; only for new top-level packages or new cross-cutting features.

### Demos

Live demos in the docs live under `apps/docs/components/` (e.g., `DemoApiProgress.vue`).
If a new feature benefits from an interactive demo, add one — it's often easier to review
than prose.

---

## Adding a new public export

Checklist before you merge:

- [ ] Exported from the correct subpath (`./core` or the module root — not both).
- [ ] Typed in `types.ts` and re-exported from `./types`.
- [ ] Documented in `apps/docs/content/<package>.md`.
- [ ] Changelog-worthy — the commit is `feat:` or `fix:`, not `chore:`.
- [ ] Not a breaking change unless the PR description calls it out explicitly.
- [ ] `pnpm tk validate <package>` passes — the consumer install exercises the new export.

---

## Versioning

We use [Changesets](https://github.com/changesets/changesets). Every PR that changes
user-facing behaviour should include a changeset:

```bash
pnpm changeset
```

The CLI asks which packages changed, the bump level, and a summary. It writes a markdown
file under `.changeset/`. Commit that file with your PR.

Bump levels:

- **patch** — bug fix, behaviour-affecting docs, internal perf.
- **minor** — new feature, new export, new option with a safe default.
- **major** — breaking change: removed export, changed default, renamed API.

Skip a changeset only if your PR is truly internal (CI, repo tooling, test-only, internal
refactor with no behaviour change). When in doubt, add one — the release flow handles
patch no-ops fine.

Check status with `pnpm changeset status --verbose`.

> Do **not** bump `package.json` versions by hand in `@alikhalilll/*` packages. Version
> bumps are maintainer-managed via the release flow ([`CLAUDE.md`](./CLAUDE.md) §3).

---

## Releasing (maintainers only)

Two paths exist. Prefer the Changesets flow for anything that lands via PR; use the
interactive `tk release` for ad-hoc single-package releases.

### 1. Changesets (preferred)

1. PRs land on `master` with their `.changeset/*.md` entries.
2. `release.yml` runs its pre-flight validation (lint + typecheck + test + `tk validate all`),
   then opens / updates a **"chore(release): version packages"** PR that bumps versions and
   regenerates every `CHANGELOG.md`.
3. Review and merge the release PR. The workflow re-runs and publishes to npm with **SLSA
   signed provenance** (`NPM_CONFIG_PROVENANCE=true`) and pushes tags.

Required repo secret: `NPM_TOKEN` (automation token with publish rights on `@alikhalilll`).

### 2. Interactive — `pnpm tk release`

For one-off releases or when you want to cut a single package without going through a
version PR. The script bumps the version, builds, publishes, tags, and auto-writes a
`.changeset/*.md` entry documenting what shipped — so the paper trail stays consistent
with the Changesets flow.

```bash
pnpm tk release                # pick packages interactively
pnpm tk release a-tel-input    # target one
pnpm tk release --dry-run      # preview without writing anything
```

You need an `npm login` session with publish rights on `@alikhalilll`.

Don't interleave `tk release` with a pending Changesets version PR — pick one path per
release cycle.

---

## Security

Found a vulnerability? Please **don't** file a public issue. Use GitHub Security Advisories
— see [`SECURITY.md`](./SECURITY.md).

---

## Questions

Open a GitHub Discussion or a `[question]` issue. We'll point you at the right file or
close it with a brief answer.
