// Keeps every example-specific line between that example's markers (CONTRIBUTING.md, "Example Markers").
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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

function styleOf(file) {
  const relative = file;
  const ext = extname(file);
  const name = basename(file);
  if (ext === '.md') return 'html';
  if (['.yml', '.yaml'].includes(ext) || name === '.gitignore') return 'hash';
  if (relative.startsWith('.husky/')) return 'hash';
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
    let inFence = false;
    for (const [index, raw] of text.split('\n').entries()) {
      const line = index + 1;
      const trimmed = raw.trim();
      if (style === 'html' && trimmed.startsWith('```')) inFence = !inFence;
      const found = Object.entries(MARKER).find(([, re]) => re.test(trimmed));
      if (found) {
        const [kind, re] = found;
        const [, closing, name] = trimmed.match(re);
        if (inFence) add(line, `example:${name} marker inside a code fence`);
        else if (kind !== style) add(line, 'unknown marker style');
        else if (!(name in EXAMPLES)) add(line, `unknown example "${name}"`);
        else if (closing) {
          if (stack.at(-1)?.name === name) stack.pop();
          else add(line, `example:${name} closes without a matching opening`);
        } else {
          if (stack.length) add(line, `example:${name} opens inside example:${stack.at(-1).name}`);
          stack.push({ name, line });
        }
        continue;
      }
      const open = stack.at(-1)?.name;
      const lower = raw.toLowerCase();
      for (const [name, example] of Object.entries(EXAMPLES)) {
        if (name === open || example.folders.some((folder) => file.startsWith(folder))) continue;
        const hit = example.identifiers.find((id) => lower.includes(id.toLowerCase()));
        if (hit) add(line, `${hit} appears outside example:${name} markers`);
      }
    }
    for (const { name, line } of stack) add(line, `example:${name} opened here is never closed`);
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

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
