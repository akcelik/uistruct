/**
 * Shared focus-lifecycle helpers for transient overlay surfaces (tooltip,
 * drawer, menus, popovers …): remember the trigger before opening, move
 * focus in on open, cycle Tab inside, and hand focus back on close.
 * Modeled on the modal's local implementation (`modal/modal.ts`).
 */

/** Elements considered tabbable inside an overlay, queried in DOM order. */
export const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Currently focused element, if it is an HTMLElement (remember the trigger before opening). */
export function saveFocusedElement(): HTMLElement | null {
  const active = document.activeElement;
  return active instanceof HTMLElement ? active : null;
}

/** Focus `el` again if it is still in the document; null-safe. */
export function restoreFocus(el: HTMLElement | null | undefined): void {
  if (el?.isConnected) el.focus();
}

/**
 * Focus the first tabbable descendant of `container`.
 * Returns whether something was focused; with nothing tabbable the container
 * itself is NOT focused — the caller decides the fallback.
 */
export function focusFirstIn(container: HTMLElement): boolean {
  const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  if (!first) return false;
  first.focus();
  return true;
}

/**
 * Tab trap for modal-ish overlays: cycle Tab/Shift+Tab within the
 * container's tabbable descendants, wrapping at both ends (preventDefault
 * when it wraps). Wire it to the container's `keydown.tab` /
 * `keydown.shift.tab` events.
 */
export function keepTabInside(event: KeyboardEvent, container: HTMLElement): void {
  const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  if (!items.length) {
    event.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = container.ownerDocument.activeElement;
  if (event.shiftKey && (active === first || !container.contains(active as Node | null))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
