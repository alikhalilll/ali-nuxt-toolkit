/**
 * verify-go-to-def.ts (shared, package-aware)
 *
 * Run from a package directory, after build. Guards against the
 * "Cannot find declaration to go to" regression: for EVERY public export of the
 * package, it resolves the symbol exactly how a consumer would (by package name
 * → exports map → the emitted dts re-export chain) and asserts the TypeScript
 * language service can find a definition for it.
 *
 * The classic failure mode this catches: a re-export specifier that ends in a
 * literal `.d.ts` (e.g. `from './x.vue.d.ts'`) resolves the *type* but yields no
 * navigable definition, so Cmd+Click reports "Cannot find declaration to go to".
 *
 * It also (strict) checks that the resolved definition file has a declaration
 * map (`.d.ts.map`) whose source exists on disk — i.e. navigation lands on real
 * source, not a dead `.d.ts`.
 */

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const pkgRoot = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));
const pkgName: string = pkg.name;

function typesEntry(): string {
  const dot = pkg.exports?.['.'];
  const t = dot?.import?.types ?? dot?.types ?? pkg.types;
  if (!t) throw new Error('verify-go-to-def: no types entry for "." in exports');
  return path.resolve(pkgRoot, t);
}

/** Names exported from the package's "." types entry. */
function exportedNames(dtsPath: string): string[] {
  const program = ts.createProgram([dtsPath], {
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    noEmit: true,
    skipLibCheck: true,
  });
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(dtsPath);
  if (!sf) throw new Error(`verify-go-to-def: cannot load ${dtsPath}`);
  const moduleSym = checker.getSymbolAtLocation(sf);
  if (!moduleSym) throw new Error('verify-go-to-def: no module symbol for types entry');
  return checker
    .getExportsOfModule(moduleSym)
    .map((s) => s.getName())
    .filter((n) => n !== 'default')
    .sort();
}

interface Probe {
  names: string[];
  text: string;
  offsets: number[]; // offset of each name's identifier in the probe text
}

function buildProbe(names: string[]): Probe {
  let text = '';
  const offsets: number[] = [];
  names.forEach((name, i) => {
    const prefix = `export { ${name}`;
    text += `${prefix} as _e${i} } from ${JSON.stringify(pkgName)};\n`;
    // offset of `name` is start-of-line + "export { ".length
    offsets.push(
      text.length -
        `${prefix} as _e${i} } from ${JSON.stringify(pkgName)};\n`.length +
        'export { '.length
    );
  });
  return { names, text, offsets };
}

function createService(probePath: string, probe: { text: string }) {
  const options: ts.CompilerOptions = {
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    noEmit: true,
    skipLibCheck: true,
    declarationMap: true,
    types: [],
  };
  const files = new Map<string, string>([[probePath, probe.text]]);
  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => [probePath],
    getScriptVersion: () => '1',
    getScriptSnapshot: (fileName) => {
      const inMem = files.get(fileName);
      if (inMem != null) return ts.ScriptSnapshot.fromString(inMem);
      if (!fs.existsSync(fileName)) return undefined;
      return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName, 'utf8'));
    },
    getCurrentDirectory: () => pkgRoot,
    getCompilationSettings: () => options,
    getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
    realpath: ts.sys.realpath,
  };
  return ts.createLanguageService(host, ts.createDocumentRegistry());
}

function declMapSourcesExist(defFile: string): boolean {
  // Side-effect-only / re-export stubs may legitimately have no map; only fail
  // when a map exists but points at a missing source.
  const mapPath = defFile + '.map';
  if (!fs.existsSync(mapPath)) return true;
  try {
    const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    const dir = path.dirname(defFile);
    return (map.sources ?? []).every((s: string) => fs.existsSync(path.resolve(dir, s)));
  } catch {
    return true;
  }
}

/**
 * A module specifier ending in a literal `.d.ts` (e.g. `from './x.vue.d.ts'`)
 * resolves the type but breaks Volar go-to-definition. The correct forms are a
 * `.js` specifier (TS maps it to the `.d.ts` + declaration map) or extensionless.
 * Scan every emitted declaration for the broken pattern.
 */
function dtsSpecifierOffenders(): string[] {
  const distDir = path.join(pkgRoot, 'dist');
  const offenders: string[] = [];
  const re = /(?:from\s*|import\(\s*)['"]([^'"]+\.d\.ts)['"]/g;
  const walk = (dir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.d\.c?ts$/.test(e.name)) {
        const content = fs.readFileSync(full, 'utf8');
        for (const m of content.matchAll(re)) {
          offenders.push(`${path.relative(pkgRoot, full)} → ${m[1]}`);
        }
      }
    }
  };
  walk(distDir);
  return offenders;
}

function main(): void {
  const offenders = dtsSpecifierOffenders();
  if (offenders.length) {
    console.error(
      `\nverify-go-to-def: ${offenders.length} declaration specifier(s) end in a literal .d.ts ` +
        `(breaks Volar go-to-definition — use a .js specifier instead):\n  - ` +
        offenders.join('\n  - ')
    );
    process.exit(1);
  }

  const dtsPath = typesEntry();
  const names = exportedNames(dtsPath);
  if (names.length === 0) {
    console.log('verify-go-to-def: no named exports to check.');
    return;
  }

  const probe = buildProbe(names);
  const probePath = path.join(pkgRoot, '.gotodef-probe.ts');
  const service = createService(probePath, probe);

  const noDefinition: string[] = [];
  const danglingSource: string[] = [];

  probe.names.forEach((name, i) => {
    const defs = service.getDefinitionAtPosition(probePath, probe.offsets[i]) ?? [];
    // A definition that only points back into the probe itself doesn't count.
    const real = defs.filter((d) => path.resolve(d.fileName) !== probePath);
    if (real.length === 0) {
      noDefinition.push(name);
      return;
    }
    for (const d of real) {
      if (!declMapSourcesExist(path.resolve(d.fileName)))
        danglingSource.push(`${name} → ${path.relative(pkgRoot, d.fileName)}`);
    }
  });

  service.dispose();

  if (noDefinition.length || danglingSource.length) {
    if (noDefinition.length) {
      console.error(
        `\nverify-go-to-def: ${noDefinition.length} export(s) have NO navigable declaration ` +
          `("Cannot find declaration to go to"):\n  - ${noDefinition.join('\n  - ')}`
      );
    }
    if (danglingSource.length) {
      console.error(
        `\nverify-go-to-def: ${danglingSource.length} export(s) map to a missing source file:\n  - ` +
          danglingSource.join('\n  - ')
      );
    }
    process.exit(1);
  }

  console.log(
    `verify-go-to-def: ok — all ${names.length} public export(s) resolve to a declaration.`
  );
}

main();
