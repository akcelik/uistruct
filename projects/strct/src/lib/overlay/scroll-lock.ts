/**
 * Refcounted body scroll-lock shared across any number of simultaneously
 * open transient surfaces (modal, drawer …): the first lock hides body
 * overflow, the last unlock restores whatever overflow was there before.
 * Extracted from `modal/modal.ts`.
 */
let scrollLockCount = 0;
let savedBodyOverflow = '';

/** Acquire a scroll lock: hides body overflow on the first acquisition. */
export function lockBodyScroll(doc: Document): void {
  if (scrollLockCount === 0) {
    savedBodyOverflow = doc.body.style.overflow;
    doc.body.style.overflow = 'hidden';
  }
  scrollLockCount++;
}

/** Release a scroll lock: restores the saved body overflow on the last release. */
export function unlockBodyScroll(doc: Document): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) doc.body.style.overflow = savedBodyOverflow;
}
