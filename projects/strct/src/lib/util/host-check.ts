import { strctDevWarn } from './dev-warn';

/**
 * Dev-mode diagnostics for attributes a component does not have.
 *
 * Writing a component the way a sibling component is written must not fail
 * silently: `<strct-alert variant="warning">` compiles, because a static
 * attribute is just an HTML attribute to Angular, renders the info-blue
 * default, and nobody finds out.
 *
 * Every call site must guard inline with `ngDevMode`, as `dev-warn` explains —
 * then production drops the calls, nothing references this module, and the
 * whole of it (messages included) is tree-shaken away.
 */

/**
 * The closed, small list of input names that exist on *other* strct
 * components. Only these are ever flagged, so ordinary HTML and ARIA
 * attributes, `class`, `style` and `data-*` are never touched.
 */
const BORROWED = [
  'variant',
  'size',
  'tone',
  'status',
  'type',
  'dense',
  'compact',
  'heading',
  'label',
] as const;

/**
 * Warn about a borrowed input name the component does not have.
 *
 * @param host      the component's own element
 * @param selector  what to call it in the message, e.g. `strct-alert`
 * @param owns      the component's inputs from that list: name → its values,
 *                  used to suggest the right one
 */
export function strctCheckHostInputs(
  host: HTMLElement,
  selector: string,
  owns: Record<string, string>,
): void {
  const ownNames = Object.keys(owns);
  for (const name of BORROWED) {
    if (!host.hasAttribute(name) || name in owns) continue;
    // Suggest the input that actually takes the value written, when there is
    // one — "variant=warning" on an alert means `type`, not `icon`.
    const written = host.getAttribute(name)?.trim() ?? '';
    const match =
      ownNames.find((n) =>
        owns[n]
          .split(',')
          .map((v) => v.trim())
          .includes(written),
      ) ?? (ownNames.length === 1 ? ownNames[0] : null);
    const hint = match
      ? ` — did you mean "${match}"? (values: ${owns[match]})`
      : ownNames.length
        ? ` — its inputs are: ${ownNames.map((n) => `"${n}"`).join(', ')}`
        : '';
    strctDevWarn(
      `host-input:${selector}:${name}`,
      `[strct] <${selector}> has no "${name}" input${hint}. ` +
        `The attribute was ignored, so the default rendered.`,
    );
  }
}

/**
 * Warn when a consumer's `display` overrides the one the component's layout
 * depends on — the usual way to give a custom element margins, and the usual
 * way to break a flex host.
 */
export function strctCheckHostDisplay(host: HTMLElement, selector: string, expected: string): void {
  const actual = getComputedStyle(host).display;
  if (actual === expected) return;
  strctDevWarn(
    `host-display:${selector}`,
    `[strct] <${selector}> needs display: ${expected}, but it computes to ${actual}. ` +
      `Wrap it, or set the margin on a wrapper, rather than changing its display.`,
  );
}
