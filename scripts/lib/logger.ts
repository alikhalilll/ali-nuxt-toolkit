import pc from 'picocolors';

export const header = (msg: string): void => console.log(`\n${pc.bold(pc.cyan('▸ ' + msg))}`);
export const step = (msg: string): void => console.log(pc.bold(`\n◆ ${msg}`));
export const info = (msg: string): void => console.log(`  ${pc.dim(msg)}`);
export const success = (msg: string): void => console.log(`  ${pc.green('✓')} ${msg}`);
export const warn = (msg: string): void => console.log(`  ${pc.yellow('!')} ${msg}`);
export const fail = (msg: string): void => console.log(`  ${pc.red('✖')} ${msg}`);
export const divider = (): void => console.log(pc.dim('─'.repeat(60)));

export function die(msg: string): never {
  console.error(`\n${pc.red('✖')} ${msg}`);
  process.exit(1);
}
