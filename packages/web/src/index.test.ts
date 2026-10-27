import { describe, expect, it } from 'vitest';
import * as web from './index';

// Vitest runs in Node, where there is no DOM: importing must not touch one.
describe('web module', () => {
  it('imports without touching the DOM', () => {
    expect(globalThis.document).toBeUndefined();
    expect(web.createNotice).toBeTypeOf('function');
  });
});
