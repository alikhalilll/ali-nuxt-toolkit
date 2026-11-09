<script setup lang="ts">
/**
 * Logo system.
 *
 * Built on four rules:
 *   1. One idea — a circular seal with a single glyph per package.
 *   2. One shape system — every mark shares the same outer geometry.
 *   3. Monoline + currentColor — the mark takes the colour of whatever surrounds it.
 *   4. Scales 16px to 256px without breaking.
 *
 * The glyph per package is the shortest thing we can write that answers
 * "what does this do?" — not a metaphor, not a mascot.
 *
 *   brand   `@a`   — the npm scope, which is the identity
 *   skel    bars   — the shape the component actually draws
 *   tel     `+1`   — a dial code, the thing you type
 *   api     `{}`   — the typed response
 *   crypto  `***`  — plaintext becoming ciphertext
 *   mid     `λ`    — a middleware function
 */
useSeoMeta({ title: 'Logo system · ali-nuxt-toolkit', robots: 'noindex, nofollow' });

interface Mark {
  id: string;
  pkg: string;
  glyph: string;
  function: string;
  why: string;
}

const marks: Mark[] = [
  {
    id: 'seal-brand',
    pkg: 'ali-nuxt-toolkit',
    glyph: '@a',
    function: 'The scope of the published toolkit.',
    why: 'Every package in this toolkit ships as @alikhalilll/*. The mark is that scope, abbreviated. Reads instantly as "published, by one maker, under this namespace."',
  },
  {
    id: 'seal-skel',
    pkg: 'a-smart-skeleton',
    glyph: 'bars',
    function: 'Draws a measured skeleton while your data loads.',
    why: 'The mark is three descending bars — exactly what the component paints in the loading state. The logo is literally a frozen frame of the component doing its job.',
  },
  {
    id: 'seal-tel',
    pkg: 'a-tel-input',
    glyph: 'smartphone + dial pad + call button',
    function: 'International phone input — country auto-detect, validation, picker.',
    why: 'A full smartphone silhouette with the 3×3 dial pad on its screen and a filled call button at the bottom. Three nested truths at once: the device (phone body), the action (dial pad), and the commit (call button). A user who has never seen the package name still reads "dial a phone."',
  },
  {
    id: 'seal-api',
    pkg: 'nuxt-api-provider',
    glyph: '{ }',
    function: 'Typed fetch client — request, response, caching.',
    why: 'Curly braces are what the response lives inside — and what TypeScript types it with. Two characters that say "typed HTTP."',
  },
  {
    id: 'seal-crypto',
    pkg: 'nuxt-crypto',
    glyph: '***',
    function: 'AES encryption of strings on the Web Crypto API.',
    why: 'Three asterisks are the universal glyph for "this used to be text, now it isn\'t." The mark is a word that encryption has replaced.',
  },
  {
    id: 'seal-mid',
    pkg: 'nuxt-auto-middleware',
    glyph: 'λ',
    function: 'Layout-based middleware dispatch.',
    why: 'Lambda is the function in programming. Middleware is a function that runs before the page. The mark honours the computer-science vocabulary of the thing.',
  },
];

const alternatives = [
  {
    name: 'The Pentagon',
    thesis: 'A 5-sided mark, one point per package. Highlights count as the identity.',
    rejected: 'Too literal — the count will change if a package is added or deprecated.',
  },
  {
    name: 'The Prism',
    thesis: 'Nuxt-inspired refraction. One beam enters, many exit.',
    rejected:
      'Borrowed equity. Reads as "Nuxt again" rather than "this toolkit." Flattery, not identity.',
  },
  {
    name: 'The Signature',
    thesis: 'A handwritten personal mark — "ali" as a monogram.',
    rejected: 'Breaks at favicon size. A signature only works at the scale of a stamp on paper.',
  },
  {
    name: 'Mascot (bone, cat, etc.)',
    thesis: 'Illustrative character that carries personality.',
    rejected:
      "A solo-dev toolkit doesn't have room for a mascot's maintenance cost. One good character is a full-time job.",
  },
];
</script>

