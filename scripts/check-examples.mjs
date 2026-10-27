// Keeps every example-specific line between that example's markers (CONTRIBUTING.md, "Example Markers").
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXAMPLES = {
  lib: {
    folders: ['packages/shared/', 'packages/lib/'],
    identifiers: ['packages/shared', 'packages/lib', '@monorepo/shared', '@monorepo/lib'],
  },
  cli: { folders: ['packages/cli/'], identifiers: ['packages/cli', '@monorepo/cli'] },
  web: {
    folders: ['packages/web/'],
    identifiers: ['packages/web', '@monorepo/web', 'playwright', 'size-limit', 'axe-core'],
  },
  'template-only': { folders: [], identifiers: [] },
};

// Files that name every identifier on purpose, and the lockfile.
const SKIPPED = ['pnpm-lock.yaml', 'scripts/check-examples.mjs', 'scripts/check-examples.test.ts'];

const MARKER = {
  html: /^<!--\s*(\/?)example:(\S+?)\s*-->$/,
  hash: /^#\s*(\/?)example:(\S+)$/,
  slash: /^\/\/\s*(\/?)example:(\S+)$/,
};

// A comment that opens with example:<a known example> but isn't a strict marker.
// Prose like "## Example: usage" or "// For example:" names no example, so it passes.
const LOOSE = new RegExp(
  `^(<!--|#|//|/\\*)\\s*/?\\s*example\\s*:\\s*(${Object.keys(EXAMPLES).join('|')})(?![\\w-])`,
  'i',
);

function styleOf(file) {
  const ext = extname(file);
  const name = basename(file);
  if (ext === '.md') return 'html';
  if (['.yml', '.yaml'].includes(ext) || name === '.gitignore') return 'hash';
  if (file.startsWith('.husky/')) return 'hash';
  if (['.ts', '.mts', '.cts', '.tsx', '.js', '.mjs', '.cjs', '.jsonc'].includes(ext))
    return 'slash';
  if (/^tsconfig.*\.json$/.test(name) || name === 'turbo.json') return 'slash';
  return null;
}

/** @param {Map<string, string>} files @returns {{file: string, line: number, message: string}[]} */
export function checkExamples(files) {
  const problems = [];
  for (const [file, text] of files) {
    if (SKIPPED.includes(file)) continue;
    const add = (line, message) => problems.push({ file, line, message });
    const style = styleOf(file);
    const stack = [];
    let fence = null;
    for (const [index, raw] of text.split('\n').entries()) {
      const line = index + 1;
      const trimmed = raw.trim();
      const fenceMark = style === 'html' && trimmed.match(/^(`{3,}|~{3,})/)?.[1][0];
      if (fenceMark && !fence) fence = fenceMark;
      else if (fenceMark === fence) fence = null;
      const inFence = fence !== null;
      const found = Object.entries(MARKER).find(([, re]) => re.test(trimmed));
      if (found) {
        const [kind, re] = found;
        const [, closing, name] = trimmed.match(re);
        if (inFence) add(line, `example:${name} marker inside a code fence`);
        else if (kind !== style) add(line, 'unknown marker style');
        else if (!Object.hasOwn(EXAMPLES, name)) add(line, `unknown example "${name}"`);
        else if (closing) {
          if (stack.at(-1)?.name === name) stack.pop();
          else add(line, `example:${name} closes without a matching opening`);
        } else {
          if (stack.length) add(line, `example:${name} opens inside example:${stack.at(-1).name}`);
          stack.push({ name, line });
        }
        continue;
      }
      if (!inFence && LOOSE.test(trimmed)) add(line, 'malformed marker');
      const open = stack.at(-1)?.name;
      const lower = raw.toLowerCase();
      for (const [name, example] of Object.entries(EXAMPLES)) {
        if (name === open || example.folders.some((folder) => file.startsWith(folder))) continue;
        const hit = example.identifiers.find((id) => lower.includes(id.toLowerCase()));
        if (hit) add(line, `${hit} appears outside example:${name} markers`);
      }
    }
    for (const { name, line } of stack) add(line, `example:${name} opened here is never closed`);
    if (style === 'slash' && extname(file) === '.json')
      problems.push(...trailingCommas(file, text));
  }
  return problems;
}

// Removing any set of examples (always with template-only) must leave valid JSON behind.
// Reports only the smallest failing sets: a superset of one fails the same way.
function trailingCommas(file, text) {
  const names = Object.keys(EXAMPLES).filter((name) => name !== 'template-only');
  const problems = [];
  const failed = [];
  for (let mask = 0; mask < 2 ** names.length; mask++) {
    if (failed.some((subset) => (mask & subset) === subset)) continue;
    const removed = names.filter((_, i) => mask & (2 ** i));
    const kept = [];
    let skipping = null;
    for (const [index, raw] of text.split('\n').entries()) {
      const match = raw.trim().match(MARKER.slash);
      if (match) {
        const [, closing, name] = match;
        if (!closing && !skipping && [...removed, 'template-only'].includes(name)) skipping = name;
        else if (closing && skipping === name) skipping = null;
        continue;
      }
      if (!skipping && !raw.trim().startsWith('//')) kept.push({ raw, line: index + 1 });
    }
    const joined = kept.map((k) => k.raw).join('\n');
    const comma = /,(\s*[}\]])/.exec(joined);
    if (!comma) continue;
    failed.push(mask);
    const before = joined.slice(0, comma.index).split('\n').length - 1;
    const what = (removed.length ? removed : ['template-only']).map((name) => `example:${name}`);
    problems.push({
      file,
      line: kept[before].line,
      message: `removing ${what.join(', ')} leaves a trailing comma`,
    });
  }
  return problems;
}

function main() {
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const listed = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' });
  const files = new Map();
  for (const file of listed.split('\0').filter(Boolean)) {
    try {
      const text = readFileSync(`${root}/${file}`, 'utf8');
      if (!text.includes('\0')) files.set(file, text);
    } catch {
      // Deleted or unreadable: nothing to check.
    }
  }
  const problems = checkExamples(files);
  for (const { file, line, message } of problems) console.log(`${file}:${line} ${message}`);
  if (problems.length) process.exit(1);
}

// realpath on both sides, so a symlinked path (macOS /tmp) still counts as a direct run.
function isDirectRun() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1] ?? '');
  } catch {
    return false;
  }
}

if (isDirectRun()) main();
