# Nuxt playground

Integration playground for the four packages in this monorepo. This is what you run while developing — it imports the packages via `workspace:*`, so your `.ts`/`.vue` changes under `packages/*` are reflected live.

## Run it

From the repo root:

```bash
pnpm install        # once
pnpm build          # once, so `.d.ts` exists for workspace deps
pnpm play           # Nuxt dev server on http://localhost:3000
```

You only need to re-run `pnpm build` when you change `package.json` exports or hit a stale type issue — source changes reload automatically.

## What's exercised here

| Area                                                                                                  | Where                                                       |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `@alikhalilll/nuxt-api-provider` — basic client, retry, progress                                      | `pages/api-*.vue`, `composables/useApi.ts`                  |
| `@alikhalilll/nuxt-crypto` — encrypt/decrypt round-trip, server-only mode, device-fingerprint binding | `pages/crypto.vue`, `server/api/*`                          |
| `@alikhalilll/nuxt-auto-middleware` — layout rules, groups, per-page overrides                        | `middleware/*.ts`, `layouts/*.vue`, `pages/dashboard/*.vue` |
| `@alikhalilll/ui` — tell-input + popover/drawer/responsive-popover via the bundled Nuxt module        | `pages/ui.vue` (module wired in `nuxt.config.ts`)           |

Every module is configured in `nuxt.config.ts` — that's also the canonical example of how a downstream user would wire all four together. `@alikhalilll/ui/nuxt` registers every component for auto-import, so a page can use `<ATellInput>` directly without an explicit `import` statement.

## Adding coverage

If you're landing a new feature in a package, add the smallest page/route here that proves it works end-to-end. PR reviewers open the playground to verify — you're making their job easier.

## Debugging

```bash
DEBUG=auto-middleware pnpm play   # verbose rule resolution logs
```

Set `autoMiddleware.debug: true` in `nuxt.config.ts` for the same without an env var.