<template>
  <div class="ls">
    <!-- Hero -->
    <header class="ls__hero">
      <div class="ls__eyebrow">
        <span class="ls__eyebrow-dot" aria-hidden="true" />
        Logo system
      </div>
      <h1>How a logo should be built</h1>
      <p class="ls__lede">
        Four rules, applied once to the brand and once to each package. The old 122 options on this
        page are gone — they were sketches, not a system. This is the system.
      </p>
    </header>

    <!-- Rules -->
    <section class="ls__rules">
      <h2>Rules</h2>
      <ol class="ls__rules-list">
        <li>
          <strong>One idea.</strong> A circular seal — because a toolkit by one maker is a signed,
          stamped thing — containing a single glyph that says what the package does. No metaphor
          stacking.
        </li>
        <li>
          <strong>One system.</strong> Every mark shares the same outer geometry (<code>r=26</code>,
          <code>stroke-width=2.5</code>). You can line all six up and they read as a family.
        </li>
        <li>
          <strong>Monoline + currentColor.</strong> The mark takes the colour of whatever surrounds
          it. No fills, no gradients. One file works in dark mode, light mode, an avatar, a favicon,
          a sticker.
        </li>
        <li>
          <strong>Scales 16px → 256px.</strong> Legible as a favicon (16), on a nav bar (24), on a
          doc-page header (48), as a hero mark (128+).
        </li>
      </ol>
    </section>

    <!-- The system -->
    <section class="ls__system">
      <h2>The master mark</h2>
      <p>
        The brand mark is the system in its purest form. Every package mark is a structural copy of
        it — same seal, different glyph.
      </p>
      <div class="ls__hero-mark">
        <svg viewBox="0 0 64 64" width="160" height="160" fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
          <text
            x="32"
            y="42"
            font-family="'Geist Mono', 'JetBrains Mono', ui-monospace, monospace"
            font-size="22"
            font-weight="700"
            text-anchor="middle"
            fill="currentColor"
            letter-spacing="-0.02em"
          >
            @a
          </text>
        </svg>
      </div>
    </section>

    <!-- The six marks — large -->
    <section class="ls__marks">
      <h2>The six marks</h2>
      <p>
        Each mark below shows the logo at its hero size (120px), then the glyph it carries, then why
        that glyph was chosen. Nothing here is a metaphor — every glyph is something you'd actually
        type when using the package.
      </p>

      <article v-for="mark in marks" :key="mark.id" class="ls__mark">
        <div class="ls__mark-preview">
          <!-- Brand -->
          <svg
            v-if="mark.id === 'seal-brand'"
            viewBox="0 0 64 64"
            width="120"
            height="120"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
            <text
              x="32"
              y="42"
              font-family="'Geist Mono', 'JetBrains Mono', ui-monospace, monospace"
              font-size="22"
              font-weight="700"
              text-anchor="middle"
              fill="currentColor"
              letter-spacing="-0.02em"
            >
              @a
            </text>
          </svg>

          <!-- Skeleton -->
          <svg
            v-else-if="mark.id === 'seal-skel'"
            viewBox="0 0 64 64"
            width="120"
            height="120"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
            <rect x="18" y="24" width="28" height="3" rx="1.5" fill="currentColor" />
            <rect x="18" y="31" width="22" height="3" rx="1.5" fill="currentColor" opacity="0.65" />
            <rect x="18" y="38" width="14" height="3" rx="1.5" fill="currentColor" opacity="0.35" />
          </svg>

          <!-- Tel (smartphone + dial pad + call button) -->
          <svg
            v-else-if="mark.id === 'seal-tel'"
            viewBox="0 0 64 64"
            width="120"
            height="120"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
            <rect
              x="22"
              y="12"
              width="20"
              height="40"
              rx="4"
              stroke="currentColor"
              stroke-width="2.5"
            />
            <line
              x1="28"
              y1="16"
              x2="36"
              y2="16"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              opacity="0.6"
            />
            <g fill="currentColor">
              <circle cx="28" cy="24" r="1.3" />
              <circle cx="32" cy="24" r="1.3" />
              <circle cx="36" cy="24" r="1.3" />
              <circle cx="28" cy="30" r="1.3" />
              <circle cx="32" cy="30" r="1.3" />
              <circle cx="36" cy="30" r="1.3" />
              <circle cx="28" cy="36" r="1.3" />
              <circle cx="32" cy="36" r="1.3" />
              <circle cx="36" cy="36" r="1.3" />
            </g>
            <circle cx="32" cy="44" r="2.5" fill="currentColor" />
          </svg>

          <!-- API -->
          <svg
            v-else-if="mark.id === 'seal-api'"
            viewBox="0 0 64 64"
            width="120"
            height="120"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
            <text
              x="32"
              y="43"
              font-family="'Geist Mono', 'JetBrains Mono', ui-monospace, monospace"
              font-size="26"
              font-weight="700"
              text-anchor="middle"
              fill="currentColor"
              letter-spacing="-0.02em"
            >
              { }
            </text>
          </svg>

          <!-- Crypto -->
          <svg
            v-else-if="mark.id === 'seal-crypto'"
            viewBox="0 0 64 64"
            width="120"
            height="120"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
            <text
              x="32"
              y="42"
              font-family="'Geist Mono', 'JetBrains Mono', ui-monospace, monospace"
              font-size="26"
              font-weight="900"
              text-anchor="middle"
              fill="currentColor"
              letter-spacing="0.05em"
            >
              ***
            </text>
          </svg>

          <!-- Middleware -->
          <svg
            v-else-if="mark.id === 'seal-mid'"
            viewBox="0 0 64 64"
            width="120"
            height="120"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
            <text
              x="32"
              y="44"
              font-family="'Geist Mono', 'JetBrains Mono', ui-monospace, monospace"
              font-size="30"
              font-weight="500"
              text-anchor="middle"
              fill="currentColor"
            >
              λ
            </text>
          </svg>
        </div>

        <div class="ls__mark-text">
          <div class="ls__mark-head">
            <code class="ls__mark-id">{{ mark.id }}</code>
            <span class="ls__mark-pkg">{{ mark.pkg }}</span>
          </div>
          <h3 class="ls__mark-fn">{{ mark.function }}</h3>
          <p class="ls__mark-why">{{ mark.why }}</p>
          <div class="ls__mark-glyph-row">
            <span class="ls__mark-glyph-label">glyph</span>
            <code class="ls__mark-glyph">{{ mark.glyph }}</code>
          </div>
        </div>
      </article>
    </section>

    <!-- Also considered -->
    <section class="ls__alts">
      <h2>Directions rejected</h2>
      <p>
        Four alternative systems I sketched and threw out. Each had one fatal flaw that made it
        unusable at the scale a real brand has to survive.
      </p>

      <article v-for="alt in alternatives" :key="alt.name" class="ls__alt">
        <h3>{{ alt.name }}</h3>
        <p class="ls__alt-thesis">{{ alt.thesis }}</p>
        <p class="ls__alt-rej">
          <span class="ls__alt-tag">Why rejected</span>
          {{ alt.rejected }}
        </p>
      </article>
    </section>

    <!-- Scale test -->
    <section class="ls__scale">
      <h2>Scale test</h2>
      <p>
        Same brand mark, rendered at the four sizes the logo actually has to survive. If any size
        feels illegible, the whole system is wrong.
      </p>
      <div class="ls__scale-row">
        <div class="ls__scale-slot">
          <svg viewBox="0 0 64 64" width="16" height="16" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
            <text
              x="32"
              y="42"
              font-family="'Geist Mono', monospace"
              font-size="22"
              font-weight="700"
              text-anchor="middle"
              fill="currentColor"
            >
              @a
            </text>
          </svg>
          <span>16px · favicon</span>
        </div>
        <div class="ls__scale-slot">
          <svg viewBox="0 0 64 64" width="24" height="24" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
            <text
              x="32"
              y="42"
              font-family="'Geist Mono', monospace"
              font-size="22"
              font-weight="700"
              text-anchor="middle"
              fill="currentColor"
            >
              @a
            </text>
          </svg>
          <span>24px · nav</span>
        </div>
        <div class="ls__scale-slot">
          <svg viewBox="0 0 64 64" width="48" height="48" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
            <text
              x="32"
              y="42"
              font-family="'Geist Mono', monospace"
              font-size="22"
              font-weight="700"
              text-anchor="middle"
              fill="currentColor"
            >
              @a
            </text>
          </svg>
          <span>48px · header</span>
        </div>
        <div class="ls__scale-slot">
          <svg viewBox="0 0 64 64" width="96" height="96" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" />
            <text
              x="32"
              y="42"
              font-family="'Geist Mono', monospace"
              font-size="22"
              font-weight="700"
              text-anchor="middle"
              fill="currentColor"
            >
              @a
            </text>
          </svg>
          <span>96px · hero</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ls {
  max-width: 48rem;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
}

