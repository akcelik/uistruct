/**
 * Dev-mode diagnostics for combinations a component accepts but cannot honour.
 *
 * Every message names what was ignored and what to do instead. Keyed: a
 * condition warns once per page load, not once per change detection.
 *
 * Production cost: none, PROVIDED each call site is guarded INLINE with
 *   if (typeof ngDevMode !== 'undefined' && ngDevMode) { … }
 * Production builds define `ngDevMode` as false, and the minifier then drops
 * the whole block — messages included. A helper function returning that same
 * expression would NOT be folded across the call, so the check and its
 * strings would ship; that is why no such helper exists here.
 */
const warned = new Set<string>();

export function strctDevWarn(key: string, message: string): void {
  if (typeof ngDevMode === 'undefined' || !ngDevMode || warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

/** Test hook: forget which warnings have fired. Not part of the public API. */
export function resetStrctDevWarnings(): void {
  warned.clear();
}
