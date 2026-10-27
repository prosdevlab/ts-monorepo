import { spawnSync } from 'node:child_process';
import { accessSync, constants, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

// Runs the *built* command the way a user would. CI builds before testing; locally run `pnpm build` first.
const bin = fileURLToPath(new URL('../dist/cli.js', import.meta.url));

function cli(...args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' });
}

describe('built cli bin', () => {
  beforeAll(() => {
    if (!existsSync(bin))
      throw new Error(`${bin} is missing: run \`pnpm build\` before the tests.`);
  });

  it('starts with a node shebang and is executable', () => {
    expect(readFileSync(bin, 'utf8').startsWith('#!/usr/bin/env node\n')).toBe(true);
    expect(() => accessSync(bin, constants.X_OK)).not.toThrow();
  });

  it('prints output and exits 0', () => {
    const result = cli('greet', '--name', 'Ada');
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('Hello, Ada!\n');
  });

  it('reports errors on stderr with a non-zero exit code', () => {
    const result = cli('wave');
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Unknown command "wave".');
  });
});
