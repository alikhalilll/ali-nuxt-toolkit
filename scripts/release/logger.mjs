import pc from 'picocolors';

export const header = (msg) => console.log(`\n${pc.bold(pc.cyan('▸ ' + msg))}`);
export const step = (msg) => console.log(pc.bold(`\n◆ ${msg}`));
export const info = (msg) => console.log(`  ${pc.dim(msg)}`);
export const success = (msg) => console.log(`  ${pc.green('✓')} ${msg}`);
export const warn = (msg) => console.log(`  ${pc.yellow('!')} ${msg}`);
export const fail = (msg) => console.log(`  ${pc.red('✖')} ${msg}`);
export const divider = () => console.log(pc.dim('─'.repeat(60)));

export function die(msg) {
  console.error(`\n${pc.red('✖')} ${msg}`);
  process.exit(1);
}
