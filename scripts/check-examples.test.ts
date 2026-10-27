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
    expect(messages({ 'README.md': readme })).toContain('example:cli opens inside example:web');
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
});
