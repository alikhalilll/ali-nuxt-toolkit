/**
 * gen-web-types.ts (shared, package-aware)
 *
 * Run from a package directory. Emits `web-types.json` (JetBrains component
 * metadata) from the package's public `*Props` / `*Slots` / `*Emits` interfaces.
 * The TS checker flattens `extends` chains, so props a component forwards to a
 * reka-ui / vaul-vue parent appear too. Handles both object-map emits (reka-ui)
 * and call-signature emits (vaul-vue), strips machine-specific `import("…")`
 * qualifiers, and cleans `{@link}` tags.
 *
 * The component list comes from a per-package `web-types.config.ts`:
 *   export const components: ComponentSpec[] = [ { name, module, typesFile, props?, slots?, emits? } ]
 * where `module` is the full package name (e.g. '@alikhalilll/a-input') and
 * `typesFile` is relative to the package root.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const pkgRoot = process.cwd();

export interface ComponentSpec {
  name: string;
  module: string;
  typesFile: string;
  props?: string;
  slots?: string;
  emits?: string;
}

interface WebTypesProp {
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
}
interface WebTypesNamed {
  name: string;
  description?: string;
  deprecated?: boolean;
}
interface VueComponent {
  name: string;
  source: { module: string; symbol: string };
  description?: string;
  props?: WebTypesProp[];
  slots?: WebTypesNamed[];
  js?: { events?: WebTypesNamed[] };
}

async function loadComponents(): Promise<ComponentSpec[]> {
  const configPath = path.join(pkgRoot, 'web-types.config.ts');
  if (!fs.existsSync(configPath))
    throw new Error(`gen-web-types: missing web-types.config.ts in ${pkgRoot}`);
  const mod = await import(pathToFileURL(configPath).href);
  const components: ComponentSpec[] = mod.components ?? mod.default;
  if (!Array.isArray(components))
    throw new Error('gen-web-types: web-types.config.ts must export `components`');
  return components.map((c) => ({ ...c, typesFile: path.resolve(pkgRoot, c.typesFile) }));
}

function loadProgram(typeFiles: string[]): ts.Program {
  const configPath = path.join(pkgRoot, 'tsconfig.json');
  const host: ts.ParseConfigFileHost = {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (d) => {
      throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    },
  };
  const parsed = ts.getParsedCommandLineOfConfigFile(configPath, {}, host);
  if (!parsed) throw new Error('Could not parse tsconfig.json');
  return ts.createProgram({ rootNames: typeFiles, options: { ...parsed.options, noEmit: true } });
}

async function main(): Promise<void> {
  const components = await loadComponents();
  const typeFiles = [...new Set(components.map((c) => c.typesFile))];
  const program = loadProgram(typeFiles);
  const checker = program.getTypeChecker();

  function moduleExports(typesFile: string): ts.Symbol[] {
    const sf = program.getSourceFile(typesFile);
    if (!sf) throw new Error(`Source file not found in program: ${typesFile}`);
    const moduleSymbol = checker.getSymbolAtLocation(sf);
    if (!moduleSymbol) throw new Error(`No module symbol for: ${typesFile}`);
    return checker.getExportsOfModule(moduleSymbol);
  }
  function findExport(typesFile: string, name: string): ts.Symbol | undefined {
    return moduleExports(typesFile).find((s) => s.getName() === name);
  }
  function typeOfSymbol(symbol: ts.Symbol): ts.Type {
    const decl = symbol.declarations?.[0];
    if (decl && ts.isTypeAliasDeclaration(decl)) return checker.getTypeFromTypeNode(decl.type);
    return checker.getDeclaredTypeOfSymbol(symbol);
  }
  function cleanDoc(text: string): string {
    return text.replace(/\{@link\s+([^}]+?)\s*\}/g, '$1').trim();
  }
  function description(symbol: ts.Symbol): string | undefined {
    const text = cleanDoc(ts.displayPartsToString(symbol.getDocumentationComment(checker)));
    return text || undefined;
  }
  function isDeprecated(symbol: ts.Symbol): boolean {
    return symbol.getJsDocTags(checker).some((t) => t.name === 'deprecated');
  }
  function isOptional(prop: ts.Symbol): boolean {
    if (prop.flags & ts.SymbolFlags.Optional) return true;
    return prop.declarations?.some((d) => ts.isPropertySignature(d) && !!d.questionToken) ?? false;
  }
  function typeString(prop: ts.Symbol, optional: boolean): string {
    const decl = prop.valueDeclaration ?? prop.declarations?.[0];
    const t = decl
      ? checker.getTypeOfSymbolAtLocation(prop, decl)
      : checker.getDeclaredTypeOfSymbol(prop);
    let str = checker.typeToString(t, decl, ts.TypeFormatFlags.NoTruncation);
    str = str.replace(/import\("[^"]*"\)\./g, '');
    if (optional && str.endsWith(' | undefined')) str = str.slice(0, -' | undefined'.length);
    return str;
  }

  function collectProps(spec: ComponentSpec): WebTypesProp[] {
    if (!spec.props) return [];
    const symbol = findExport(spec.typesFile, spec.props);
    if (!symbol) throw new Error(`Props interface ${spec.props} not found for ${spec.name}`);
    return typeOfSymbol(symbol)
      .getProperties()
      .map((prop) => {
        const optional = isOptional(prop);
        const entry: WebTypesProp = {
          name: prop.getName(),
          type: typeString(prop, optional),
          required: !optional,
        };
        const desc = description(prop);
        if (desc) entry.description = desc;
        if (isDeprecated(prop)) entry.deprecated = true;
        return entry;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  function collectSlots(spec: ComponentSpec): WebTypesNamed[] {
    if (!spec.slots) return [];
    const symbol = findExport(spec.typesFile, spec.slots);
    if (!symbol) throw new Error(`${spec.slots} not found for ${spec.name}`);
    return typeOfSymbol(symbol)
      .getProperties()
      .map((member) => {
        const entry: WebTypesNamed = { name: member.getName() };
        const desc = description(member);
        if (desc) entry.description = desc;
        if (isDeprecated(member)) entry.deprecated = true;
        return entry;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  function collectEvents(spec: ComponentSpec): WebTypesNamed[] {
    if (!spec.emits) return [];
    const symbol = findExport(spec.typesFile, spec.emits);
    if (!symbol) throw new Error(`${spec.emits} not found for ${spec.name}`);
    const type = typeOfSymbol(symbol);
    const byName = new Map<string, WebTypesNamed>();
    for (const member of type.getProperties()) {
      const entry: WebTypesNamed = { name: member.getName() };
      const desc = description(member);
      if (desc) entry.description = desc;
      if (isDeprecated(member)) entry.deprecated = true;
      byName.set(entry.name, entry);
    }
    for (const sig of type.getCallSignatures()) {
      const param = sig.getParameters()[0];
      if (!param?.valueDeclaration) continue;
      const paramType = checker.getTypeOfSymbolAtLocation(param, param.valueDeclaration);
      const literals = paramType.isUnion() ? paramType.types : [paramType];
      const docs = ts.displayPartsToString(sig.getDocumentationComment(checker)).trim();
      for (const lit of literals) {
        if (!lit.isStringLiteral() || byName.has(lit.value)) continue;
        const entry: WebTypesNamed = { name: lit.value };
        if (docs) entry.description = docs;
        byName.set(entry.name, entry);
      }
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  function buildComponent(spec: ComponentSpec): VueComponent {
    const component: VueComponent = {
      name: spec.name,
      source: { module: spec.module, symbol: spec.name },
    };
    if (spec.props) {
      const propsSymbol = findExport(spec.typesFile, spec.props);
      const desc = propsSymbol && description(propsSymbol);
      if (desc) component.description = desc;
    }
    const props = collectProps(spec);
    if (props.length) component.props = props;
    const slots = collectSlots(spec);
    if (slots.length) component.slots = slots;
    const events = collectEvents(spec);
    if (events.length) component.js = { events };
    return component;
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));
  const webTypes = {
    $schema: 'https://json.schemastore.org/web-types',
    name: pkg.name,
    version: pkg.version,
    'js-types-syntax': 'typescript',
    'description-markup': 'markdown',
    framework: 'vue',
    'framework-config': { 'enable-when': { 'node-packages': ['vue'] } },
    contributions: { html: { 'vue-components': components.map(buildComponent) } },
  };
  const outPath = path.join(pkgRoot, 'web-types.json');
  fs.writeFileSync(outPath, JSON.stringify(webTypes, null, 2) + '\n');
  console.log(
    `web-types.json: ${webTypes.contributions.html['vue-components'].length} components → ${path.relative(pkgRoot, outPath)}`
  );
}

main().catch((err: unknown) => {
  console.error(
    'gen-web-types failed:',
    err instanceof Error ? (err.stack ?? err.message) : String(err)
  );
  process.exit(1);
});
