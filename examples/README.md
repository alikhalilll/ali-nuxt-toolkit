# Examples

Runnable, focused recipes — one scenario per folder. These complement the full guides in `apps/docs` and the end-to-end playground in `playgrounds/nuxt`.

> **Looking for a quick browser repro?** Use the Stackblitz template linked from the [root README](../README.md#quick-start).

## Planned / wanted

We'd love community contributions for:

- `auth-with-interceptor/` — Nuxt app using `nuxt-api-provider` + `nuxt-auto-middleware` to wire a Bearer-token interceptor, a 401-redirect error interceptor, and layout-based `@auth` rules.
- `encrypted-cookie/` — `nuxt-crypto` (server-only mode) encrypting a session cookie in a Nitro route and decrypting it in a server-only composable.
- `file-upload-progress/` — `nuxt-api-provider` with `onRequestProgress` driving a progress bar during a multipart upload.
- `cli-consumer/` — `@alikhalilll/nuxt-api-provider/core` used in a Node CLI script (no Nuxt), to demonstrate the framework-agnostic core.

See [`CONTRIBUTING.md`](../CONTRIBUTING.md) — a fresh example is a great first contribution. Each example should:

- Live under `examples/<kebab-case-name>/` with its own `README.md`, `package.json`, and `nuxt.config.ts`.
- Depend on the workspace packages via `workspace:*` (mirror what `playgrounds/nuxt` does).
- Be small — one scenario, not a kitchen-sink.
- Include a one-line description at the top of the README that states the problem and the packages involved.