/* ─── Hero ────────────────────────────────── */

.ls__hero {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  box-shadow: inset 0 -1px 0 var(--color-border);
}
.ls__hero h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 2.75rem);
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.03em;
  line-height: 1.05;
}
.ls__lede {
  margin: 0;
  max-width: 36rem;
  color: var(--color-text-dim);
  font-size: 1.0625rem;
  line-height: 1.6;
}

.ls__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent-muted);
  color: var(--color-accent);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.ls__eyebrow-dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
}

/* ─── Shared section ──────────────────────── */

.ls section {
  margin-top: 3.5rem;
}
.ls h2 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.015em;
}
.ls section > p {
  margin: 0 0 1.5rem;
  color: var(--color-text-dim);
  font-size: 0.9375rem;
  line-height: 1.6;
  max-width: 42rem;
}

/* ─── Rules ───────────────────────────────── */

.ls__rules-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0;
  margin: 0;
  list-style: none;
  counter-reset: rule;
}
.ls__rules-list li {
  position: relative;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border-radius: 0.5rem;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: var(--color-text-dim);
  font-size: 0.9375rem;
  line-height: 1.55;
  counter-increment: rule;
}
.ls__rules-list li::before {
  content: counter(rule, decimal-leading-zero);
  position: absolute;
  left: 1rem;
  top: 0.9rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
  letter-spacing: 0.04em;
}
.ls__rules-list strong {
  color: var(--color-text);
  font-weight: 600;
}
.ls__rules-list code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: var(--accent-soft);
  padding: 0.125em 0.375em;
  border-radius: 4px;
  color: var(--color-text);
}

