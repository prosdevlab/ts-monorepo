import { describe, expect, it } from 'vitest';
import { HELP, type Io, run } from './index';

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { out: (l) => out.push(l), err: (l) => err.push(l) };
  return { io, out, err };
}

describe('run', () => {
  it('greets the given name', () => {
    const { io, out } = capture();
    expect(run(['greet', '--name', 'Ada'], io)).toBe(0);
    expect(out).toEqual(['Hello, Ada!']);
  });

  it('greets the world by default', () => {
    const { io, out } = capture();
    expect(run(['greet'], io)).toBe(0);
    expect(out).toEqual(['Hello, world!']);
  });

  it('prints the package version', () => {
    const { io, out } = capture();
    expect(run(['--version'], io)).toBe(0);
    expect(out[0]).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('prints help and exits 1 when no command is given', () => {
    const { io, out } = capture();
    expect(run([], io)).toBe(1);
    expect(out).toEqual([HELP]);
  });

  it('exits 2 with a hint for an unknown command', () => {
    const { io, err } = capture();
    expect(run(['wave'], io)).toBe(2);
    expect(err[0]).toBe('Unknown command "wave".');
  });

  it('exits 2 for an unknown option instead of throwing', () => {
    const { io, err } = capture();
    expect(run(['greet', '--shout'], io)).toBe(2);
    expect(err[1]).toContain('--help');
  });
});
