/**
 * Dependency-free progress + spinner utilities for the tk CLI.
 *
 * Designed for two modes:
 *  - **TTY**: live-updating progress bar / spinner using `\r` + ANSI cursor.
 *  - **Non-TTY** (CI logs, file redirects): degrade to plain status lines.
 *
 * No external deps — picocolors is the only allowed import here so this works
 * in the release script's child-process boundary without surprise installs.
 */
import pc from 'picocolors';

const isTTY = !!process.stdout.isTTY && !process.env.CI;
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';
const CLEAR_LINE = '\x1b[2K\r';

export type PhaseStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed';

const PHASE_GLYPH: Record<PhaseStatus, string> = {
  pending: pc.dim('○'),
  running: pc.cyan('◐'),
  done: pc.green('●'),
  skipped: pc.dim('◌'),
  failed: pc.red('✗'),
};

/**
 * Multi-item progress display: shows overall completion across a known set
 * of items (e.g. packages to release), plus a per-item phase tracker.
 *
 * Renders, in TTY mode, as a card that updates in place; in non-TTY mode,
 * each phase transition prints one line.
 */
export class ReleaseProgress {
  private currentItem = 0;
  private itemPhases = new Map<string, { name: string; status: PhaseStatus }[]>();
  private currentLabel = '';
  private cardLineCount = 0;

  constructor(
    private readonly items: string[],
    private readonly phases: string[]
  ) {
    for (const item of items) {
      this.itemPhases.set(
        item,
        phases.map((name) => ({ name, status: 'pending' as PhaseStatus }))
      );
    }
    if (isTTY) process.stdout.write(HIDE_CURSOR);
  }

  /** Begin work on a new item (1-indexed in display). */
  startItem(item: string): void {
    const idx = this.items.indexOf(item);
    if (idx < 0) throw new Error(`Unknown item: ${item}`);
    this.currentItem = idx + 1;
    this.currentLabel = item;
    if (!isTTY) {
      const banner = pc.bold(pc.cyan(`\n[${this.currentItem}/${this.items.length}] ${item}`));
      console.log(banner);
    } else {
      this.redraw();
    }
  }

  /** Mark a phase running/done/skipped/failed for the current item. */
  setPhase(phase: string, status: PhaseStatus): void {
    const phases = this.itemPhases.get(this.currentLabel);
    if (!phases) return;
    const p = phases.find((x) => x.name === phase);
    if (!p) return;
    p.status = status;
    if (!isTTY) {
      const glyph = PHASE_GLYPH[status];
      const tail =
        status === 'failed' ? pc.red(' failed') : status === 'skipped' ? pc.dim(' skipped') : '';
      console.log(`  ${glyph} ${phase}${tail}`);
    } else {
      this.redraw();
    }
  }

  /** Print a child-process stdout/stderr region cleanly under the card. */
  log(line: string): void {
    if (isTTY) this.clearCard();
    console.log(line);
    if (isTTY) this.redraw();
  }

  /** Print the final summary and release the TTY. */
  finish(): void {
    if (isTTY) {
      this.clearCard();
      process.stdout.write(SHOW_CURSOR);
    }
  }

  private clearCard(): void {
    if (!isTTY || this.cardLineCount === 0) return;
    for (let i = 0; i < this.cardLineCount; i++) {
      process.stdout.write(CLEAR_LINE);
      if (i < this.cardLineCount - 1) process.stdout.write('\x1b[1A');
    }
    this.cardLineCount = 0;
  }

  private redraw(): void {
    this.clearCard();
    const lines: string[] = [];
    const ratio = this.items.length > 0 ? this.currentItem / this.items.length : 0;
    const bar = renderBar(ratio, 24);
    lines.push(
      `${pc.bold(pc.cyan('▸'))} ${bar}  ${pc.bold(`${this.currentItem}/${this.items.length}`)} ${pc.dim('·')} ${pc.bold(this.currentLabel)}`
    );
    const phases = this.itemPhases.get(this.currentLabel);
    if (phases) {
      const row = phases
        .map((p) => `${PHASE_GLYPH[p.status]} ${dimIfPending(p.name, p.status)}`)
        .join(pc.dim('  ·  '));
      lines.push(`  ${row}`);
    }
    process.stdout.write(lines.join('\n') + '\n');
    this.cardLineCount = lines.length;
  }
}

/**
 * Single-task spinner for indeterminate work (e.g. "packing", "fetching").
 * Falls back to a plain status line in non-TTY mode.
 */
export class Spinner {
  private static FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private timer?: NodeJS.Timeout;
  private frame = 0;
  private label: string;

  constructor(label: string) {
    this.label = label;
  }

  start(): this {
    if (!isTTY) {
      console.log(`${pc.cyan('→')} ${this.label}…`);
      return this;
    }
    process.stdout.write(HIDE_CURSOR);
    this.timer = setInterval(() => {
      const f = Spinner.FRAMES[this.frame++ % Spinner.FRAMES.length];
      process.stdout.write(`${CLEAR_LINE}${pc.cyan(f)} ${this.label}`);
    }, 80);
    return this;
  }

  update(label: string): void {
    this.label = label;
  }

  succeed(label = this.label): void {
    this.stop();
    console.log(`${pc.green('✓')} ${label}`);
  }

  fail(label = this.label): void {
    this.stop();
    console.log(`${pc.red('✖')} ${label}`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    if (isTTY) process.stdout.write(`${CLEAR_LINE}${SHOW_CURSOR}`);
  }
}

function renderBar(ratio: number, width: number): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  const filled = Math.round(clamped * width);
  const empty = width - filled;
  return pc.green('█'.repeat(filled)) + pc.dim('░'.repeat(empty));
}

function dimIfPending(label: string, status: PhaseStatus): string {
  return status === 'pending' ? pc.dim(label) : label;
}

/** Print a card-style banner (used for section headers in the release flow). */
export function card(title: string, lines: string[] = []): void {
  const width = Math.max(title.length + 4, ...lines.map((l) => stripAnsi(l).length + 4), 40);
  const bar = '─'.repeat(width - 2);
  console.log(pc.dim(`╭${bar}╮`));
  console.log(
    pc.dim('│ ') + pc.bold(pc.cyan(title)) + ' '.repeat(width - 3 - title.length) + pc.dim('│')
  );
  if (lines.length) {
    console.log(pc.dim(`├${bar}┤`));
    for (const line of lines) {
      const visible = stripAnsi(line).length;
      console.log(pc.dim('│ ') + line + ' '.repeat(Math.max(0, width - 3 - visible)) + pc.dim('│'));
    }
  }
  console.log(pc.dim(`╰${bar}╯`));
}

function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}
