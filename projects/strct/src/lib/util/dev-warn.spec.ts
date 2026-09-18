import { resetStrctDevWarnings, strctDevWarn } from './dev-warn';

describe('strctDevWarn', () => {
  beforeEach(() => resetStrctDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('is live under test (ngDevMode), so the component diagnostics are exercised', () => {
    expect(typeof ngDevMode !== 'undefined' && !!ngDevMode).toBe(true);
  });

  it('warns once per key, not once per change detection', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    strctDevWarn('k', 'first');
    strctDevWarn('k', 'again');
    strctDevWarn('other', 'second');
    expect(warn.mock.calls.map((c) => c[0])).toEqual(['first', 'second']);
  });

  it('is silent when ngDevMode is off (production)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const g = globalThis as { ngDevMode?: unknown };
    const saved = g.ngDevMode;
    g.ngDevMode = false;
    try {
      strctDevWarn('prod', 'never');
    } finally {
      g.ngDevMode = saved;
    }
    expect(warn).not.toHaveBeenCalled();
  });
});
