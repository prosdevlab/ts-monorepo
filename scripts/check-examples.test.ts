import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkExamples } from './check-examples.mjs';

const check = (files: Record<string, string>) => checkExamples(new Map(Object.entries(files)));
const messages = (files: Record<string, string>) => check(files).map((p) => p.message);

describe('checkExamples', () => {
  it('accepts balanced markers', () => {
    const readme = [
      '# Title',
      '<!-- example:web -->',
      'See packages/web.',
      '<!-- /example:web -->',
    ];
    expect(check({ 'README.md': readme.join('\n') })).toEqual([]);
  });

  it('reports an unclosed marker', () => {
    expect(messages({ 'README.md': '<!-- example:web -->\ntext' })).toEqual([
      'example:web opened here is never closed',
    ]);
  });

  it('reports a nested marker', () => {
    const readme =
      '<!-- example:web -->\n<!-- example:cli -->\n<!-- /example:cli -->\n<!-- /example:web -->';
    expect(check({ 'README.md': readme })).toEqual([
      { file: 'README.md', line: 2, message: 'example:cli opens inside example:web' },
    ]);
  });

  it('reports an unknown name', () => {
    const readme = '<!-- example:webb -->\n<!-- /example:webb -->';
    expect(messages({ 'README.md': readme })).toContain('unknown example "webb"');
  });

  it('reports an example named outside its markers', () => {
    expect(check({ 'README.md': 'Build packages/web first.' })).toEqual([
      { file: 'README.md', line: 1, message: 'packages/web appears outside example:web markers' },
    ]);
  });

  it("ignores identifiers inside the example's own folder", () => {
    expect(check({ 'packages/web/README.md': 'Runs playwright and size-limit.' })).toEqual([]);
  });

  it('reports a marker whose comment style does not match the file', () => {
    expect(messages({ 'ci.yml': '<!-- example:web -->\n<!-- /example:web -->' })).toContain(
      'unknown marker style'
    );
  });

  it('reports a closing marker without an opening', () => {
    expect(check({ 'README.md': 'text\n<!-- /example:web -->' })).toEqual([
      { file: 'README.md', line: 2, message: 'example:web closes without a matching opening' },
    ]);
  });

  it('reports a marker inside a code fence', () => {
    const readme = '```\n<!-- example:web -->\n```';
    expect(messages({ 'README.md': readme })).toEqual(['example:web marker inside a code fence']);
  });

  it('matches identifiers case-insensitively', () => {
    expect(messages({ 'README.md': 'Uses Playwright.' })).toEqual([
      'playwright appears outside example:web markers',
    ]);
  });

  it('accepts CRLF line endings', () => {
    const readme = '<!-- example:web -->\r\nSee packages/web.\r\n<!-- /example:web -->\r\n';
    expect(check({ 'README.md': readme })).toEqual([]);
  });

  it('knows the comment style of .husky hooks and .cts files', () => {
    expect(check({ '.husky/pre-push': '# example:web\nrun playwright\n# /example:web' })).toEqual(
      []
    );
    expect(check({ 'a.cts': '// example:web\nplaywright\n// /example:web' })).toEqual([]);
  });

  it('rejects inherited names such as constructor and toString', () => {
    for (const name of ['constructor', 'toString']) {
      const readme = `<!-- example:${name} -->\n<!-- /example:${name} -->`;
      expect(messages({ 'README.md': readme })).toContain(`unknown example "${name}"`);
    }
  });

  it('reports a malformed marker instead of ignoring it', () => {
    expect(messages({ 'README.md': '<!-- example: web -->' })).toEqual(['malformed marker']);
    expect(messages({ 'a.ts': '// Example:lib' })).toEqual(['malformed marker']);
    expect(messages({ 'ci.yml': '#example :web' })).toEqual(['malformed marker']);
    expect(messages({ 'a.ts': '/* example:cli */' })).toEqual(['malformed marker']);
    expect(messages({ 'a.ts': '// /example: template-only' })).toEqual(['malformed marker']);
  });

  it('leaves prose that says "example:" alone', () => {
    expect(messages({ 'README.md': '## Example: usage' })).toEqual([]);
    expect(messages({ 'README.md': '<!-- Example: see below -->' })).toEqual([]);
    expect(messages({ 'a.ts': '// For example: call it twice' })).toEqual([]);
    expect(messages({ 'ci.yml': '# Example: a matrix entry' })).toEqual([]);
    // A name that only starts like an example is prose too.
    expect(messages({ 'a.ts': '// example: library usage' })).toEqual([]);
  });

  it('treats ~~~ like ``` for code fences', () => {
    expect(messages({ 'README.md': '~~~\n<!-- example:web -->\n~~~' })).toEqual([
      'example:web marker inside a code fence',
    ]);
    // A ~~~ line doesn't close a ``` fence.
    expect(messages({ 'README.md': '```\n~~~\n<!-- example:web -->\n```' })).toEqual([
      'example:web marker inside a code fence',
    ]);
  });

  it('reports a JSON block whose removal leaves a trailing comma', () => {
    const last = ['{', '  "a": 1,', '  // example:lib', '  "b": 2', '  // /example:lib', '}'];
    expect(check({ 'tsconfig.json': last.join('\n') })).toEqual([
      { file: 'tsconfig.json', line: 2, message: 'removing example:lib leaves a trailing comma' },
    ]);
    const first = ['{', '  // example:web', '  "b": [2],', '  // /example:web', '  "a": 1', '}'];
    expect(check({ 'turbo.json': first.join('\n') })).toEqual([]);
  });

  it('reports only the smallest set of removals that leaves a trailing comma', () => {
    const json = ['{', '  "a": [1],', '  // example:web', '  "c": 3', '  // /example:web', '}'];
    expect(messages({ 'turbo.json': json.join('\n') })).toEqual([
      'removing example:web leaves a trailing comma',
    ]);
  });

  it('reports a trailing comma left by removing template-only blocks', () => {
    const json = [
      '[',
      '  1,',
      '  // example:template-only',
      '  2',
      '  // /example:template-only',
      ']',
    ];
    expect(messages({ 'tsconfig.base.json': json.join('\n') })).toEqual([
      'removing example:template-only leaves a trailing comma',
    ]);
  });
});

describe('check-examples.mjs run directly', () => {
  it('runs through a symlinked path', () => {
    const dir = mkdtempSync(join(tmpdir(), 'check-examples-'));
    try {
      const scripts = fileURLToPath(new URL('.', import.meta.url));
      // A junction on Windows needs no extra rights; other systems ignore the type.
      symlinkSync(scripts, join(dir, 'link'), 'junction');
      execFileSync('git', ['init', '-q'], { cwd: dir });
      writeFileSync(join(dir, 'README.md'), '<!-- example:web -->\n');
      execFileSync('git', ['add', 'README.md'], { cwd: dir });
      const run = spawnSync(process.execPath, [join(dir, 'link', 'check-examples.mjs')], {
        cwd: dir,
        encoding: 'utf8',
      });
      expect(run.stdout).toContain('README.md:1 example:web opened here is never closed');
      expect(run.status).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
