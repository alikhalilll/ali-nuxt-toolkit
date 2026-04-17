# Contributing

Thanks for your interest in improving **ali-nuxt-toolkit**! This guide gets you from a fresh clone to a mergeable pull request.

## Code of conduct

Be kind, stay on topic, assume good intent. Abuse, harassment, or dismissive behavior will get you removed from the project.

---

## Prerequisites

| Tool    | Version                                                   |
| ------- | --------------------------------------------------------- |
| Node.js | `>= 20.19.0` (see `.nvmrc` / `engines`)                   |
| pnpm    | `10.32.x` (pinned via `packageManager` in `package.json`) |
| Git     | any recent                                                |

Corepack makes the pnpm version automatic:

```bash
corepack enable
```

---

## Setup

```bash
git clone https://github.com/alikhalilll/ali-nuxt-toolkit.git
cd ali-nuxt-toolkit
pnpm install
pnpm build          # build all packages so workspace deps resolve
```

Everyday scripts:

```bash
pnpm build                  # build all packages
pnpm typecheck              # type-check all packages
pnpm lint                   # ESLint
pnpm lint:fix               # ESLint + autofix
pnpm format                 # Prettier write
pnpm format:check           # Prettier verify
pnpm play                   # run the Nuxt playground
pnpm -C apps/docs dev       # run the docs site
pnpm -C packages/<name> build   # build a single package
```

---

## Repo layout

```
packages/
  api-provider/         # @alikhalilll/nuxt-api-provider
  crypto/               # @alikhalilll/nuxt-crypto
  auto-middleware/      # @alikhalilll/nuxt-auto-middleware
apps/
  docs/                 # Nuxt Content docs site (GitHub Pages)
playgrounds/
  nuxt/                 # integration playground
scripts/
  release/              # interactive release tool
  pack-all.mjs          # build tarballs locally
```

Each package ships three entry points:

- `.` — the **Nuxt module** (default export)
- `./core` — the **framework-agnostic core**
- `./types` — **type-only** exports

Changes to public API must update **all three** surfaces when relevant.

---

## Branching

Work off `master`. Branch names: `feat/<scope>-<short-description>`, `fix/<scope>-<short-description>`, `docs/<topic>`, `chore/<what>`. Keep branches focused — one logical change per PR.

Do **not** force-push to `master`. Force-pushing your own branch during review is fine; prefer `--force-with-lease`.

---

## Commits

We use **Conventional Commits**, enforced by commitlint via a Husky `commit-msg` hook.

```
<type>(<scope>): <subject>

feat(api-provider): add retry jitter option
fix(crypto): propagate SubtleCrypto errors untouched
docs(auto-middleware): document RegExp patterns
chore(repo): bump pnpm
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `release`.

Useful scopes: `api-provider`, `crypto`, `auto-middleware`, `docs`, `playground`, `release`, `repo`, `ci`.

- `feat:` / `fix:` land in the changelog and trigger a minor/patch bump respectively.
- `feat!:` or a `BREAKING CHANGE:` footer indicates a major bump — flag it in the PR description too.
- Subject: ≤ 100 chars, imperative mood, no trailing period.
- One commit per logical change; squash fixups locally before pushing.

---

## Pull requests

1. Open the PR against `master`.
2. Fill in the PR template — summary, scope, test plan, breaking changes.
3. PR **title** must also follow Conventional Commits — it becomes the squash-merge commit.
4. CI must pass: lint, typecheck, build, commitlint.
5. Keep the diff small. Split unrelated cleanup into a separate PR.
6. For public API changes, update **`apps/docs/content/*.md`** in the same PR.
7. **Add a changeset** (`pnpm changeset`) for any user-facing change — see [Versioning](#versioning) below.
8. One approving review is enough for non-breaking changes.

### What to expect in review

- Correctness and type safety first.
- No new runtime dependencies without justification — these modules aim for near-zero deps.
- Public API shape is conservative: adding is cheap, renaming is expensive. We'll push for additive over breaking.

---

## Writing code

### Style

Prettier formats on commit via `lint-staged`. ESLint enforces the rest. If in doubt: run `pnpm lint:fix && pnpm format`.

### Types

Every exported value or type has a corresponding entry in the package's `types.ts`. Don't re-export ambient types from internals — cut narrow, named surfaces.

### Tests

When a package gains a test suite, unit tests live alongside the code. Integration behavior is exercised through `playgrounds/nuxt` during development; add coverage there for module-level features (config parsing, virtual file emission, plugin registration).

### Docs

Behavior changes **require** doc updates:

- `apps/docs/content/<package>.md` — the user-facing guide.
- `README.md` — only if the change is API-shape-level (new module option, new public type, new subpath).

### Demos

Live demos in the docs live in `apps/docs/components/` (e.g., `DemoApiProgress.vue`). If a new feature benefits from an interactive demo, add one — it's often easier to review than prose.

---

## Adding a new public export

Checklist before you merge:

- [ ] Exported from the correct subpath (`./core` or the module root — not both).
- [ ] Typed in `types.ts` and re-exported from `./types`.
- [ ] Documented in `apps/docs/content/<package>.md`.
- [ ] Changelog-worthy — the commit is `feat:` or `fix:`, not `chore:`.
- [ ] Not a breaking change unless the PR description calls it out explicitly.

---

## Versioning

We use [Changesets](https://github.com/changesets/changesets). Every PR that changes user-facing behavior should include a changeset file:

```bash
pnpm changeset
```

The CLI asks which packages changed, the bump level, and a summary. It writes a markdown file under `.changeset/`. Commit that file with your PR.

Bump levels:

- **patch** — bug fix, behavior-affecting docs, internal perf.
- **minor** — new feature, new export, new option with a safe default.
- **major** — breaking change: removed export, changed default, renamed API.

Skip a changeset only if your PR is truly internal (CI, repo tooling, test-only, internal refactor with no behavior change). When in doubt, add one — the release flow respects patch-level no-ops fine.

Check status with `pnpm changeset:status`.

## Releasing (maintainers only)

Two release flows exist — prefer Changesets.

### Changesets (preferred)

1. Merge PRs to `master`. Each PR carrying user-facing changes also lands a `.changeset/*.md` file.
2. The `release.yml` workflow detects pending changesets and opens / updates a **"chore(release): version packages"** PR that bumps versions and updates every `CHANGELOG.md`.
3. Review and merge that PR. The same workflow runs again and publishes the touched packages to npm + pushes tags.

Secrets needed in the repo: `NPM_TOKEN` (npm automation token with publish rights on `@alikhalilll`).

### Legacy interactive script

Kept working for ad-hoc releases; don't interleave it with a pending Changesets version PR.

```bash
pnpm release                # pick packages interactively
pnpm release:api-provider   # target one
pnpm release:dry            # preview without writing
```

You need an `npm login` session with publish rights on `@alikhalilll`.

---

## Security

Found a vulnerability? Please **don't** file a public issue. Use GitHub Security Advisories — see [`SECURITY.md`](./SECURITY.md).

## Questions

Open a GitHub Discussion or a `[question]` issue. We'll point you at the right file or close it with a brief answer.
