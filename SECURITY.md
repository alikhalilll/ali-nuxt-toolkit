# Security policy

## Supported versions

Security fixes land on the latest minor of each package. We do not back-port patches to older majors unless the vulnerability is high severity.

| Package                                            | Supported |
| -------------------------------------------------- | --------- |
| `@alikhalilll/nuxt-api-provider` — latest minor    | ✅        |
| `@alikhalilll/nuxt-crypto` — latest minor          | ✅        |
| `@alikhalilll/nuxt-auto-middleware` — latest minor | ✅        |

## Reporting a vulnerability

**Do not open a public GitHub issue.**

Please report vulnerabilities privately via GitHub Security Advisories:

<https://github.com/alikhalilll/ali-nuxt-toolkit/security/advisories/new>

Include:

- Affected package and version (`pnpm why` output helps).
- A minimal reproduction or PoC.
- Expected vs. observed behavior.
- Severity and blast radius as you understand it.

## What to expect

- **Acknowledgement** within 72 hours.
- **Assessment** within 7 days — we'll confirm severity and scope.
- **Fix + coordinated disclosure** — a patched release and an advisory with credit (if you'd like it).

## Scope

In scope:

- Cryptographic correctness in `@alikhalilll/nuxt-crypto` (algorithm usage, payload handling, key derivation, cache behavior).
- Request handling, header leakage, and interceptor ordering in `@alikhalilll/nuxt-api-provider`.
- Middleware bypasses in `@alikhalilll/nuxt-auto-middleware`.
- Supply-chain issues in the published packages (not forks).

Out of scope:

- Vulnerabilities only reproducible in playgrounds, examples, or the docs site.
- Denial-of-service via knowingly passing an unreasonable input (e.g., a multi-gigabyte body).
- Anything that requires an already-compromised host.