/* ─── The master mark ─────────────────────── */

.ls__hero-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  border-radius: 1rem;
  background: linear-gradient(180deg, var(--color-surface-2), var(--color-surface) 60%);
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: var(--color-text);
}

/* ─── The six marks ───────────────────────── */

.ls__marks {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ls__mark {
  display: grid;
  grid-template-columns: 9rem minmax(0, 1fr);
  gap: 1.5rem;
  align-items: center;
  margin: 0;
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-border);
}
.ls__mark-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: var(--color-bg);
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: var(--color-text);
}

.ls__mark-text {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
}

.ls__mark-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.ls__mark-id {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: var(--color-surface-2);
}
.ls__mark-pkg {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text);
  font-weight: 500;
}

.ls__mark-fn {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
}
.ls__mark-why {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.875rem;
  line-height: 1.55;
}

.ls__mark-glyph-row {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}
.ls__mark-glyph-label {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.ls__mark-glyph {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent-muted);
}

@media (max-width: 580px) {
  .ls__mark {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }
  .ls__mark-preview {
    width: 100%;
  }
}

/* ─── Alternatives ────────────────────────── */

.ls__alt {
  margin: 0 0 1rem;
  padding: 1.125rem 1.25rem;
  border-radius: 0.75rem;
  box-shadow: inset 0 0 0 1px var(--color-border);
}
.ls__alt h3 {
  margin: 0 0 0.375rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}
.ls__alt-thesis {
  margin: 0 0 0.625rem;
  font-size: 0.8125rem;
  color: var(--color-text-dim);
  line-height: 1.55;
}
.ls__alt-rej {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.55;
}
.ls__alt-tag {
  display: inline-block;
  margin-right: 0.375rem;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: color-mix(in oklab, var(--danger) 15%, transparent);
  color: var(--danger);
}

/* ─── Scale test ──────────────────────────── */

.ls__scale-row {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 2rem;
  border-radius: 1rem;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: var(--color-text);
}
.ls__scale-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.ls__scale-slot span {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}
</style>
