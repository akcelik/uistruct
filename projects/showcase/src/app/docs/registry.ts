import { Type } from '@angular/core';

/** One row in an API reference table. */
export interface ApiRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

/** A single documented component. */
export interface DocComponent {
  /** Route slug under /components and the demo `owner` id. */
  id: string;
  title: string;
  /** CSS selector(s) the component is used through. */
  selector: string;
  /** Symbols to import from the package. */
  importNames: string[];
  /** One-line summary (sidebar tooltip / search / cards). */
  summary: string;
  /** Intro paragraph shown under the page title. */
  lead: string;
  inputs?: ApiRow[];
  outputs?: ApiRow[];
  methods?: ApiRow[];
  /** Utility entries (pipes / functions) are documented but not counted as components. */
  utility?: boolean;
  /** Usage guidance. */
  do?: string[];
  dont?: string[];
  a11y?: string[];
}

/** A category groups components and knows how to lazy-load its live examples. */
export interface DocCategory {
  id: string;
  label: string;
  /** strct-icon name for the sidebar icon strip. */
  icon: string;
  /** Loads the page component that hosts the live examples for this category. */
  loadExamples: () => Promise<Type<unknown>>;
  components: DocComponent[];
}

const PKG = '@akcelik/strct';

export const PACKAGE_NAME = PKG;

const STATUS_VALUES = `'neutral' | 'accent' | 'success' | 'warning' | 'critical'`;
const CHART_STATUS = `'accent' | 'success' | 'warning' | 'critical'`;

/** Common row: the two-way value of a ControlValueAccessor control. */
const model = (type: string, desc: string): ApiRow => ({
  name: '[(ngModel)]',
  type,
  description: `${desc} Two-way bound via ControlValueAccessor (ngModel or a reactive formControl).`,
});
const disabledRow: ApiRow = {
  name: 'disabled',
  type: 'boolean',
  default: 'false',
  description: 'Disables interaction and dims the control.',
};
const cvaA11y =
  'Implements ControlValueAccessor, so it participates in form validation, dirty/touched state and disabled handling.';

export const DOCS: DocCategory[] = [
  {
    id: 'controls',
    label: 'Controls',
    icon: 'layers',
    loadExamples: () => import('../pages/controls.page').then((m) => m.ControlsPage),
    components: [
      {
        id: 'button',
        title: 'Button',
        selector: 'button[strct-button], a[strct-button]',
        importNames: ['StrctButton'],
        summary: 'Restrained, token-driven buttons in five variants and three sizes.',
        lead: 'Applies button styling to a native `<button>` or `<a>`, so it stays fully accessible and form-aware. Restrained by default — outlined / ghost surfaces with color carried by a subtle border and text accent, never a loud fill. Add `solid` for a rare filled call to action.',
        inputs: [
          {
            name: 'variant',
            type: `'primary' | 'critical' | 'outline' | 'flat' | 'neutral'`,
            default: `'neutral'`,
            description:
              'Emphasis level. Primary/critical tint the border and text; outline/flat are neutral.',
          },
          {
            name: 'size',
            type: `'md' | 'sm' | 'mini'`,
            default: `'md'`,
            description: 'Control height and padding.',
          },
          {
            name: 'solid',
            type: 'boolean',
            default: 'false',
            description:
              'Opt in to a filled surface. Use sparingly, for the single primary action.',
          },
          {
            name: 'block',
            type: 'boolean',
            default: 'false',
            description: 'Stretch to the full width of the container.',
          },
          {
            name: 'iconOnly',
            type: 'boolean',
            default: 'false',
            description: 'Square padding for a single-icon button. Pair with aria-label.',
          },
        ],
        do: [
          'Use exactly one primary (or solid) button per view to signal the main action.',
          'Give icon-only buttons an aria-label so they are announced.',
          'Reach for critical only on destructive actions.',
        ],
        dont: [
          'Avoid stacking several solid buttons side by side — emphasis is lost.',
          'Do not put long sentences inside a button; keep labels to 1–3 words.',
        ],
        a11y: [
          'Renders a real <button>/<a>, so keyboard focus, Enter/Space and form submission work natively.',
          'Disabled buttons drop to 45% opacity and set the disabled / aria-disabled state.',
        ],
      },
      {
        id: 'buttongroup',
        title: 'Button group',
        selector: 'strct-button-group',
        importNames: ['StrctButtonGroup', 'StrctButton'],
        summary: 'Joins adjacent buttons into a single segmented control.',
        lead: 'Segments a row of buttons into one joined control — useful for view switchers (Day / Week / Month) or icon toolbars. Project `strct-button` children; the group rounds the outer corners and collapses the shared borders.',
        do: [
          'Keep grouped buttons the same variant and size.',
          'Use for mutually related choices or a tight cluster of actions.',
        ],
        dont: ['Do not mix solid and outline buttons in one group.'],
        a11y: [
          'The host carries role="group"; label it with aria-label when the grouping is not obvious.',
        ],
      },
      {
        id: 'split-button',
        title: 'Split button',
        selector: 'strct-split-button',
        importNames: ['StrctSplitButton'],
        summary: 'Primary action + a chevron menu of variants.',
        lead: 'Fluent\u2019s split button: the main segment fires `(action)`; the chevron opens the variants (`StrctMenuItem[]` \u2014 icons, dividers, critical entries) and `(picked)` carries the chosen one. Use when one action dominates but variants exist \u2014 "Deploy \u25be Deploy with snapshot".',
        inputs: [
          { name: 'label', type: 'string', description: 'Main action label. Required.' },
          {
            name: 'items',
            type: 'StrctMenuItem[]',
            default: '[]',
            description: 'Variant entries (label, icon?, critical?, disabled?, divider?).',
          },
          {
            name: 'icon',
            type: 'string',
            default: `''`,
            description: 'Leading icon of the main segment.',
          },
          { name: 'solid', type: 'boolean', default: 'false', description: 'Filled accent look.' },
          {
            name: 'disabled',
            type: 'boolean',
            default: 'false',
            description: 'Disable both segments.',
          },
          {
            name: 'menuLabel',
            type: 'string',
            default: `'More actions'`,
            description: 'Accessible name of the chevron.',
          },
        ],
        outputs: [
          { name: 'action', type: 'void', description: 'The main segment was clicked.' },
          { name: 'picked', type: 'StrctMenuItem', description: 'A variant was chosen.' },
        ],
        do: ['Make the main segment the safe, most common variant.'],
        dont: ['Do not hide the only action behind the chevron \u2014 use a dropdown then.'],
        a11y: [
          'The chevron is a separately-focusable labeled button with aria-haspopup/expanded; menu semantics come from strct-dropdown.',
        ],
      },
      {
        id: 'speeddial',
        title: 'Speed dial',
        selector: 'strct-speed-dial',
        importNames: ['StrctSpeedDial'],
        summary: 'Floating action button that fans out to reveal actions.',
        lead: 'A floating action button that expands to reveal a set of actions in one of four directions. Project icon buttons (optionally with `strctTooltip`) as the actions. Closes on outside click or Escape.',
        inputs: [
          {
            name: 'icon',
            type: 'string',
            default: `'ellipsis'`,
            description: 'Glyph shown on the trigger; rotates 45° when open.',
          },
          {
            name: 'direction',
            type: `'up' | 'down' | 'left' | 'right'`,
            default: `'up'`,
            description: 'Direction the actions fan out.',
          },
        ],
        methods: [
          {
            name: 'toggle()',
            type: '() => void',
            description: 'Programmatically open or close the dial.',
          },
        ],
        do: [
          'Keep the action count small (2–5).',
          'Add a tooltip to each action so its purpose is clear.',
        ],
        dont: ['Do not hide critical primary actions behind a speed dial.'],
        a11y: ['The trigger exposes aria-haspopup="menu" and aria-expanded.'],
      },
      {
        id: 'badge',
        title: 'Badge',
        selector: 'strct-badge',
        importNames: ['StrctBadge'],
        summary: 'Small inline status pill with a distinctive left rail.',
        lead: 'A compact status pill. Outlined by default, with the color carried by the text and a thicker left rail that distinguishes badges from buttons at a glance. Add `solid` for a filled badge.',
        inputs: [
          {
            name: 'status',
            type: STATUS_VALUES,
            default: `'neutral'`,
            description: 'Semantic color.',
          },
          {
            name: 'solid',
            type: 'boolean',
            default: 'false',
            description: 'Filled style with uniform edges (no left rail).',
          },
        ],
        do: [
          'Use semantic status to mirror real state (success = healthy, critical = failed).',
          'Keep the label to a single short word.',
        ],
        dont: ['Do not use a badge as a button — it is not interactive.'],
      },
      {
        id: 'tag',
        title: 'Tag',
        selector: 'strct-tag',
        importNames: ['StrctTag'],
        summary: 'Compact, optionally removable chip.',
        lead: 'A compact label chip for categories, filters or applied facets. Add `removable` to show a dismiss button that emits `removed`.',
        inputs: [
          {
            name: 'status',
            type: STATUS_VALUES,
            default: `'neutral'`,
            description: 'Semantic color.',
          },
          {
            name: 'removable',
            type: 'boolean',
            default: 'false',
            description: 'Show a trailing remove button.',
          },
        ],
        outputs: [
          {
            name: 'removed',
            type: 'void',
            description: 'Fired when the remove button is clicked.',
          },
        ],
        do: ['Use for user-applied, removable labels.', 'Handle (removed) to update your model.'],
        dont: ['Do not use tags to convey one-off status — prefer a badge.'],
      },
      {
        id: 'copy',
        title: 'Copy',
        selector: 'strct-copy',
        importNames: ['StrctCopy'],
        summary: 'Click-to-copy with ✓ feedback.',
        lead: 'An icon (or icon + label) button that writes `text` to the clipboard and flips to a ✓ "Copied" state for a moment, announcing it politely to screen readers. The console workhorse for UUIDs, IPs, serials and snippets.',
        inputs: [
          {
            name: 'text',
            type: 'string',
            description: 'The text written to the clipboard. Required.',
          },
          {
            name: 'label',
            type: 'string',
            default: `''`,
            description: 'Optional visible label next to the icon (icon-only by default).',
          },
          {
            name: 'copyLabel / copiedLabel / ariaLabel',
            type: 'string',
            default: `'Copy' / 'Copied' / ''`,
            description: 'Localizable strings.',
          },
        ],
        outputs: [
          {
            name: 'copied',
            type: 'string',
            description: 'Emitted after a successful copy, with the copied text.',
          },
        ],
        do: ['Place it right beside the value it copies (mono IDs, IPs).'],
        dont: ['Do not use it for actions other than copying — that is a button.'],
        a11y: ['A labeled button; the state change is announced via a polite live region.'],
      },
      {
        id: 'avatar',
        title: 'Avatar',
        selector: 'strct-avatar',
        importNames: ['StrctAvatar'],
        summary: 'Circular image or initials with an optional status dot.',
        lead: 'Shows a circular image when `src` is set, otherwise derives initials from `name`. An optional status dot marks presence.',
        inputs: [
          {
            name: 'src',
            type: 'string',
            default: `''`,
            description: 'Image URL. Falls back to initials when empty.',
          },
          {
            name: 'name',
            type: 'string',
            default: `''`,
            description: 'Full name; used for initials and the title tooltip.',
          },
          {
            name: 'size',
            type: `'sm' | 'md' | 'lg'`,
            default: `'md'`,
            description: 'Avatar diameter.',
          },
          {
            name: 'status',
            type: `'none' | 'online' | 'busy' | 'offline'`,
            default: `'none'`,
            description: 'Presence dot.',
          },
        ],
        do: ['Always pass name, even with an image, for the alt text and tooltip.'],
        dont: ['Do not rely on the status dot alone to convey critical state.'],
      },
      {
        id: 'progress',
        title: 'Progress',
        selector: 'strct-progress',
        importNames: ['StrctProgress'],
        summary: 'Horizontal value / usage bar with semantic color.',
        lead: 'A horizontal value bar for completion or resource usage. The value is clamped to 0–100 and the fill takes a semantic color.',
        inputs: [
          {
            name: 'value',
            type: 'number',
            default: '0',
            description: 'Percentage 0–100 (clamped).',
          },
          { name: 'status', type: CHART_STATUS, default: `'accent'`, description: 'Fill color.' },
          {
            name: 'thresholds',
            type: '{ warning?: number; critical?: number } | null',
            default: 'null',
            description:
              'When set, the bar derives its status from the value: ≥ critical → critical, ≥ warning → warning, else the healthy base (success). Explicit status still wins when no thresholds are set.',
          },
        ],
        do: [
          'Pass thresholds instead of computing status for every meter.',
          'Switch to warning / critical as usage crosses your thresholds.',
        ],
        dont: ['Do not use a determinate bar for unknown-duration work — use the spinner.'],
        a11y: ['Exposes role="progressbar" with aria-valuenow / min / max.'],
      },
      {
        id: 'spinner',
        title: 'Spinner',
        selector: 'strct-spinner',
        importNames: ['StrctSpinner'],
        summary: 'Indeterminate loading ring in three sizes.',
        lead: 'An indeterminate loading ring for work of unknown duration. Honors prefers-reduced-motion by slowing the animation.',
        inputs: [
          {
            name: 'size',
            type: `'sm' | 'md' | 'lg'`,
            default: `'md'`,
            description: 'Ring diameter.',
          },
        ],
        do: ['Pair with a short label for screen readers when used as a page loader.'],
        dont: ['Do not use a spinner when you can show determinate progress.'],
        a11y: ['Carries role="progressbar" and aria-label="Loading".'],
      },
    ],
  },
  {
    id: 'forms',
    label: 'Forms',
    icon: 'form',
    loadExamples: () => import('../pages/forms.page').then((m) => m.FormsPage),
    components: [
      {
        id: 'field',
        title: 'Form field',
        selector: 'strct-field',
        importNames: ['StrctField'],
        summary: 'Label / required / hint / error wrapper.',
        lead: 'Wraps any form control with a label (and optional required marker), a hint and an error message. It auto-links the control via `aria-describedby` and toggles `aria-invalid`, so accessibility wiring is automatic.',
        inputs: [
          {
            name: 'label',
            type: 'string',
            default: `''`,
            description: 'Field label; rendered above the control.',
          },
          {
            name: 'required',
            type: 'boolean',
            default: 'false',
            description: 'Show a required asterisk.',
          },
          {
            name: 'hint',
            type: 'string',
            default: `''`,
            description: 'Helper text shown when there is no error.',
          },
          {
            name: 'error',
            type: 'string | string[] | null',
            default: 'null',
            description:
              'Error message (first of an array). Truthy puts the field in the invalid state.',
          },
          {
            name: 'validationState',
            type: `{ status: 'idle' | 'checking' | 'ok' | 'warning' | 'error'; message? } | null`,
            default: 'null',
            description:
              'Async-validation affordance: a trailing spinner/check/warning adornment plus its message in the hint/error slot (aria-live). An explicit error takes precedence.',
          },
        ],
        do: [
          'Wrap each form control in a field for consistent labels and messaging.',
          'Bind `error` to your validation state.',
        ],
        dont: ['Do not also set aria-describedby / aria-invalid by hand — the field manages them.'],
        a11y: [
          'Links the control to its hint/error via aria-describedby and sets aria-invalid when errored.',
        ],
      },
      {
        id: 'input',
        title: 'Input',
        selector: 'input[strctInput], textarea[strctInput], select[strctInput]',
        importNames: ['StrctInput'],
        summary: 'Shared field style for native inputs.',
        lead: 'A directive that applies the shared control style to native input, textarea and select elements — no wrapper component, full native behaviour and form integration. It has no inputs of its own; use the native element’s attributes and `ngModel` / `formControl`.',
        do: [
          'Pair every field with a <label> (or aria-label).',
          'Use native attributes (type, placeholder, required) as usual.',
        ],
        dont: ['Do not wrap it in a custom component just to restyle — the directive is enough.'],
        a11y: [
          'Keeps the native element, so labels, validation and keyboard behaviour are unchanged.',
        ],
      },
      {
        id: 'textarea',
        title: 'Textarea',
        selector: 'textarea[strctInput]',
        importNames: ['StrctInput'],
        summary: 'Multi-line, vertically resizable text field.',
        lead: 'The same `strctInput` directive on a `<textarea>`, vertically resizable. Set `rows` natively.',
        do: ['Set a sensible rows value for the expected content length.'],
        dont: ['Do not disable resizing unless the layout truly requires it.'],
      },
      {
        id: 'select',
        title: 'Select',
        selector: 'select[strctInput]',
        importNames: ['StrctInput'],
        summary: 'Native select with a custom chevron.',
        lead: 'A native `<select>` styled with `strctInput` and a custom chevron, keeping native keyboard and accessibility behaviour.',
        do: ['Use for short, mutually exclusive option lists.'],
        dont: ['Do not use for searchable or large lists — reach for the combobox.'],
      },
      {
        id: 'checkbox',
        title: 'Checkbox',
        selector: 'strct-checkbox',
        importNames: ['StrctCheckbox'],
        summary: 'Custom checkbox with form binding.',
        lead: 'A custom-drawn checkbox that is ControlValueAccessor-compatible, so it works with ngModel and reactive forms. Project the label as content.',
        inputs: [model('boolean', 'Checked state.'), disabledRow],
        do: ['Use for independent on/off options.'],
        dont: ['Do not use a single checkbox where a toggle reads better (e.g. settings).'],
        a11y: [cvaA11y, 'Space toggles the box; the projected label is clickable.'],
      },
      {
        id: 'toggle',
        title: 'Toggle',
        selector: 'strct-toggle',
        importNames: ['StrctToggle'],
        summary: 'On / off switch.',
        lead: 'A binary on/off switch, ControlValueAccessor-compatible. Best for immediately-applied settings.',
        inputs: [model('boolean', 'On/off state.'), disabledRow],
        do: ['Use for settings that take effect immediately.'],
        dont: ['Do not use a toggle inside a form that needs an explicit Save — use a checkbox.'],
        a11y: [cvaA11y],
      },
      {
        id: 'radio',
        title: 'Radio group',
        selector: 'strct-radio-group, strct-radio',
        importNames: ['StrctRadioGroup', 'StrctRadio'],
        summary: 'Single choice from a set.',
        lead: 'A radio group for a single choice from a small set. Bind the group with ngModel; each `strct-radio` carries its own `value`.',
        inputs: [
          model('unknown', 'Selected value (set on `strct-radio-group`).'),
          {
            name: 'value',
            type: 'unknown',
            description: 'On `strct-radio`: the value contributed when selected. Required.',
          },
          disabledRow,
        ],
        do: ['Use for 2–5 mutually exclusive options that should all be visible.'],
        dont: ['Do not use radios for many options — use a select or combobox.'],
        a11y: [cvaA11y, 'Arrow keys move between options within the group.'],
      },
      {
        id: 'segmented',
        title: 'Segmented',
        selector: 'strct-segmented',
        importNames: ['StrctSegmented', 'StrctSegmentedOption'],
        summary: 'One-of-N as a joined segmented control.',
        lead: 'A single-select segmented control with managed selected state — distinct from `StrctTabs` (panel switching) and a button group (visual cluster only). Reach for it for mode pickers and list filters. CVA-compatible.',
        inputs: [
          {
            name: 'options',
            type: 'StrctSegmentedOption[]',
            default: '[]',
            description: '`{ value; label; icon?; disabled? }[]`.',
          },
          model('unknown', 'Selected segment value.'),
          {
            name: 'size',
            type: `'sm' | 'md'`,
            default: `'md'`,
            description: 'Segment size.',
          },
          {
            name: 'block',
            type: 'boolean',
            default: 'false',
            description: 'Stretch to the full width of the container.',
          },
          disabledRow,
        ],
        do: [
          'Use for 2–4 short, mutually exclusive choices that fit on one line.',
          'Reach for it for mode pickers and list filters.',
        ],
        dont: ['Do not use it to switch page panels — that is what tabs are for.'],
        a11y: [cvaA11y, 'role="radiogroup" with roving tabindex; arrow keys move the selection.'],
      },
      {
        id: 'range',
        title: 'Slider',
        selector: 'strct-range',
        importNames: ['StrctRange'],
        summary: 'Range input with a filled track.',
        lead: 'A range slider with a filled track and an optional live value readout. ControlValueAccessor-compatible.',
        inputs: [
          model('number', 'Current value.'),
          { name: 'min', type: 'number', default: '0', description: 'Lower bound.' },
          { name: 'max', type: 'number', default: '100', description: 'Upper bound.' },
          { name: 'step', type: 'number', default: '1', description: 'Increment.' },
          {
            name: 'showValue',
            type: 'boolean',
            default: 'false',
            description: 'Render the current value beside the track.',
          },
          disabledRow,
        ],
        do: ['Use for approximate, continuous values where exactness is not critical.'],
        dont: ['Do not use a slider when a precise number entry is expected.'],
        a11y: [cvaA11y, 'Arrow keys adjust by step; built on a native range input.'],
      },
      {
        id: 'combobox',
        title: 'Combobox',
        selector: 'strct-combobox',
        importNames: ['StrctCombobox', 'StrctOption'],
        summary: 'Type to filter, click to select.',
        lead: 'A filterable single-select: type to narrow the list, click or press Enter to choose. ControlValueAccessor-compatible.',
        inputs: [
          model('unknown', 'Selected option value.'),
          {
            name: 'options',
            type: 'StrctOption[]',
            default: '[]',
            description: 'Items to choose from. `StrctOption = { value: unknown; label: string }`.',
          },
          { name: 'placeholder', type: 'string', default: `''`, description: 'Empty-state hint.' },
        ],
        do: ['Use for medium-to-large option lists where typing speeds selection.'],
        dont: ['Do not use for a handful of options — a select is simpler.'],
        a11y: [
          cvaA11y,
          'Full keyboard support: ↑/↓ move, Enter selects, Esc closes, with aria-activedescendant.',
        ],
      },
      {
        id: 'datepicker',
        title: 'Date picker',
        selector: 'strct-datepicker',
        importNames: ['StrctDatepicker'],
        summary: 'Calendar popover; ISO date value.',
        lead: 'A calendar popover whose value is an ISO date string (`YYYY-MM-DD`). ControlValueAccessor-compatible.',
        inputs: [
          model('string', 'Selected date as an ISO string.'),
          {
            name: 'placeholder',
            type: 'string',
            default: `'Select a date'`,
            description: 'Empty-state hint.',
          },
        ],
        do: ['Use ISO strings end-to-end to avoid timezone surprises.'],
        dont: ['Do not use for free-form approximate dates — use a text input.'],
        a11y: [cvaA11y, 'Calendar is keyboard navigable (arrows / PageUp-Down / Enter).'],
      },
      {
        id: 'password',
        title: 'Password',
        selector: 'strct-password',
        importNames: ['StrctPassword'],
        summary: 'Reveal toggle and optional strength meter.',
        lead: 'A password field with a show/hide toggle and an optional strength meter. ControlValueAccessor-compatible.',
        inputs: [
          model('string', 'Password value.'),
          { name: 'placeholder', type: 'string', default: `''`, description: 'Empty-state hint.' },
          {
            name: 'meter',
            type: 'boolean',
            default: 'false',
            description: 'Show a strength meter under the field.',
          },
          disabledRow,
        ],
        do: ['Enable the meter on sign-up / change-password flows.'],
        dont: ['Do not block paste — it harms password-manager users.'],
        a11y: [cvaA11y, 'The reveal toggle is a labelled button.'],
      },
      {
        id: 'file',
        title: 'File upload',
        selector: 'strct-file',
        importNames: ['StrctFile'],
        summary: 'Drag-and-drop or browse; File[] value.',
        lead: 'A drag-and-drop or browse file field whose value is a `File[]`. ControlValueAccessor-compatible.',
        inputs: [
          model('File[]', 'Selected files.'),
          {
            name: 'multiple',
            type: 'boolean',
            default: 'false',
            description: 'Allow selecting more than one file.',
          },
          {
            name: 'accept',
            type: 'string',
            default: `''`,
            description: 'Native accept filter (e.g. "image/*").',
          },
          disabledRow,
        ],
        do: ['Set accept to guide users to valid file types.'],
        dont: ['Do not rely on accept for security — validate on the server too.'],
        a11y: [cvaA11y, 'The drop zone is also a clickable, focusable browse target.'],
      },
      {
        id: 'colorpicker',
        title: 'Color picker',
        selector: 'strct-color-picker',
        importNames: ['StrctColorPicker'],
        summary: 'Preset swatches plus a hex field.',
        lead: 'A color picker with preset swatches and a hex input; value is a `#rrggbb` string. ControlValueAccessor-compatible.',
        inputs: [
          model('string', 'Selected color as #rrggbb.'),
          {
            name: 'swatches',
            type: 'string[]',
            default: 'DEFAULT_SWATCHES',
            description: 'Preset colors offered above the hex field.',
          },
        ],
        do: ['Provide a brand-aligned swatches list for quick picks.'],
        dont: [
          'Do not use for picking from a continuous spectrum where a native input fits better.',
        ],
        a11y: [cvaA11y],
      },
      {
        id: 'cascade',
        title: 'Cascade select',
        selector: 'strct-cascade-select',
        importNames: ['StrctCascadeSelect', 'StrctCascadeOption'],
        summary: 'Pick a leaf from nested groups.',
        lead: 'Selects a leaf value from nested groups — e.g. a port group under a virtual switch. ControlValueAccessor-compatible.',
        inputs: [
          model('unknown', 'Selected leaf value.'),
          {
            name: 'options',
            type: 'StrctCascadeOption[]',
            default: '[]',
            description: 'Tree of `{ label; value?; children? }` nodes.',
          },
          {
            name: 'placeholder',
            type: 'string',
            default: `'Select…'`,
            description: 'Empty-state hint.',
          },
        ],
        do: ['Use when options have a natural one-to-two-level hierarchy.'],
        dont: ['Do not nest more than a couple of levels — it gets hard to scan.'],
        a11y: [cvaA11y],
      },
      {
        id: 'rating',
        title: 'Rating',
        selector: 'strct-rating',
        importNames: ['StrctRating'],
        summary: 'Star rating with clear-on-repeat.',
        lead: 'A star rating control; click the active star again to clear. ControlValueAccessor-compatible.',
        inputs: [
          model('number', 'Number of selected stars.'),
          { name: 'max', type: 'number', default: '5', description: 'Total number of stars.' },
          { name: 'size', type: 'number', default: '18', description: 'Star size in pixels.' },
          {
            name: 'readonly',
            type: 'boolean',
            default: 'false',
            description: 'Display-only mode.',
          },
        ],
        do: ['Use readonly to display an aggregate score.'],
        dont: ['Do not use stars for non-subjective data — prefer a number.'],
        a11y: [cvaA11y, 'Keyboard adjustable; stars are focusable.'],
      },
      {
        id: 'transfer',
        title: 'Transfer',
        selector: 'strct-transfer',
        importNames: ['StrctTransfer', 'StrctTransferItem'],
        summary: 'Dual-list picklist \u2014 assign items to a set.',
        lead: '"Assign hosts to the cluster": available items on the left, the chosen set on the right, checkbox multi-select and move buttons between, a searchbox per side. `items` stays the single source-of-truth list; `assigned` is the two-way id set.',
        inputs: [
          {
            name: 'items',
            type: 'StrctTransferItem[]',
            description: '`{ id; label; icon?; disabled?; data? }[]`. Required.',
          },
          {
            name: 'assigned',
            type: 'string[]',
            default: '[]',
            description: 'Assigned ids, two-way (`[(assigned)]`).',
          },
          {
            name: 'sourceLabel / targetLabel / searchPlaceholder / emptyLabel / assignLabel / unassignLabel',
            type: 'string',
            description: 'Localizable strings.',
          },
        ],
        outputs: [
          {
            name: 'moved',
            type: `{ direction: 'assign' | 'unassign'; ids: string[] }`,
            description: 'A move happened.',
          },
        ],
        do: ['Use for membership editing with more items than a multi-select handles well.'],
        dont: ['Do not use it for a handful of options \u2014 checkboxes are simpler.'],
        a11y: [
          'Both lists are labeled listboxes; every checkbox carries the item label; move buttons are labeled and disabled until a selection exists.',
        ],
      },
      {
        id: 'chips',
        title: 'Chips',
        selector: 'strct-chips',
        importNames: ['StrctChips'],
        summary: 'Free-text tags; string[] value.',
        lead: 'Free-text tag entry: type and press Enter to add, Backspace to remove the last. Value is a `string[]`. ControlValueAccessor-compatible.',
        inputs: [
          model('string[]', 'Current tags.'),
          { name: 'placeholder', type: 'string', default: `''`, description: 'Empty-state hint.' },
          {
            name: 'allowDuplicates',
            type: 'boolean',
            default: 'false',
            description: 'Permit repeated tag values.',
          },
        ],
        do: ['Use for open-ended labels like tags or recipients.'],
        dont: ['Do not use when values must come from a fixed list — use a multi-select.'],
        a11y: [cvaA11y, 'Backspace removes the last chip; each chip has a remove control.'],
      },
      {
        id: 'otp',
        title: 'Input OTP',
        selector: 'strct-input-otp',
        importNames: ['StrctInputOtp'],
        summary: 'One-time-password boxes.',
        lead: 'Segmented one-time-password boxes with auto-advance, backspace and paste support. Value is the concatenated string. ControlValueAccessor-compatible.',
        inputs: [
          {
            name: 'autofocus',
            type: 'boolean',
            default: 'false',
            description:
              'Focus box 0 on first render — the "second-factor step just appeared" case.',
          },
          {
            name: 'groupSize',
            type: 'number',
            default: '0',
            description:
              'Insert a separator every N boxes (3 ⇒ "nnn – nnn"), mirroring authenticator apps. 0 disables.',
          },
          model('string', 'Entered code.'),
          { name: 'length', type: 'number', default: '6', description: 'Number of boxes.' },
          {
            name: 'masked',
            type: 'boolean',
            default: 'false',
            description: 'Obscure entered characters.',
          },
        ],
        methods: [
          {
            name: 'focus(index = 0)',
            type: 'void',
            description:
              'Move the caret programmatically — e.g. back to box 0 after a rejected code.',
          },
        ],
        do: ['Match length to the code your backend issues.', 'Allow pasting a full code.'],
        dont: ['Do not use for secrets longer than a short code — use a password field.'],
        a11y: [cvaA11y, 'Backspace moves to the previous box; paste fills all boxes.'],
      },
      {
        id: 'knob',
        title: 'Knob',
        selector: 'strct-knob',
        importNames: ['StrctKnob'],
        summary: 'Rotary dial — drag, keys or scroll.',
        lead: 'A rotary dial adjustable by drag, arrow keys or scroll. ControlValueAccessor-compatible.',
        inputs: [
          model('number', 'Current value.'),
          { name: 'min', type: 'number', default: '0', description: 'Lower bound.' },
          { name: 'max', type: 'number', default: '100', description: 'Upper bound.' },
          { name: 'step', type: 'number', default: '1', description: 'Increment.' },
          { name: 'size', type: 'number', default: '96', description: 'Diameter in pixels.' },
          { name: 'thickness', type: 'number', default: '9', description: 'Arc stroke width.' },
          { name: 'status', type: CHART_STATUS, default: `'accent'`, description: 'Arc color.' },
          { name: 'label', type: 'string', default: `''`, description: 'Caption under the value.' },
        ],
        do: ['Use for a compact, glanceable single value (fan %, temperature).'],
        dont: ['Do not use a knob where exact entry matters more than the visual.'],
        a11y: [cvaA11y, 'Arrow keys adjust by step when focused.'],
      },
      {
        id: 'inputmask',
        title: 'Input mask',
        selector: 'strct-input-mask',
        importNames: ['StrctInputMask'],
        summary: 'Formatted entry with mask tokens.',
        lead: 'Formatted text entry. Mask tokens: `9` = digit, `A` = letter, `*` = alphanumeric, `H` = hex; everything else is a literal. ControlValueAccessor-compatible.',
        inputs: [
          model('string', 'Raw or formatted value.'),
          {
            name: 'mask',
            type: 'string',
            description: 'Mask pattern. Required, e.g. "(999) 999 99 99".',
          },
          { name: 'placeholder', type: 'string', default: `''`, description: 'Empty-state hint.' },
          {
            name: 'uppercase',
            type: 'boolean',
            default: 'false',
            description: 'Force entered letters to uppercase (e.g. MAC / WWPN).',
          },
        ],
        do: ['Use for fixed-format fields: phone, IDs, MAC / WWPN, cards.'],
        dont: ['Do not use a mask for variable-length free text.'],
        a11y: [cvaA11y],
      },
    ],
  },
  {
    id: 'surfaces',
    label: 'Surfaces',
    icon: 'sidebar',
    loadExamples: () => import('../pages/surfaces.page').then((m) => m.SurfacesPage),
    components: [
      {
        id: 'page-header',
        title: 'Page header',
        selector: 'strct-page-header',
        importNames: ['StrctPageHeader', 'StrctPageHeaderCrumbs', 'StrctPageHeaderActions'],
        summary: 'Console page top: crumbs, title, actions.',
        lead: 'The top of every console object page: an optional breadcrumb row (`strctPageHeaderCrumbs`), an h1 `title` + `subtitle`, actions aligned to the end (`strctPageHeaderActions`) and default content projected below (status badges, meta strips). The doc pages themselves run on it.',
        inputs: [
          { name: 'title', type: 'string', description: 'Page title (an h1). Required.' },
          {
            name: 'subtitle',
            type: 'string',
            default: `''`,
            description: 'One-line description under the title.',
          },
          {
            name: 'divider',
            type: 'boolean',
            default: 'false',
            description: 'Hairline divider under the header.',
          },
        ],
        do: ['Keep actions to the two or three that matter; overflow the rest into a menu.'],
        dont: ['Do not nest another h1 inside the projected content.'],
        a11y: ['Renders the title as the page h1; actions are real buttons in source order.'],
      },
      {
        id: 'card',
        title: 'Card',
        selector: 'strct-card',
        importNames: ['StrctCard', 'StrctCardHeader', 'StrctCardBlock', 'StrctCardFooter'],
        summary: 'Rich surface container: status rail, selection, loading, collapse.',
        lead: 'A surface container composed from `strct-card-header`, `strct-card-block` and an optional `strct-card-footer`. Beyond plain composition it now carries rich, opt-in states: a `status` tone rail (same language as alert/hero), `interactive` hover lift for clickable cards, a `selected` ring for pickers, `dense` paddings, a `loading` bar with `aria-busy`, and `collapsible` with a two-way `collapsed` model — the header grows a chevron toggle.',
        inputs: [
          {
            name: 'status',
            type: STATUS_VALUES,
            default: `'neutral'`,
            description: 'Tone rail on the leading edge.',
          },
          {
            name: 'interactive',
            type: 'boolean',
            default: 'false',
            description: 'Hover lift + accent border for clickable cards (style-only affordance).',
          },
          {
            name: 'selected',
            type: 'boolean',
            default: 'false',
            description: 'Accent ring — card-picker layouts.',
          },
          {
            name: 'dense',
            type: 'boolean',
            default: 'false',
            description: 'Tighter paddings across header/block/footer.',
          },
          {
            name: 'loading',
            type: 'boolean',
            default: 'false',
            description: 'Indeterminate top bar + aria-busy; body/footer dim and ignore input.',
          },
          {
            name: 'collapsible / collapsed',
            type: 'boolean / boolean',
            default: 'false / false',
            description: 'Header gains a chevron toggle; `[(collapsed)]` hides block + footer.',
          },
          {
            name: 'icon',
            type: 'string',
            description: 'On `strct-card-header`: optional leading icon.',
          },
        ],
        do: [
          'Compose only the pieces you need; all are optional except the card itself.',
          'Use status + collapsible for scan-then-drill dashboards.',
        ],
        dont: ['Do not nest cards deeply — flatten the hierarchy instead.'],
        a11y: [
          'The collapse chevron is a labeled button with aria-expanded; loading sets aria-busy; motion honours prefers-reduced-motion.',
        ],
      },
      {
        id: 'accordion',
        title: 'Accordion',
        selector: 'strct-accordion',
        importNames: ['StrctAccordion', 'StrctAccordionPanel'],
        summary: 'Independently collapsible panels.',
        lead: 'A stack of independently collapsible panels. Each `strct-accordion-panel` manages its own expanded state.',
        inputs: [
          {
            name: 'heading',
            type: 'string',
            description: 'On `strct-accordion-panel`: the panel title. Required.',
          },
          {
            name: 'expanded',
            type: 'boolean',
            default: 'false',
            description: 'On `strct-accordion-panel`: two-way open state (`[(expanded)]`).',
          },
        ],
        do: ['Use for optional or secondary detail that benefits from progressive disclosure.'],
        dont: ['Do not hide critical, always-needed information inside a collapsed panel.'],
        a11y: ['The chevron rotates with state; the header is a focusable toggle.'],
      },
      {
        id: 'tabs',
        title: 'Tabs',
        selector: 'strct-tabs',
        importNames: ['StrctTabs', 'StrctTab'],
        summary: 'Tabbed content from projected children.',
        lead: 'A tab group built from projected `strct-tab` children. Each tab carries a `label` and may be disabled.',
        inputs: [
          {
            name: 'label',
            type: 'string',
            description: 'On `strct-tab`: the tab title. Required.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            default: 'false',
            description: 'On `strct-tab`: disable selection.',
          },
        ],
        do: ['Use for peer views of the same object (Summary / Activity / Settings).'],
        dont: ['Do not use tabs for a sequential flow — use a wizard.'],
        a11y: ['ARIA tablist with arrow / Home / End navigation and roving tabindex.'],
      },
      {
        id: 'tree',
        title: 'Tree',
        selector: 'strct-tree',
        importNames: ['StrctTree', 'StrctTreeNode', 'StrctTreeNodeData', 'StrctTreeNodeMenuFn'],
        summary: 'Nested, expandable nodes with icons.',
        lead: 'Nested, expandable nodes with optional icons, status badges and active state. Compose `strct-tree-node` manually, or pass `[nodes]` for a fully data-driven, self-recursing tree of any depth. Add `[nodeMenu]` for a per-node right-click menu.',
        inputs: [
          {
            name: 'nodes',
            type: 'StrctTreeNodeData[]',
            default: 'null',
            description:
              'On `strct-tree`: data-driven node list (`{ id?; label; icon?; badge?; active?; expanded?; children?; data? }`). When set, projected content is ignored and the tree recurses itself. An `id` gives each node a stable key (trackBy + expansion state + a `data-node-id` attribute); it falls back to `label`.',
          },
          {
            name: 'nodeMenu',
            type: '(node) => StrctMenuItem[]',
            default: 'null',
            description:
              'On `strct-tree`: resolver that returns the right-click menu items for a given node. The tree wires a `[strctContextMenu]` trigger on every node row; nodes whose result is empty open no menu.',
          },
          {
            name: 'expandedIds',
            type: 'string[] | null',
            default: 'null',
            description:
              'On `strct-tree`: controlled expansion (two-way, `[(expandedIds)]`). When non-null it is the single source of truth — node open state derives from it and toggles write back — so save/restore is a one-liner. When null, expansion is uncontrolled (seeded from each node’s `expanded` flag).',
          },
          {
            name: 'density',
            type: `'compact' | 'comfortable'`,
            default: `'compact'`,
            description:
              'On `strct-tree`: row density. `compact` is the dense inventory layout (13px text / 16px icons); `comfortable` relaxes to 14px text / 18px icons with taller rows — for touch-friendly or low-density consoles.',
          },
          {
            name: 'label',
            type: 'string',
            default: `''`,
            description: 'On `strct-tree-node`: node text (content mode).',
          },
          {
            name: 'icon',
            type: 'string | undefined',
            default: 'undefined',
            description: 'On `strct-tree-node`: optional leading icon.',
          },
          {
            name: 'badge',
            type: 'StrctIconBadge',
            default: `'none'`,
            description:
              'On `strct-tree-node`: status badge on the icon, color-blind safe in two families. Lifecycle (vCenter media language): green disc ▶ running · amber disc ⏸ paused · grey disc ■ off. Health (silhouette-coded): circle ✓ success · triangle ! warning · diamond × critical · circle i info · wrench maintenance.',
          },
          {
            name: 'active',
            type: 'boolean',
            default: 'false',
            description: 'On `strct-tree-node`: highlight as selected.',
          },
          {
            name: 'expanded',
            type: 'boolean',
            default: 'false',
            description: 'On `strct-tree-node`: two-way open state (`[(expanded)]`).',
          },
        ],
        outputs: [
          {
            name: 'nodeActivated',
            type: 'StrctTreeNodeData',
            description: 'On `strct-tree`: fired when any data-driven node is clicked.',
          },
          {
            name: 'expandedChange',
            type: 'string[]',
            description:
              'On `strct-tree`: the full set of expanded node ids, emitted on every expand / collapse.',
          },
          {
            name: 'nodeToggled',
            type: '{ node; expanded }',
            description: 'On `strct-tree`: fired per toggle with the node and its new open state.',
          },
          {
            name: 'nodeMenuSelect',
            type: 'StrctTreeMenuEvent',
            description:
              "On `strct-tree`: fired with `{ node, item }` when a node's right-click menu item is chosen.",
          },
          {
            name: 'activated',
            type: 'void',
            description: 'On `strct-tree-node`: fired when a content-mode node is clicked.',
          },
        ],
        do: [
          'Use `[nodes]` for dynamic / deep inventory trees.',
          'Give nodes a stable `id` and use `[(expandedIds)]` to persist / restore expansion.',
          'Use node `badge` to show object state on the node.',
          'Use `[nodeMenu]` for per-object right-click actions.',
        ],
        dont: ['Do not use a tree for flat lists.'],
      },
      {
        id: 'modal',
        title: 'Modal',
        selector: 'strct-modal',
        importNames: ['StrctModal'],
        summary: 'Overlay dialog with focus trap.',
        lead: 'An overlay dialog with two-way `open` and a focus trap that restores focus on close. By default it closes only via its X or an action button — a click outside (or Escape) does not dismiss it; opt in with `dismissible`. Project the footer through `strctModalFooter`.',
        inputs: [
          {
            name: 'open',
            type: 'boolean',
            default: 'false',
            description: 'Two-way open state (`[(open)]`).',
          },
          {
            name: 'query',
            type: 'string',
            default: `''`,
            description:
              'Typed text, two-way (`[(query)]`) — observe it to serve results from an API. Resets on open.',
          },
          {
            name: 'filter',
            type: 'boolean',
            default: 'true',
            description:
              'Internal ranked filtering. `false` = "render `items` in the order given, I already filtered them".',
          },
          {
            name: 'loading / loadingText',
            type: 'boolean / string',
            default: `false / 'Searching…'`,
            description: 'Politely-announced "searching" row while server results are in flight.',
          },
          {
            name: 'title',
            type: 'string',
            default: `''`,
            description: 'Header title (also the aria-labelledby target).',
          },
          {
            name: 'size',
            type: `'sm' | 'md' | 'lg' | 'xl'`,
            default: `'sm'`,
            description: 'Fixed dialog width: sm 480 · md 640 · lg 860 · xl 1080 (px).',
          },
          {
            name: 'hideFooter',
            type: 'boolean',
            default: 'false',
            description: 'Hide the footer region.',
          },
          {
            name: 'dismissible',
            type: 'boolean',
            default: 'false',
            description:
              'Allow closing via a backdrop click / Escape. Off by default, so a modal closes only via its X or an action button.',
          },
          {
            name: 'draggable',
            type: 'boolean',
            default: 'false',
            description:
              'Reposition the dialog by dragging its header (mouse + touch). Clamped to the viewport, never starts from the close button, and every open re-centers. Keyboard/AT flows are unaffected.',
          },
          {
            name: 'panelClass',
            type: 'string',
            default: `''`,
            description:
              'Extra class(es) appended to the dialog panel — style custom looks from app-global CSS instead of piercing internal class names with `::ng-deep`.',
          },
          {
            name: 'backdropClass',
            type: 'string',
            default: `''`,
            description: 'Extra class(es) appended to the backdrop / overlay.',
          },
          {
            name: 'variant',
            type: `'solid' | 'glass'`,
            default: `'solid'`,
            description:
              'Built-in look. `glass` is a theme-aware frosted preset: translucent panel + blurred backdrop. `panelClass` / `backdropClass` remain the escape hatch for full control.',
          },
        ],
        outputs: [{ name: 'closed', type: 'void', description: 'Fired when the dialog closes.' }],
        methods: [
          {
            name: 'close()',
            type: '() => void',
            description: 'Close the dialog programmatically.',
          },
        ],
        do: ['Reserve modals for focused, must-answer interactions.', 'Give the dialog a title.'],
        dont: ['Do not stack modals on top of each other.'],
        a11y: [
          'role="dialog", aria-modal, aria-labelledby; focus is trapped and restored on close; Escape closes when dismissible.',
        ],
      },
      {
        id: 'drawer',
        title: 'Drawer',
        selector: 'strct-drawer',
        importNames: ['StrctDrawer', 'StrctDrawerFooter'],
        summary: 'Edge-anchored slide-out panel.',
        lead: 'A slide-out overlay panel anchored to an edge of the viewport — ideal for inspecting or editing a record without losing the underlying table’s scroll position or selection. Project a footer with `strctDrawerFooter`.',
        inputs: [
          {
            name: 'open',
            type: 'boolean',
            default: 'false',
            description: 'Open state, two-way (`[(open)]`).',
          },
          {
            name: 'side',
            type: `'start' | 'end' | 'top' | 'bottom'`,
            default: `'end'`,
            description: 'Edge the panel slides in from.',
          },
          {
            name: 'size',
            type: `'sm' | 'md' | 'lg'`,
            default: `'md'`,
            description: 'Extent along the sliding axis.',
          },
          { name: 'title', type: 'string', default: `''`, description: 'Header title.' },
          {
            name: 'dismissable',
            type: 'boolean',
            default: 'true',
            description: 'Show the close button and allow backdrop / Esc dismissal.',
          },
        ],
        methods: [
          {
            name: 'close()',
            type: '() => void',
            description: 'Close the drawer programmatically.',
          },
        ],
        do: [
          'Use a drawer for contextual detail / edit panels beside a list or grid.',
          'Anchor to `end` for inspectors; `bottom` for transient consoles.',
        ],
        dont: ['Do not use a drawer for a focused, must-answer decision — use a modal.'],
        a11y: [
          'role="dialog", aria-modal, aria-label from the title; backdrop and Escape close it when dismissable.',
        ],
      },
      {
        id: 'dropdown',
        title: 'Dropdown',
        selector: 'strct-dropdown',
        importNames: ['StrctDropdown', 'StrctDropdownItem'],
        summary: 'Click-to-open menu.',
        lead: 'A click-to-open menu that closes on outside click. Mark the trigger with `strctDropdownTrigger`; project `strct-dropdown-item` entries (which can be `critical` or `disabled`). With `popover` the panel holds form controls instead of menu items: inner clicks never close it (only outside click / Escape do) and it announces as a labeled `role="dialog"` — the filter/settings-panel pattern without hand-rolling `strctOverlay`.',
        inputs: [
          {
            name: 'align',
            type: `'start' | 'end'`,
            default: `'start'`,
            description: 'Which edge the menu aligns to.',
          },
          {
            name: 'popover',
            type: 'boolean',
            default: 'false',
            description:
              'Panel-of-form-controls mode: inner clicks do not close; semantics switch from menu to dialog.',
          },
          {
            name: 'popoverLabel',
            type: 'string',
            default: `'Filters'`,
            description: 'Accessible name of the popover dialog (localizable).',
          },
          {
            name: 'critical',
            type: 'boolean',
            default: 'false',
            description: 'On `strct-dropdown-item`: destructive styling.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            default: 'false',
            description: 'On `strct-dropdown-item`: disable the entry.',
          },
        ],
        do: ['Use for a short list of actions tied to a trigger.'],
        dont: ['Do not use a dropdown for primary navigation.'],
        a11y: [
          'Closes on outside click and Escape; the menu escapes overflow clipping.',
          'The trigger exposes aria-haspopup (menu/dialog) + aria-expanded; popover panels are labeled dialogs.',
        ],
      },
      {
        id: 'splitter',
        title: 'Splitter',
        selector: 'strct-splitter',
        importNames: ['StrctSplitter'],
        summary: 'Two resizable panes with a draggable gutter.',
        lead: 'Master/detail layouts where the split is the user\u2019s to own: project `strctPaneStart` / `strctPaneEnd`, bind `[(split)]` (start pane %, persistable) and clamp with `min`/`max`. The gutter is a keyboard `role="separator"`: arrows nudge by `step`, Home/End jump to the bounds.',
        inputs: [
          {
            name: 'split',
            type: 'number',
            default: '50',
            description: 'Start pane share in percent, two-way.',
          },
          {
            name: 'min / max',
            type: 'number',
            default: '15 / 85',
            description: 'Clamp bounds (%).',
          },
          {
            name: 'vertical',
            type: 'boolean',
            default: 'false',
            description: 'Stack panes vertically.',
          },
          { name: 'step', type: 'number', default: '3', description: 'Keyboard nudge (%).' },
          {
            name: 'gutterLabel',
            type: 'string',
            default: `'Resize panes'`,
            description: 'Accessible separator name.',
          },
        ],
        do: ['Persist `split` next to your other user preferences.'],
        dont: ['Do not nest splitters more than one level deep \u2014 use a real layout then.'],
        a11y: ['The gutter exposes aria-valuenow/min/max and is fully keyboard-operable.'],
      },
      {
        id: 'watermark',
        title: 'Watermark',
        selector: 'strct-watermark',
        importNames: ['StrctWatermark'],
        summary: 'Repeating diagonal text overlay (compliance).',
        lead: 'A pointer-transparent tiled SVG layer over its content \u2014 "CONFIDENTIAL", "user@corp \u00b7 2026-07-21" \u2014 for classified / internal consoles. Content below stays fully interactive and selectable; the layer is aria-hidden and text is XML-escaped.',
        inputs: [
          { name: 'text', type: 'string', description: 'The repeated mark. Required.' },
          {
            name: 'opacity',
            type: 'number',
            default: '0.06',
            description: 'Layer opacity (0\u20131).',
          },
          { name: 'angle', type: 'number', default: '-24', description: 'Rotation in degrees.' },
          { name: 'gap', type: 'number', default: '220', description: 'Tile size (px).' },
          { name: 'fontSize', type: 'number', default: '15', description: 'Mark font size (px).' },
        ],
        do: ['Stamp who/when for screenshot traceability.'],
        dont: [
          'Do not raise opacity until text contrast suffers \u2014 it is a deterrent, not a lock.',
        ],
        a11y: ['Purely decorative: aria-hidden and pointer-events: none.'],
      },
      {
        id: 'wizard',
        title: 'Wizard',
        selector: 'strct-wizard',
        importNames: ['StrctWizard', 'StrctStep'],
        summary: 'Multi-step flow with Back / Next / Finish.',
        lead: 'A multi-step flow with built-in Back / Next / Finish controls. Each `strct-step` carries a `label` and can gate progress with `[canAdvance]`; the wizard emits `finished` on completion and supports a busy submit state and an optional Cancel.',
        inputs: [
          {
            name: 'label',
            type: 'string',
            description: 'On `strct-step`: the step title. Required.',
          },
          {
            name: 'canAdvance',
            type: 'boolean',
            default: 'true',
            description: 'On `strct-step`: when false, Next / Finish is disabled on this step.',
          },
          {
            name: 'submitting',
            type: 'boolean',
            default: 'false',
            description:
              'On `strct-wizard`: disable Finish and show a busy label during an async submit.',
          },
          {
            name: 'cancelable',
            type: 'boolean',
            default: 'false',
            description: 'On `strct-wizard`: show a Cancel button.',
          },
          {
            name: 'finishLabel',
            type: 'string',
            default: `'Finish'`,
            description: 'On `strct-wizard`: label for the final-step button.',
          },
        ],
        outputs: [
          {
            name: 'finished',
            type: 'void',
            description: 'Fired when the final step is completed.',
          },
          { name: 'cancelled', type: 'void', description: 'Fired when Cancel is clicked.' },
          {
            name: 'stepChange',
            type: 'number',
            description: 'Emits the new step index after a Back / Next move.',
          },
        ],
        do: [
          'Use for a linear, sequential task with a clear end.',
          'Gate each step with [canAdvance] tied to its form validity.',
        ],
        dont: ['Do not use a wizard for non-sequential, browsable sections — use tabs.'],
      },
      {
        id: 'divider',
        title: 'Divider',
        selector: 'strct-divider',
        importNames: ['StrctDivider'],
        summary: 'Separator rule, optional label, vertical mode.',
        lead: 'A separator rule, optionally with a centered label (projected content) or in vertical inline mode.',
        inputs: [
          {
            name: 'vertical',
            type: 'boolean',
            default: 'false',
            description: 'Render as a vertical rule for inline separation.',
          },
        ],
        do: ['Use a labelled divider to introduce an alternative ("or").'],
        dont: ['Do not overuse dividers — whitespace often separates content well enough.'],
      },
    ],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    icon: 'compass',
    loadExamples: () => import('../pages/navigation.page').then((m) => m.NavigationPage),
    components: [
      {
        id: 'breadcrumb',
        title: 'Breadcrumb',
        selector: 'strct-breadcrumb, strct-breadcrumb-item',
        importNames: ['StrctBreadcrumb', 'StrctBreadcrumbItem'],
        summary: 'Hierarchical location trail.',
        lead: 'A trail of links showing the current location within a hierarchy. Project `strct-breadcrumb-item` entries; mark the last one `current`.',
        inputs: [
          {
            name: 'current',
            type: 'boolean',
            default: 'false',
            description: 'On `strct-breadcrumb-item`: render as the non-link current page.',
          },
        ],
        do: ['Mark the final item current so it is not a link.'],
        dont: ['Do not use a breadcrumb when the hierarchy is only one level deep.'],
        a11y: ['Use within a nav landmark; the current item should not be a link.'],
      },
      {
        id: 'menubar',
        title: 'Menubar',
        selector: 'strct-menubar',
        importNames: ['StrctMenubar', 'StrctMenubarItem'],
        summary: 'Horizontal application-menu strip.',
        lead: 'The "VM \u00b7 Host \u00b7 Cluster" application-menu strip for dense tool-style consoles. Click or Enter/Down opens a menu; Left/Right move across the bar and, while open, switch the open menu (APG menubar). `(picked)` carries `{ menu, item }`.',
        inputs: [
          {
            name: 'menus',
            type: 'StrctMenubarItem[]',
            description: '`{ id; label; items: StrctMenuItem[] }[]`. Required.',
          },
          {
            name: 'ariaLabel',
            type: 'string',
            default: `'Application menu'`,
            description: 'Accessible bar name.',
          },
        ],
        outputs: [
          { name: 'picked', type: '{ menu; item }', description: 'A menu entry was chosen.' },
        ],
        do: ['Group verbs by object (VM / Host / Cluster) the way vSphere does.'],
        dont: ['Do not use it for site navigation \u2014 that is the header / rail\u2019s job.'],
        a11y: [
          'role="menubar" with roving tabindex; menus are labeled role="menu"; Escape and outside click close.',
        ],
      },
      {
        id: 'pagination',
        title: 'Pagination',
        selector: 'strct-pagination',
        importNames: ['StrctPagination'],
        summary: 'Page navigation for long lists.',
        lead: 'Page navigation for long lists, with previous / next and numbered pages. The current page is two-way bound.',
        inputs: [
          { name: 'total', type: 'number', description: 'Total item count. Required.' },
          { name: 'pageSize', type: 'number', default: '10', description: 'Items per page.' },
          {
            name: 'page',
            type: 'number',
            default: '1',
            description: 'Current page (1-based), two-way (`[(page)]`).',
          },
        ],
        do: ['Keep pageSize consistent with what your data source returns.'],
        dont: ['Do not paginate very short lists.'],
        a11y: ['Page controls are buttons; the active page is indicated.'],
      },
      {
        id: 'rail',
        title: 'Rail',
        selector: 'strct-rail',
        importNames: ['StrctRail', 'StrctRailItem'],
        summary: 'Collapsible icon navigation rail.',
        lead: 'A data-driven primary navigation rail for an application shell. Each item is an icon + label + optional status badge; collapsing shrinks it to an icon-only rail where badges become dots and labels become tooltips.',
        inputs: [
          {
            name: 'items',
            type: 'StrctRailItem[]',
            description:
              'Navigation entries: `{ id, label, icon, badge?, badgeStatus?, disabled?, placement?, routerLink?, href?, dot?, dotStatus?, trailingIcon? }`. `placement: "bottom"` pins the item to the foot of the rail under a divider (e.g. Administration). `routerLink` / `href` render the item as a real `<a>` — middle-click, ⌘/Ctrl-click and "open in new tab" work; `(select)` still fires on plain activation. `dot` + `dotStatus` show a small trailing status dot; `trailingIcon` a muted trailing glyph. Required.',
          },
          {
            name: 'activeId',
            type: 'string | null',
            default: 'null',
            description: 'Active item id, two-way (`[(activeId)]`).',
          },
          {
            name: 'collapsed',
            type: 'boolean',
            default: 'false',
            description: 'Icon-only state, two-way (`[(collapsed)]`).',
          },
          {
            name: 'collapsible',
            type: 'boolean',
            default: 'true',
            description: 'Show the collapse toggle at the foot of the rail.',
          },
          {
            name: 'ariaLabel',
            type: 'string',
            default: `'Primary'`,
            description: 'Accessible label for the nav landmark.',
          },
        ],
        outputs: [
          { name: 'select', type: 'StrctRailItem', description: 'Emitted when an item is chosen.' },
        ],
        do: [
          'Give items a status badge to surface health / alert counts at a glance.',
          'Collapse the rail on smaller screens to reclaim horizontal space.',
          'Use routerLink items for the app’s primary categories so browser affordances (new tab, middle-click) keep working.',
          'Pin utility destinations (Administration, Settings) with placement: "bottom".',
        ],
        dont: ['Do not exceed ~8 top-level items; group deeper navigation elsewhere.'],
        a11y: [
          'Renders a nav landmark; the active item gets aria-current. Collapsed items expose their label as a tooltip. Link items are real anchors, so assistive tech announces them as links.',
        ],
      },
      {
        id: 'command-palette',
        title: 'Command palette',
        selector: 'strct-command-palette',
        importNames: ['StrctCommandPalette', 'StrctCommandItem'],
        summary: '⌘/Ctrl-K spotlight over app commands.',
        lead: 'A spotlight search over commands or pages. Mount once near the app root, feed it `items` and act on `(picked)`. Opens via the two-way `open` model or the built-in ⌘/Ctrl-K hotkey. Ranked filtering (label prefix > word start > substring > keywords), full keyboard support, and focus restore on close. For server-backed search (RBAC-filtered inventories, thousands of objects) bind the two-way `query`, pass `[filter]="false"` and flip `loading` while results are in flight. This docs site itself runs on it — press ⌘K.',
        inputs: [
          {
            name: 'items',
            type: 'StrctCommandItem[]',
            default: '[]',
            description: '`{ id; label; group?; icon?; hint?; keywords?; data? }[]`.',
          },
          {
            name: 'open',
            type: 'boolean',
            default: 'false',
            description: 'Two-way open state (`[(open)]`).',
          },
          {
            name: 'query',
            type: 'string',
            default: `''`,
            description:
              'Typed text, two-way (`[(query)]`) — observe it to serve results from an API. Resets on open.',
          },
          {
            name: 'filter',
            type: 'boolean',
            default: 'true',
            description:
              'Internal ranked filtering. `false` = "render `items` in the order given, I already filtered them".',
          },
          {
            name: 'loading / loadingText',
            type: 'boolean / string',
            default: `false / 'Searching…'`,
            description: 'Politely-announced "searching" row while server results are in flight.',
          },
          {
            name: 'hotkey',
            type: 'boolean',
            default: 'true',
            description: 'Built-in ⌘/Ctrl-K toggle.',
          },
          {
            name: 'placeholder / emptyText',
            type: 'string',
            description: 'Localizable strings.',
          },
          {
            name: 'maxResults',
            type: 'number',
            default: '50',
            description:
              'Cap on rendered results (also with `filter=false` — it caps rendering, not selection).',
          },
        ],
        outputs: [
          {
            name: 'picked',
            type: 'StrctCommandItem',
            description: 'Chosen command (Enter or click); the palette closes itself.',
          },
        ],
        do: [
          'Give items stable ids and act on (picked) — navigation, actions, theme toggles.',
          'Add keywords for synonyms users will actually type.',
        ],
        dont: ['Do not use it as a form control — it is a launcher, not a select.'],
        a11y: [
          'ARIA combobox/listbox pattern with aria-activedescendant; arrows/Home/End/Enter/Escape; focus returns to the trigger on close; reduced-motion safe.',
        ],
      },
      {
        id: 'searchbox',
        title: 'Searchbox',
        selector: 'strct-searchbox',
        importNames: ['StrctSearchbox'],
        summary: 'Compact search pill — input or palette trigger.',
        lead: 'The docs-header search pattern as a component: a leading search icon, a label / input and an optional keyboard-hint chip. Default mode is a real search field (two-way `value`, CVA-compatible, Enter emits `(search)`, Escape / × clears). `trigger` mode renders a button that only emits `(activated)` — the classic "fake search that opens the command palette" header pattern. The docs header itself runs on it.',
        inputs: [
          {
            name: 'placeholder',
            type: 'string',
            default: `'Search'`,
            description: 'Placeholder text (and the trigger mode’s label).',
          },
          {
            name: 'hint',
            type: 'string',
            default: `''`,
            description: 'Keyboard-hint chip (e.g. "⌘K"); hidden while typing.',
          },
          {
            name: 'trigger',
            type: 'boolean',
            default: 'false',
            description:
              'Render as an activation button instead of a real input — pair with the command palette.',
          },
          {
            name: 'clearable',
            type: 'boolean',
            default: 'true',
            description: 'Show the × clear button while there is a value.',
          },
          {
            name: 'value',
            type: 'string',
            default: `''`,
            description: 'Current text, two-way (`[(value)]`); also the CVA value.',
          },
          {
            name: 'ariaLabel / clearLabel',
            type: 'string',
            default: `'' / 'Clear search'`,
            description: 'Accessible labels (localizable); ariaLabel falls back to placeholder.',
          },
        ],
        outputs: [
          {
            name: 'search',
            type: 'string',
            description: 'Enter pressed in input mode — run the search with the current text.',
          },
          {
            name: 'activated',
            type: 'void',
            description: 'Trigger mode clicked — open your command palette / search surface.',
          },
        ],
        methods: [
          {
            name: 'focus() / clear()',
            type: '() => void',
            description: 'Focus the input (e.g. from a global shortcut) / clear the text.',
          },
        ],
        do: [
          'Pair trigger mode with strct-command-palette and show its hotkey in `hint`.',
          'Use input mode for list filtering; act on `(search)` or live `[(value)]`.',
        ],
        dont: ['Do not register a second global hotkey here — the palette owns ⌘K.'],
        a11y: [
          'Input mode is a labeled role="searchbox"; Escape clears; the × is a labeled button. Trigger mode is a real button with a visible focus ring.',
        ],
      },
      {
        id: 'kbd',
        title: 'Kbd',
        selector: 'strct-kbd',
        importNames: ['StrctKbd'],
        summary: 'Inline keyboard-key chip.',
        lead: 'A small key chip for shortcut hints: `<strct-kbd>⌘K</strct-kbd>`. Used by the command palette; handy in menus, tooltips and docs.',
        do: ['Keep contents short — a key or a chord.'],
        dont: ['Do not use it for non-keyboard labels — that is a badge.'],
      },
      {
        id: 'section-menu',
        title: 'Section menu',
        selector: 'strct-section-menu',
        importNames: ['StrctSectionMenu', 'StrctMenuSection', 'StrctMenuLink'],
        summary: 'Two-level category / item menu.',
        lead: 'A two-level navigation menu — categories (level 1) each holding a flat list of items (level 2); not a tree. Categories can be collapsible (chevrons) or static section labels, and category / item icons can be hidden.',
        inputs: [
          {
            name: 'sections',
            type: 'StrctMenuSection[]',
            description:
              'Categories with items: `{ label, icon?, expanded?, items: StrctMenuLink[] }`. Each item is `{ id, label, icon?, disabled?, badge?, badgeStatus?, dot?, dotStatus?, trailingIcon? }` — `badge` renders a trailing count chip, `dot` a small status dot (e.g. "unsaved changes"), `trailingIcon` a muted glyph (e.g. "restart required"). Same status vocabulary as the rail (`StrctRailStatus`). Required.',
          },
          {
            name: 'activeId',
            type: 'string | null',
            default: 'null',
            description: 'Active item id, two-way (`[(activeId)]`).',
          },
          {
            name: 'collapsible',
            type: 'boolean',
            default: 'true',
            description:
              'Categories collapse via a chevron; `false` renders static uppercase section labels (always open).',
          },
          {
            name: 'showIcons',
            type: 'boolean',
            default: 'true',
            description: 'Show category / item icons.',
          },
          {
            name: 'ariaLabel',
            type: 'string',
            default: `'Sections'`,
            description: 'Accessible label for the nav landmark.',
          },
        ],
        outputs: [
          { name: 'select', type: 'StrctMenuLink', description: 'Emitted when an item is chosen.' },
        ],
        do: [
          'Use it for a grouped side navigation that is at most two levels deep.',
          'Reach for the tree instead when you need arbitrary nesting.',
        ],
        dont: ['Do not nest sections — items are a flat list under each category.'],
        a11y: [
          'Renders a nav landmark; the active item gets aria-current and collapsible categories expose aria-expanded.',
        ],
      },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    icon: 'chart',
    loadExamples: () => import('../pages/data.page').then((m) => m.DataPage),
    components: [
      {
        id: 'reorder',
        title: 'Reorder',
        selector: '[strctReorder] + [strctReorderItem]',
        importNames: ['StrctReorder', 'StrctReorderItem', 'StrctReorderEvent'],
        utility: true,
        summary: 'List drag-reorder primitive \u2014 you own the array.',
        lead: 'Two directives: the container emits `(reordered) { from, to }` and the consumer applies the move \u2014 the primitive never touches your data. Items are HTML5-draggable and keyboard-movable (Alt+\u2191/\u2193 on the focused row); `.strct-reorder--dragging` / `--over` classes hook your styling.',
        inputs: [
          {
            name: 'reorderDisabled',
            type: 'boolean',
            default: 'false',
            description: 'Display-only mode.',
          },
        ],
        outputs: [
          {
            name: 'reordered',
            type: 'StrctReorderEvent',
            description: '`{ from, to }` \u2014 splice your array accordingly.',
          },
        ],
        do: ['Keep rows homogeneous \u2014 boot orders, priority lists, pipeline steps.'],
        dont: ['Do not use it for cross-list moves \u2014 that is strct-transfer\u2019s job.'],
        a11y: ['Rows are focusable, aria-roledescription="sortable", and fully keyboard-movable.'],
      },
      {
        id: 'description-list',
        title: 'Description list',
        selector: 'strct-description-list, strct-desc',
        importNames: ['StrctDescriptionList', 'StrctDesc', 'StrctDescItem'],
        summary: 'Aligned label → value pairs (+ inline stat strip).',
        lead: 'A compact definition list: aligned `label : value` rows with an optional trailing slot. The `inline` variant is the horizontal "stat strip". Drive it with the `items` input, or project `<strct-desc label="…">` rows so a value can host a badge, icon or rich content.',
        inputs: [
          {
            name: 'items',
            type: 'StrctDescItem[]',
            default: '[]',
            description: '`{ label; value?; mono?; muted? }[]`. Alternative to projected rows.',
          },
          {
            name: 'inline',
            type: 'boolean',
            default: 'false',
            description: 'Horizontal stat-strip layout instead of stacked rows.',
          },
          {
            name: 'align',
            type: `'between' | 'start'`,
            default: `'between'`,
            description: 'Value alignment in stacked mode.',
          },
          {
            name: 'strct-desc label',
            type: 'string',
            description: 'Projected-row label. Add `mono` / `muted` to style its value.',
          },
        ],
        do: [
          'Use the items input for plain text pairs; project strct-desc when a value needs a badge or icon.',
          'Use inline for a horizontal stat strip of a few key facts.',
        ],
        dont: ['Do not use it for editable fields — that is what strct-field is for.'],
      },
      {
        id: 'code',
        title: 'Code',
        selector: 'strct-code',
        importNames: ['StrctCode'],
        summary: 'Copyable mono code / config block.',
        lead: 'The component form of the `<details><pre>` pattern: a mono block with a header row (optional `title`, uppercase `language` tag, built-in copy button), optional line numbers in an uncopyable gutter, a `maxHeight` scroll region and a `collapsible` mode that folds to the header.',
        inputs: [
          {
            name: 'code',
            type: 'string',
            description: 'The code / rendered config text (copied verbatim). Required.',
          },
          {
            name: 'title / language',
            type: 'string',
            default: `'' / ''`,
            description: 'Header title (e.g. a filename) and a small uppercase language tag.',
          },
          {
            name: 'copyable',
            type: 'boolean',
            default: 'true',
            description: 'Show the copy button (a `strct-copy`).',
          },
          {
            name: 'collapsible / collapsed',
            type: 'boolean',
            default: 'false / false',
            description: 'Fold to just the header; `collapsed` is two-way.',
          },
          {
            name: 'lineNumbers',
            type: 'boolean',
            default: 'false',
            description: 'Line-number gutter; numbers are never copied — `code` is.',
          },
          {
            name: 'wrap',
            type: 'boolean',
            default: 'false',
            description:
              'Soft-wrap long unbroken text (PEM/CSR, base64, one-liner commands) — no horizontal scroll in dialogs. Takes precedence over `lineNumbers`.',
          },
          {
            name: 'maxHeight',
            type: 'number | null',
            default: 'null',
            description: 'Scroll the body past this height (px).',
          },
        ],
        do: ['Use it for rendered configs, snippets and logs excerpts.'],
        dont: ['Do not put interactive content inside — it is a text surface.'],
        a11y: [
          'The body is a keyboard-focusable, labeled scroll region; the collapse toggle exposes aria-expanded.',
        ],
      },
      {
        id: 'filter-bar',
        title: 'Filter bar',
        selector: 'strct-filter-bar',
        importNames: ['StrctFilterBar', 'StrctFilterChip'],
        summary: 'Search + filter chips + result count.',
        lead: 'The standard strip above a data grid: a `strct-searchbox`, removable filter chips, a clear-all action and a live result count. The bar owns no filtering logic — it renders your state and announces intent through outputs.',
        inputs: [
          {
            name: 'query',
            type: 'string',
            default: `''`,
            description: 'Search text, two-way (`[(query)]`).',
          },
          {
            name: 'filters',
            type: 'StrctFilterChip[]',
            default: '[]',
            description: '`{ id, label, data? }[]` — the active filter chips.',
          },
          {
            name: 'count',
            type: 'number | null',
            default: 'null',
            description: 'Result count shown at the end; null hides it.',
          },
          {
            name: 'placeholder / countLabel / clearLabel / removeLabel',
            type: 'string',
            description: 'Localizable strings.',
          },
        ],
        outputs: [
          { name: 'search', type: 'string', description: 'Enter pressed in the search field.' },
          { name: 'removed', type: 'StrctFilterChip', description: 'A chip’s × was clicked.' },
          { name: 'cleared', type: 'void', description: '"Clear filters" was clicked.' },
        ],
        do: [
          'Feed (removed)/(cleared) straight back into your filter state.',
          'Pair with the datagrid and keep `count` in sync with the filtered rows.',
        ],
        dont: ['Do not filter inside the bar — it is presentation for your query state.'],
        a11y: [
          'Chip removers are labeled buttons; the count is a polite live region; the search field is a labeled searchbox.',
        ],
      },
      {
        id: 'table',
        title: 'Table',
        selector: 'strct-table',
        importNames: ['StrctTable', 'StrctColumn', 'StrctCellDef'],
        summary: 'Lightweight styled table.',
        lead: 'A lightweight, token-styled table for simple tabular data. Pass `columns` and `rows`; values are looked up by column `key`. Cells render as text by default — supply a `*strctCell="key"` template (context: `let-row`, `let-value="value"`, `let-column="column"`) for custom content.',
        inputs: [
          {
            name: 'columns',
            type: 'StrctColumn[]',
            description: '`{ key; label; align? }[]`. Required.',
          },
          {
            name: 'rows',
            type: 'StrctRow[]',
            description: 'Array of `Record<string, unknown>`. Required.',
          },
          {
            name: 'striped',
            type: 'boolean',
            default: 'false',
            description: 'Alternating row backgrounds.',
          },
          {
            name: 'hover',
            type: 'boolean',
            default: 'false',
            description: 'Highlight rows on hover.',
          },
          {
            name: 'emptyText',
            type: 'string',
            default: `'No data'`,
            description: 'Shown when rows is empty.',
          },
        ],
        do: ['Use for read-only, lightweight tabular data.'],
        dont: ['Do not use the simple table when you need sorting / selection — use the datagrid.'],
      },
      {
        id: 'datagrid',
        title: 'Datagrid',
        selector: 'strct-datagrid',
        importNames: ['StrctDatagrid', 'StrctDatagridColumn', 'StrctCellDef'],
        summary: 'Selectable, expandable data grid.',
        lead: 'A richer grid with sorting, selection, batch actions, pagination and expandable rows. Columns can be `sortable` and aligned. Use `*strctCell="key"` templates for custom cells (status pills, links, action buttons), and set `rowId` so selection / expansion survive live data refreshes.',
        inputs: [
          {
            name: 'columns',
            type: 'StrctDatagridColumn[]',
            description: '`{ key; label; sortable?; align? }[]`. Required.',
          },
          {
            name: 'rows',
            type: 'StrctRow[]',
            description: 'Array of `Record<string, unknown>`. Required.',
          },
          {
            name: 'rowId',
            type: 'string | ((row) => unknown)',
            default: 'null',
            description:
              'Stable row identity (property key or function). Set it for live-refreshing data so selection, expansion and the active detail row survive re-fetches. Defaults to object identity.',
          },
          {
            name: 'pageSize',
            type: 'number',
            default: '0',
            description: 'Rows per page; 0 disables pagination.',
          },
          {
            name: 'selectable',
            type: 'boolean',
            default: 'false',
            description: 'Show selection checkboxes + batch action bar.',
          },
          {
            name: 'initialSelection',
            type: 'readonly unknown[] | null',
            default: 'null',
            description:
              'Seed the selected rows (values are row ids matching `rowId`); requires `selectable`. Assigning a new array re-seeds — e.g. open a picker dialog with the current members already checked — while the user’s later toggles are preserved until it changes.',
          },
          {
            name: 'expandable',
            type: 'boolean',
            default: 'false',
            description: 'Allow rows to expand an inline detail (with `strctRowDetail`).',
          },
          {
            name: 'detailPane',
            type: 'boolean',
            default: 'false',
            description: 'Master/detail mode — see the Detail pane page.',
          },
          { name: 'compact', type: 'boolean', default: 'false', description: 'Denser row height.' },
          {
            name: 'singleLine',
            type: 'boolean',
            default: 'false',
            description:
              'Keep every row exactly one line tall: cell content never wraps — long values truncate with an ellipsis — so tall content can’t distort the grid. Hovering a cell whose content is actually clipped reveals the full text as a native title (hover-lazy — no render cost); cells that fit get none.',
          },
          {
            name: 'virtual / viewportHeight / rowHeight',
            type: 'boolean / number / number',
            default: 'false / 360 / 38',
            description:
              'Virtual scrolling for large sets: only the rows in the viewport (plus a small overscan) are in the DOM — 20k+ rows stay smooth, with a sticky header. Assumes uniform row height; not combinable with `expandable`.',
          },
          {
            name: 'lazy / total',
            type: 'boolean / number | null',
            default: 'false / null',
            description:
              'Server-side mode: the grid never sorts or slices `rows` itself — it emits `(lazyLoad)` with `{ page, pageSize, sortKey, sortDir }` whenever the user pages or sorts (and once on init); `total` drives the pager and count.',
          },
          {
            name: 'stateKey / columnState',
            type: 'string | null / StrctDatagridColumnState',
            default: 'null / null',
            description:
              'Column-preference persistence (widths from resize, hidden from the chooser, order from drag-reorder). `stateKey` auto-persists to localStorage (`strct-dg:<key>`) and restores on init; `[(columnState)]` gives full two-way control.',
          },
          {
            name: 'reorderable',
            type: 'boolean',
            default: 'false',
            description:
              'Drag column headers to reorder data columns; the order persists through `columnState` / `stateKey`.',
          },
          {
            name: 'groupBy',
            type: 'string | null',
            default: 'null',
            description:
              'Group rows by a column key: a collapsible header row per distinct value with a count; sorting applies within groups. Paging is bypassed while grouped; not combinable with `virtual`.',
          },
          {
            name: 'columns[].sticky',
            type: 'boolean',
            default: 'false',
            description:
              'Freeze leading columns against horizontal scroll (utility columns freeze automatically alongside). Give every sticky column except the last an explicit px `width`.',
          },
          {
            name: 'columns[].filterable / columns[].filterOptions',
            type: 'boolean / unknown[]',
            description:
              'Header filter popover: contains-text, or a checkbox value set when `filterOptions` is given.',
          },
          {
            name: 'filters',
            type: 'StrctDatagridFilters',
            default: '{}',
            description:
              'Two-way per-column filter state (`[(filters)]`): key → text or checked value set. Filters AND together, reset paging, and ride on `(lazyLoad)` in server mode.',
          },
          {
            name: 'quickFilter',
            type: 'string',
            default: `''`,
            description:
              'Global quick filter, two-way (`[(quickFilter)]`): one term OR-substring-matched across `quickFilterFields`. ANDs with the per-column filters, resets paging, rides on `(lazyLoad)`.',
          },
          {
            name: 'quickFilterFields',
            type: 'string[] | null',
            default: 'null',
            description:
              'Columns the quick term scans (default: every column key) — skip opaque ids here.',
          },
          {
            name: 'quickFilterable',
            type: 'boolean',
            default: 'false',
            description:
              'Render the built-in quick-filter searchbox in the toolbar, with a "filtered / total" count while narrowing.',
          },
          {
            name: 'quickFilterAlign',
            type: `'start' | 'end'`,
            default: `'end'`,
            description:
              'Toolbar placement of the built-in box. The default follows console convention: action verbs lead, view controls sit at the far right.',
          },
          {
            name: 'childrenKey',
            type: 'string | null',
            default: 'null',
            description:
              'Tree grid: the row property holding children. Indent + carets, per-level sorting, aria-level; an active filter shows matches with ancestors force-expanded. Not combinable with `groupBy` / `lazy`.',
          },
          {
            name: 'columns[].editable',
            type: 'boolean',
            default: 'false',
            description:
              'Inline cell editing: double-click opens an input; Enter / blur commit via `(cellEdit)`, Escape cancels.',
          },
          {
            name: 'emptyText',
            type: 'string',
            default: `'No data'`,
            description: 'Shown when rows is empty.',
          },
          {
            name: 'resizable',
            type: 'boolean',
            default: 'false',
            description: 'Enable column resizing by dragging column headers.',
          },
          {
            name: 'columnChooser',
            type: 'boolean',
            default: 'false',
            description: 'Show a column visibility toggle button in the footer.',
          },
          {
            name: 'sync',
            type: 'boolean',
            default: 'false',
            description: 'Show a refresh button in the footer action group.',
          },
          {
            name: 'footerActionsDisabled',
            type: 'boolean',
            default: 'false',
            description: 'Disable all footer action buttons (sync, column chooser).',
          },
          {
            name: 'loading',
            type: 'boolean',
            default: 'false',
            description: 'Show skeleton rows while data is loading.',
          },
          {
            name: 'rowActions',
            type: '(row) => StrctMenuItem[]',
            default: 'null',
            description:
              'Per-row action menu resolver. When set, each row gets a trailing actions column with a vertical-dots (kebab) button that opens that row’s data-driven menu.',
          },
        ],
        outputs: [
          {
            name: 'selectionChange',
            type: 'StrctRow[]',
            description: 'Emits the selected rows when selection changes.',
          },
          {
            name: 'cellEdit',
            type: '{ row; column; value; previous }',
            description:
              'An editable cell was committed. The grid never mutates rows — apply the change and pass the updated array back in.',
          },
          {
            name: 'syncChange',
            type: 'void',
            description: 'Emitted when the refresh button is clicked.',
          },
          {
            name: 'rowAction',
            type: '{ row; item: StrctMenuItem }',
            description: 'Emitted when a row’s action-menu item is chosen.',
          },
          {
            name: 'lazyLoad',
            type: 'StrctDatagridLazyState',
            description:
              'Server-side data request (`lazy` mode): `{ page, pageSize, sortKey, sortDir }` — fetch that window from your API and set `rows`.',
          },
        ],
        methods: [
          {
            name: 'sortBy(key)',
            type: '(key: string) => void',
            description: 'Toggle sort on a column (asc → desc → none).',
          },
          {
            name: 'toXLSX() / downloadXLSX(filename?)',
            type: '() => Uint8Array / (name?) => void',
            description:
              'Export the grid as a real .xlsx workbook — dependency-free SpreadsheetML, numeric cells stay numeric; opens in Excel, LibreOffice and Google Sheets.',
          },
          {
            name: 'toCSV() / downloadCSV(filename?)',
            type: '() => string / (name?) => void',
            description:
              'Export the grid as CSV: header labels + every non-hidden column, all rows in the current order (with proper quoting) — `downloadCSV` also triggers the file download.',
          },
        ],
        do: [
          'Provide an inline detail template via `<ng-template strctRowDetail let-row>` when expandable.',
          'Use the action bar slot for batch operations.',
        ],
        dont: [
          'Do not enable both expandable rows and detailPane at once — they are distinct patterns.',
        ],
        a11y: ['Sortable headers are focusable, toggle on Enter/Space and expose aria-sort.'],
      },
      {
        id: 'detailpane',
        title: 'Detail pane',
        selector: 'strct-datagrid[detailPane]',
        importNames: ['StrctDatagrid', 'StrctRowDetailDef'],
        summary: 'Collapse the grid to a master / detail view.',
        lead: 'A datagrid mode (`detailPane`) that collapses the table to its first column and opens a side pane for the active row. Distinct from expandable rows: this is a master/detail layout, not an inline expansion.',
        inputs: [
          {
            name: 'detailPane',
            type: 'boolean',
            default: 'false',
            description: 'Enable master/detail mode.',
          },
          {
            name: 'columns / rows',
            type: 'StrctDatagridColumn[] / StrctRow[]',
            description: 'Same as the datagrid.',
          },
        ],
        do: ['Render the pane body via `<ng-template strctRowDetail let-row>`.'],
        dont: ['Do not combine with inline expandable rows.'],
        a11y: ['The active row is marked with an accent caret tying it to the open pane.'],
      },
      {
        id: 'timeline',
        title: 'Timeline',
        selector: 'strct-timeline, strct-timeline-item',
        importNames: ['StrctTimeline', 'StrctTimelineItem'],
        summary: 'Vertical sequence of events.',
        lead: 'A vertical sequence of events. Each `strct-timeline-item` has a `title` and a semantic `state` marker.',
        inputs: [
          {
            name: 'title',
            type: 'string',
            description: 'On `strct-timeline-item`: the event title. Required.',
          },
          {
            name: 'state',
            type: `'default' | 'current' | 'success' | 'warning' | 'critical'`,
            default: `'default'`,
            description: 'On `strct-timeline-item`: marker color/emphasis.',
          },
        ],
        do: ['Use current to mark the in-progress step.'],
        dont: ['Do not use a timeline for non-sequential data.'],
      },
      {
        id: 'stack',
        title: 'Stack view',
        selector: 'strct-stack, strct-stack-item',
        importNames: ['StrctStack', 'StrctStackItem'],
        summary: 'Key / value detail list.',
        lead: 'A label / value list for read-only object details. Each `strct-stack-item` has a `label`; the value is projected content.',
        inputs: [
          {
            name: 'label',
            type: 'string',
            description: 'On `strct-stack-item`: the field label. Required.',
          },
        ],
        do: ['Use for compact read-only property lists (an object’s summary).'],
        dont: ['Do not use a stack view for editable forms.'],
      },
    ],
  },
  {
    id: 'ops',
    label: 'Ops',
    icon: 'metrics',
    loadExamples: () => import('../pages/ops.page').then((m) => m.OpsPage),
    components: [
      {
        id: 'time-range',
        title: 'Time range',
        selector: 'strct-time-range',
        importNames: ['StrctTimeRangePicker', 'StrctTimeRange', 'STRCT_TIME_RANGE_PRESETS'],
        summary: 'Grafana-style quick + absolute time window picker.',
        lead: 'The "Last 1 hour ▾" control monitoring charts hang off: quick relative ranges and an absolute from/to editor in one dialog popover (built on `strct-dropdown`\u2019s popover mode). Picking a preset resolves it against now and stamps `presetId`, so your refresh tick can re-resolve the same window; `refresh()` does exactly that imperatively.',
        inputs: [
          {
            name: 'range',
            type: 'StrctTimeRange | null',
            default: 'null',
            description: 'The selected window `{ from, to, presetId? }`, two-way (`[(range)]`).',
          },
          {
            name: 'presets',
            type: 'StrctTimeRangePreset[]',
            default: 'STRCT_TIME_RANGE_PRESETS',
            description:
              'Quick ranges (15m \u00b7 1h \u00b7 6h \u00b7 24h \u00b7 7d \u00b7 30d by default).',
          },
          {
            name: 'align',
            type: `'start' | 'end'`,
            default: `'start'`,
            description: 'Popover alignment.',
          },
          {
            name: 'size',
            type: `'sm' | 'md'`,
            default: `'md'`,
            description: 'Trigger button size — match size="sm" toolbars.',
          },
          {
            name: 'dialogLabel / quickLabel / absoluteLabel / fromLabel / toLabel / applyLabel / invalidLabel / placeholderLabel',
            type: 'string',
            description: 'Localizable strings.',
          },
        ],
        outputs: [
          {
            name: 'applied',
            type: 'StrctTimeRange',
            description: 'Every commit \u2014 preset pick or absolute apply.',
          },
        ],
        methods: [
          {
            name: 'refresh()',
            type: 'void',
            description: 'Re-resolve the current preset against now (no-op for absolute ranges).',
          },
        ],
        do: [
          'Feed (applied) into your chart / query reload.',
          'Call refresh() from your auto-refresh tick to keep "Last 1 hour" true.',
        ],
        dont: [
          'Do not use it as a general date picker \u2014 that is strct-datepicker\u2019s job.',
        ],
        a11y: [
          'The panel is a labeled dialog (dropdown popover mode); presets expose aria-pressed; the invalid-range message is an alert.',
        ],
      },
      {
        id: 'log-viewer',
        title: 'Log viewer',
        selector: 'strct-log-viewer',
        importNames: ['StrctLogViewer', 'StrctLogLine'],
        summary: 'Virtualized log tail with follow mode and ANSI colors.',
        lead: 'The `kubectl logs -f` surface as a component: a virtualized window (100k lines scroll flat), a follow mode that sticks to the tail and pauses when you scroll up (Grafana/Loki convention), ANSI SGR colors parsed into safe spans mapped onto theme tokens, and severity tinting from explicit levels or auto-detected ERROR/WARN tokens.',
        inputs: [
          {
            name: 'lines',
            type: '(string | StrctLogLine)[]',
            default: '[]',
            description: 'Log lines \u2014 plain strings or `{ text, level }`.',
          },
          {
            name: 'follow',
            type: 'boolean',
            default: 'true',
            description: 'Stick to the tail (two-way; pauses on scroll-up, resumes at bottom).',
          },
          {
            name: 'wrapMode',
            type: 'boolean',
            default: 'false',
            description: 'Soft-wrap long lines (two-way; also a toolbar toggle).',
          },
          { name: 'height', type: 'number', default: '320', description: 'Viewport height (px).' },
          {
            name: 'autoLevel',
            type: 'boolean',
            default: 'true',
            description: 'Detect ERROR/WARN/INFO/DEBUG tokens on plain strings.',
          },
          {
            name: 'title / followLabel / wrapLabel / linesLabel / emptyLabel',
            type: 'string',
            description: 'Localizable strings.',
          },
        ],
        do: [
          'Append immutably (update the array reference) so OnPush sees new lines.',
          'Use { text, level } objects when your backend already knows severity.',
        ],
        dont: ['Do not pipe megabyte blobs through as one line \u2014 split on newlines first.'],
        a11y: [
          'role="log" region, keyboard-focusable scroll area, aria-pressed toolbar toggles; ANSI colors ride on theme tokens so contrast follows the palette.',
        ],
      },
      {
        id: 'diff',
        title: 'Diff',
        selector: 'strct-diff',
        importNames: ['StrctDiff', 'StrctDiffRow', 'strctComputeDiff'],
        summary: 'Config / YAML line diff \u2014 unified or split.',
        lead: 'Change-approval screens without a hand-rolled diff: an LCS line diff rendered unified or side-by-side, +/\u2212 symbol marking (never color alone), add/del counts, collapsible unchanged runs and a copy-new-version button. `strctComputeDiff()` is exported for programmatic use \u2014 change counts, "anything changed?" gating.',
        inputs: [
          { name: 'before / after', type: 'string', description: 'The two texts. Required.' },
          {
            name: 'mode',
            type: `'unified' | 'split'`,
            default: `'unified'`,
            description: 'Render style.',
          },
          {
            name: 'context',
            type: 'number',
            default: '3',
            description: 'Context lines kept around changes; 0 disables collapsing.',
          },
          {
            name: 'title / language / beforeLabel / afterLabel / unchangedLabel / copyAfterLabel',
            type: 'string',
            description: 'Header bits + localizable strings.',
          },
          {
            name: 'copyable',
            type: 'boolean',
            default: 'true',
            description: 'Copy button for the new version.',
          },
          {
            name: 'maxHeight',
            type: 'number | null',
            default: 'null',
            description: 'Scroll the body past this height (px).',
          },
        ],
        do: [
          'Show it in the confirm step of config edits \u2014 the diff is the review.',
          'Use strctComputeDiff() to disable "Save" when nothing changed.',
        ],
        dont: ['Do not diff binary or minified one-line blobs \u2014 line diffs need lines.'],
        a11y: [
          'Adds/removals carry +/\u2212 signs, not just tint; the body is a labeled, focusable region; fold rows are real buttons.',
        ],
      },
      {
        id: 'units',
        title: 'Units',
        selector: 'strctBytes \u00b7 strctRate \u00b7 strctDuration \u00b7 strctSi',
        importNames: ['StrctBytesPipe', 'StrctRatePipe', 'StrctDurationPipe', 'StrctSiPipe'],
        utility: true,
        summary: 'Byte / rate / duration / SI formatting \u2014 pipes + functions.',
        lead: 'The units infrastructure consoles speak, as pure functions (`strctFormatBytes`, `strctFormatRate`, `strctFormatDuration`, `strctFormatSi`) plus template pipes. Bytes default to binary (KiB \u2014 what memory and storage actually mean) with decimal on request; rates step in bit/s; durations render the two most significant units ("2h 14m"); SI handles counts ("12.4k IOPS").',
        inputs: [
          {
            name: 'strctBytes : binary? : digits?',
            type: 'number \u2192 string',
            description:
              '`68719476736 | strctBytes` \u2192 "64 GiB"; `| strctBytes: false` \u2192 decimal kB/MB.',
          },
          {
            name: 'strctRate : digits?',
            type: 'number \u2192 string',
            description: 'Bits per second: `2400000000 | strctRate` \u2192 "2.4 Gbit/s".',
          },
          {
            name: 'strctDuration : maxUnits?',
            type: 'number \u2192 string',
            description: 'Milliseconds: `8040000 | strctDuration` \u2192 "2h 14m".',
          },
          {
            name: 'strctSi : unit? : digits?',
            type: 'number \u2192 string',
            description: `\`12400 | strctSi : 'IOPS'\` \u2192 "12.4k IOPS".`,
          },
        ],
        do: ['Use one formatter everywhere \u2014 mixed GiB/GB in one console erodes trust.'],
        dont: ['Do not format bytes as decimal unless the vendor spec sheet does.'],
        a11y: ['Non-finite values render as an em dash, never "NaN".'],
      },
    ],
  },
  {
    id: 'charts',
    label: 'Charts',
    icon: 'gauge',
    loadExamples: () => import('../pages/charts.page').then((m) => m.ChartsPage),
    components: [
      {
        id: 'sparkline',
        title: 'Sparkline',
        selector: 'strct-sparkline',
        importNames: ['StrctSparkline'],
        summary: 'Tiny inline trend line.',
        lead: 'A tiny inline trend line for at-a-glance metrics. Dependency-free SVG.',
        inputs: [
          { name: 'data', type: 'number[]', description: 'Series values. Required.' },
          { name: 'status', type: CHART_STATUS, default: `'accent'`, description: 'Line color.' },
          {
            name: 'area',
            type: 'boolean',
            default: 'false',
            description: 'Fill the area under the line.',
          },
          { name: 'width', type: 'number', default: '100', description: 'SVG width in pixels.' },
          { name: 'height', type: 'number', default: '30', description: 'SVG height in pixels.' },
        ],
        do: ['Use inline beside a metric to show its recent trend.'],
        dont: ['Do not add axes or legends — sparklines are context, not analysis.'],
      },
      {
        id: 'line',
        title: 'Line & area',
        selector: 'strct-chart',
        importNames: ['StrctChart', 'StrctChartSeries', 'StrctChartThreshold'],
        summary: 'Smooth line / area chart — multi-series, live, thresholds.',
        lead: 'A time chart driven by a plain number array (`data`) or several `series`. Lines are smooth by default (monotone cubic — curves that never overshoot); set `curve` to `linear` or `step`. Toggle the gradient fill with `area`, turn on `live` for streaming metrics, add a `legend`, persistent `yAxis` scale labels, `thresholds` (reference lines), a `min` floor and `xTicks` thinning. Empty data shows a built-in `emptyText`. Dependency-free SVG, token-coloured, reduced-motion safe.',
        inputs: [
          {
            name: 'data',
            type: '(number | null)[]',
            description:
              'Single-series values (or use `series`). `null` / `NaN` marks a data gap: the line breaks — an outage never reads as a flat line.',
          },
          {
            name: 'series',
            type: 'StrctChartSeries[] | null',
            default: 'null',
            description:
              'Multiple lines: `{ data; label?; color?; status?; area?; curve?; dash?; lower?; upper? }[]`. `color` accepts a semantic status or a categorical slot `"chart-1".."chart-8"` — theme tokens with a fixed, colorblind-validated order per palette (slot 1 tracks the accent hue); use slots for N distinct entities and keep statuses for health. `lower`+`upper` fill a min–max band behind the line (downsampled spikes stay visible; tooltip shows `avg (min–max)`). Takes precedence over `data`; pairs with `legend`.',
          },
          {
            name: 'curve',
            type: `'smooth' | 'linear' | 'step'`,
            default: `'smooth'`,
            description: 'Line interpolation. Smooth uses non-overshooting monotone cubic.',
          },
          {
            name: 'area',
            type: 'boolean',
            default: 'false',
            description: 'Fill under the line with a soft vertical gradient.',
          },
          {
            name: 'glow',
            type: 'boolean',
            default: 'false',
            description: 'Soft ambient glow on the line and the leading-edge dot.',
          },
          {
            name: 'live',
            type: 'boolean',
            default: 'false',
            description:
              'Streaming mode: the window scrolls left as new points arrive, with a pulsing leading-edge dot.',
          },
          {
            name: 'interactive',
            type: 'boolean',
            default: 'true',
            description: 'Hover crosshair + value tooltip.',
          },
          {
            name: 'strokeWidth',
            type: 'number',
            default: '2',
            description: 'Line thickness in pixels.',
          },
          {
            name: 'interval',
            type: 'number',
            default: '1000',
            description: 'Expected ms between updates in live mode (drives the scroll duration).',
          },
          {
            name: 'type',
            type: `'line' | 'area' | 'bar'`,
            default: `'line'`,
            description:
              'Chart style (`area` is shorthand for line + area; `bar` switches to bars).',
          },
          {
            name: 'grid / dots',
            type: 'boolean',
            default: 'true / false',
            description: 'Show the gridlines / a dot per data point.',
          },
          { name: 'labels', type: 'string[]', default: '[]', description: 'X-axis labels.' },
          { name: 'status', type: CHART_STATUS, default: `'accent'`, description: 'Series color.' },
          {
            name: 'height',
            type: 'number',
            default: '160',
            description: 'Chart height in pixels.',
          },
          {
            name: 'min / max',
            type: 'number | null',
            default: 'null',
            description: 'Fixed Y floor / ceiling; null auto-scales (floor defaults to 0).',
          },
          {
            name: 'legend',
            type: 'boolean',
            default: 'false',
            description: 'Show a swatch + label per labeled series.',
          },
          {
            name: 'yAxis / yTicks / axisFormat',
            type: 'boolean / number / ((v)=>string)|null',
            default: 'false / 3 / null',
            description:
              'Persistent y-axis scale labels aligned to the gridlines; axisFormat falls back to valueFormat.',
          },
          {
            name: 'thresholds',
            type: 'StrctChartThreshold[]',
            default: '[]',
            description: '`{ value; label?; status?; dashed? }[]` — horizontal reference lines.',
          },
          {
            name: 'xTicks / xFormat',
            type: 'number|null / ((label,i)=>string)|null',
            default: 'null / null',
            description: 'Subsample x labels to ~xTicks and/or reformat them.',
          },
          {
            name: 'valueFormat',
            type: '((v: number) => string) | null',
            default: 'null',
            description: 'Formats tooltip / y-axis-flag values (units, precision).',
          },
          {
            name: 'emptyText',
            type: 'string',
            default: `'No data'`,
            description: 'Centered message shown when data / series is empty.',
          },
          {
            name: 'annotations',
            type: 'StrctChartAnnotation[]',
            default: '[]',
            description:
              '`{ index; label?; status?; dashed? }[]` — vertical event markers ("alarm raised", "deploy") anchored to a data index; the label joins the tooltip at that index.',
          },
          {
            name: 'activeIndex',
            type: 'number | null',
            default: 'null',
            description:
              'Drive the crosshair externally — mirror a sibling chart’s `(hoverIndex)` into it for a vCenter-style synced multi-chart dashboard. A local pointer wins while over this chart.',
          },
          {
            name: 'brush / zoom',
            type: 'boolean',
            default: 'false',
            description:
              'Drag-select a range. `brush` emits it through `(brushChange)`; `zoom` also zooms the chart into the selection (double-click, Escape or the ⟲ chip zooms back out).',
          },
          {
            name: 'stacked',
            type: 'boolean',
            default: 'false',
            description:
              'Stack multi-series values cumulatively with solid layer bands; tooltips keep the original per-series values. Nulls break the stack at that slot.',
          },
          {
            name: 'times',
            type: '(number | Date)[] | null',
            default: 'null',
            description:
              'Per-point timestamps: x positions map to real time, so uneven sampling renders honestly instead of equally spaced. Hover snaps to the nearest point by pixel distance.',
          },
          {
            name: 'scale',
            type: `'linear' | 'log'`,
            default: `'linear'`,
            description:
              'Y-axis scale. `log` spaces decades equally (decade ticks on the y-axis); values must be positive — non-positives clamp to the floor.',
          },
          {
            name: 'gapText / resetLabel',
            type: 'string',
            default: `'no data' / 'Reset zoom'`,
            description: 'Localizable strings for the gap tooltip and the reset-zoom chip.',
          },
        ],
        outputs: [
          {
            name: 'hoverIndex',
            type: 'number | null',
            description:
              'The hovered point index (null on leave) — wire it into a sibling chart’s `activeIndex` for synced crosshairs.',
          },
          {
            name: 'brushChange',
            type: '[number, number] | null',
            description:
              'The brushed [startIndex, endIndex] (inclusive), or null when the selection / zoom is cleared — re-query that range at finer resolution.',
          },
        ],
        methods: [
          {
            name: 'toSVG()',
            type: '() => string',
            description:
              'The rendered chart as a standalone SVG string — theme colors resolved, background and axis text baked in.',
          },
          {
            name: 'toPNG(scale?)',
            type: '(scale = 2) => Promise<string>',
            description:
              'The chart as a PNG data URL at the given scale — drop a perf chart straight into a ticket.',
          },
        ],
        do: [
          'Use for continuous time-series data; keep `curve="smooth"` for trends.',
          'Pass `series` + `legend` to compare two signals (in/out, read/write).',
          'Add `yAxis` + `thresholds` so operators can read levels at a glance.',
          'For live metrics, push a fixed-length sliding window and set `live` + `interval`.',
          'Represent missing samples as `null` — never fill an outage with fake values.',
        ],
        dont: ['Do not use a line chart for unordered categories — use bars.'],
        a11y: [
          'Honours prefers-reduced-motion: the scroll, pulse and draw-on animations are disabled.',
          'Keyboard: arrows walk the crosshair; Escape unwinds brush → zoom → crosshair.',
        ],
      },
      {
        id: 'bar',
        title: 'Bar',
        selector: 'strct-chart[type="bar"]',
        importNames: ['StrctChart'],
        summary: 'Bar chart for categorical data.',
        lead: 'The same `strct-chart` with `type="bar"`, for categorical comparisons.',
        inputs: [
          { name: 'data', type: 'number[]', description: 'Bar values. Required.' },
          {
            name: 'type',
            type: `'line' | 'area' | 'bar'`,
            default: `'line'`,
            description: 'Set to "bar".',
          },
          { name: 'labels', type: 'string[]', default: '[]', description: 'Category labels.' },
          { name: 'status', type: CHART_STATUS, default: `'accent'`, description: 'Bar color.' },
          {
            name: 'height',
            type: 'number',
            default: '160',
            description: 'Chart height in pixels.',
          },
          {
            name: 'max',
            type: 'number | null',
            default: 'null',
            description: 'Fixed Y maximum; null auto-scales.',
          },
        ],
        do: ['Use for comparing discrete categories.'],
        dont: ['Do not use bars for continuous time data — use a line.'],
      },
      {
        id: 'donut',
        title: 'Donut',
        selector: 'strct-donut',
        importNames: ['StrctDonut', 'StrctDonutSegment'],
        summary: 'Interactive proportional ring chart.',
        lead: 'A donut chart for parts of a whole, with rounded, gapped slices and a sweep-in animation. Hover a slice (or its legend row) to highlight it — the others dim and the center reads out that slice’s value + share. Segments are `{ value; label; color? }`.',
        inputs: [
          {
            name: 'segments',
            type: 'StrctDonutSegment[]',
            description: '`{ value; label?; color? }[]`. Required.',
          },
          { name: 'size', type: 'number', default: '120', description: 'Diameter in pixels.' },
          { name: 'thickness', type: 'number', default: '14', description: 'Ring stroke width.' },
          {
            name: 'centerValue',
            type: 'string | number',
            default: `''`,
            description: 'Big value in the middle (when no slice is hovered).',
          },
          {
            name: 'centerLabel',
            type: 'string',
            default: `''`,
            description: 'Caption under the center value.',
          },
          {
            name: 'legend',
            type: 'boolean',
            default: 'false',
            description:
              'Show a legend (color · label · value · %) beside the ring; rows hover-link to slices.',
          },
          {
            name: 'gap',
            type: 'number',
            default: '3',
            description: 'Gap between slices, in degrees (only with 2+ slices).',
          },
          {
            name: 'interactive',
            type: 'boolean',
            default: 'true',
            description: 'Hover highlight + center readout.',
          },
        ],
        do: [
          'Use for a small number of segments (2–5).',
          'Turn on legend when slice labels and exact values matter.',
        ],
        dont: ['Do not use a donut for many slivers — a bar chart reads better.'],
        a11y: ['The sweep-in animation honours prefers-reduced-motion.'],
      },
      {
        id: 'gauge',
        title: 'Gauge',
        selector: 'strct-gauge',
        importNames: ['StrctGauge'],
        summary: 'Single-value radial gauge.',
        lead: 'A radial gauge for a single bounded value (0–100), with a semantic arc color.',
        inputs: [
          { name: 'value', type: 'number', default: '0', description: 'Value 0–100.' },
          { name: 'status', type: CHART_STATUS, default: `'accent'`, description: 'Arc color.' },
          {
            name: 'thresholds',
            type: '{ warning?: number; critical?: number } | null',
            default: 'null',
            description:
              'When set, the gauge derives its status from the value: ≥ critical → critical, ≥ warning → warning, else the healthy base (success).',
          },
          { name: 'label', type: 'string', default: `''`, description: 'Caption under the value.' },
          { name: 'size', type: 'number', default: '120', description: 'Diameter in pixels.' },
          { name: 'thickness', type: 'number', default: '12', description: 'Arc stroke width.' },
        ],
        do: [
          'Pass thresholds to flag warning / critical levels without computing status yourself.',
        ],
        dont: ['Do not use a gauge for multi-series data.'],
      },
      {
        id: 'metric-tile',
        title: 'Metric tile',
        selector: 'strct-metric-tile',
        importNames: ['StrctMetricTile'],
        summary: 'Dense KPI tile with sparkline.',
        lead: 'A compact dashboard tile — a label, a large value (+ unit), an optional change indicator and an inline sparkline. Built for at-a-glance metrics.',
        inputs: [
          { name: 'label', type: 'string', description: 'Caption above the value. Required.' },
          {
            name: 'value',
            type: 'string | number',
            description: 'The headline value. Required.',
          },
          {
            name: 'unit',
            type: 'string',
            default: `''`,
            description: 'Unit after the value (%, GB…).',
          },
          { name: 'icon', type: 'string', default: `''`, description: 'Optional leading icon.' },
          {
            name: 'status',
            type: `'neutral' | 'accent' | 'success' | 'warning' | 'critical'`,
            default: `'neutral'`,
            description: 'Tints the value.',
          },
          {
            name: 'delta',
            type: 'number | null',
            default: 'null',
            description: 'Change indicator; the sign drives the arrow + colour.',
          },
          {
            name: 'deltaSuffix',
            type: 'string',
            default: `'%'`,
            description: 'Suffix for the delta number.',
          },
          {
            name: 'invertDelta',
            type: 'boolean',
            default: 'false',
            description: 'Treat a positive delta as bad (error rate, latency).',
          },
          {
            name: 'caption',
            type: 'string',
            default: `''`,
            description: 'Sub-text under the value.',
          },
          {
            name: 'data',
            type: 'number[]',
            default: '[]',
            description: 'Sparkline series; empty hides the chart.',
          },
        ],
        do: [
          'Pair a value with its trend so direction is obvious at a glance.',
          'Use `invertDelta` for metrics where up is bad.',
        ],
        dont: ['Do not crowd a tile with more than one metric.'],
      },
      {
        id: 'flow',
        title: 'Flow',
        selector: 'strct-flow',
        importNames: ['StrctFlow', 'StrctFlowNode'],
        summary: 'Animated relationship between endpoints.',
        lead: 'Shows a connection between two (or N) endpoints with an optional animated "flow" — moving packets travelling along the connector — for live data movement such as replication, sync or a pipeline. When `live` is off (or the user prefers reduced motion) the connector is a static gradient with a direction arrow. Dependency-free.',
        inputs: [
          {
            name: 'nodes',
            type: 'StrctFlowNode[]',
            default: '[]',
            description: 'Ordered endpoints: { id; label; sublabel?; role?; status? }.',
          },
          {
            name: 'live',
            type: 'boolean',
            default: 'false',
            description: 'Animate packets travelling along the connector.',
          },
          {
            name: 'direction',
            type: `'forward' | 'reverse' | 'both'`,
            default: `'forward'`,
            description: 'Direction of travel; drives the arrow(s) and packets.',
          },
          {
            name: 'status',
            type: STATUS_VALUES,
            default: `'accent'`,
            description: 'Connector + packet color.',
          },
          {
            name: 'orientation',
            type: `'horizontal' | 'vertical'`,
            default: `'horizontal'`,
            description: 'Layout axis.',
          },
          {
            name: 'label',
            type: 'string',
            default: `''`,
            description: 'Caption under the connector (e.g. "live replication", "0 lag").',
          },
        ],
        do: [
          'Use it for replication / sync / pipeline relationships between two or more nodes.',
          'Set `live` only while data is actually moving.',
        ],
        dont: ['Do not animate a static relationship — leave `live` off so the connector rests.'],
        a11y: [
          'Renders role="img" with an aria-label summarizing the flow; honours prefers-reduced-motion (packets drop to a static gradient).',
        ],
      },
    ],
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: 'bell',
    loadExamples: () => import('../pages/feedback.page').then((m) => m.FeedbackPage),
    components: [
      {
        id: 'hero',
        title: 'Hero',
        selector: 'strct-hero',
        importNames: ['StrctHero'],
        summary: 'Page-level status summary banner.',
        lead: 'A prominent, page-level status summary: a tone-colored surface with a leading icon chip, a heading, a description, and optional right-aligned metadata and actions. Distinct from `StrctAlert` (a dismissible inline notification) and `StrctSignpost` (a popover) — reach for it for the "Protected", "All systems healthy", "Clock synchronized" summaries.',
        inputs: [
          {
            name: 'status',
            type: STATUS_VALUES,
            default: `'neutral'`,
            description: 'Tone — drives the left rail and the filled icon chip color.',
          },
          {
            name: 'icon',
            type: 'string',
            description:
              'Leading icon name. Falls back to a per-status default (success → check, warning/critical → alert, accent/neutral → info).',
          },
          {
            name: 'heading',
            type: 'string',
            description: 'The headline. Required; exposed as the banner’s accessible name.',
          },
          {
            name: 'dense',
            type: 'boolean',
            default: 'false',
            description: 'Tighter padding for secondary placements.',
          },
        ],
        do: [
          'Use one hero per page for the single most important status.',
          'Project metadata into [strctHeroMeta] and buttons into [strctHeroActions].',
        ],
        dont: ['Do not use a hero for transient or dismissible messages — use an alert or toast.'],
        a11y: [
          'Renders role="status" (or role="alert" when status is critical); the heading names the region.',
        ],
      },
      {
        id: 'alert',
        title: 'Alert',
        selector: 'strct-alert',
        importNames: ['StrctAlert'],
        summary: 'Inline semantic banner.',
        lead: 'An inline banner for contextual messages, in four semantic tones. Uses a neutral surface with a colored left rail; add `closable` for a dismiss button.',
        inputs: [
          {
            name: 'type',
            type: `'info' | 'success' | 'warning' | 'critical'`,
            default: `'info'`,
            description: 'Semantic tone.',
          },
          {
            name: 'closable',
            type: 'boolean',
            default: 'false',
            description: 'Show a dismiss button.',
          },
        ],
        outputs: [{ name: 'closed', type: 'void', description: 'Fired when dismissed.' }],
        do: ['Use inline, near the content the message is about.'],
        dont: ['Do not use an alert for transient confirmations — use a toast.'],
      },
      {
        id: 'tooltip',
        title: 'Tooltip',
        selector: '[strctTooltip]',
        importNames: ['StrctTooltip'],
        summary: 'Hover / focus hint directive.',
        lead: 'A directive that shows a small hint on hover or focus. It renders into the document body, so it escapes overflow and transform clipping.',
        inputs: [
          { name: 'strctTooltip', type: 'string', description: 'Tooltip text. Required.' },
          {
            name: 'tooltipPosition',
            type: `'top' | 'bottom' | 'left' | 'right'`,
            default: `'top'`,
            description: 'Preferred side.',
          },
        ],
        do: ['Use for short, supplementary hints.'],
        dont: [
          'Do not put essential information only in a tooltip — it is not reachable on touch.',
        ],
        a11y: ['Shows on focus as well as hover.'],
      },
      {
        id: 'signpost',
        title: 'Signpost',
        selector: 'strct-signpost',
        importNames: ['StrctSignpost'],
        summary: 'Click-triggered explanatory popover.',
        lead: 'A click-triggered popover for richer inline help than a tooltip. Project the trigger and the content.',
        inputs: [
          {
            name: 'position',
            type: `'top' | 'bottom' | 'left' | 'right'`,
            default: `'bottom'`,
            description: 'Popover side relative to the trigger.',
          },
        ],
        do: ['Use for a paragraph of help or a small set of details.'],
        dont: ['Do not use a signpost where a one-line tooltip suffices.'],
      },
      {
        id: 'tour',
        title: 'Tour',
        selector: 'strct-tour',
        importNames: ['StrctTour', 'StrctTourStep'],
        summary: 'Coach marks \u2014 spotlight onboarding over live UI.',
        lead: '"What\u2019s new" onboarding: each step spotlights a CSS-selector `target` with an accent ring cut out of a dimmed backdrop and anchors a labeled dialog card next to it (auto-flipping near the viewport edge; `target: null` centers the card). Targets are looked up when the step shows, so it works over any page.',
        inputs: [
          {
            name: 'open',
            type: 'boolean',
            default: 'false',
            description: 'Two-way visibility; reopening restarts at step 1.',
          },
          {
            name: 'steps',
            type: 'StrctTourStep[]',
            description: '`{ target: string | null; title; body }[]`. Required.',
          },
          {
            name: 'nextLabel / backLabel / skipLabel / doneLabel',
            type: 'string',
            description: 'Localizable strings.',
          },
        ],
        outputs: [
          { name: 'finished', type: 'void', description: 'Done was clicked on the last step.' },
          { name: 'dismissed', type: 'void', description: 'Skipped / Escape / outside click.' },
        ],
        do: ['Keep it to 3\u20135 steps and persist "seen" so it never nags.'],
        dont: ['Do not gate critical workflows behind a tour.'],
        a11y: [
          'The card is a labeled role="dialog"; Escape dismisses; targets scroll into view before measuring.',
        ],
      },
      {
        id: 'announcer',
        title: 'Announcer',
        selector: 'StrctAnnouncer (service)',
        importNames: ['StrctAnnouncer'],
        utility: true,
        summary: 'Screen-reader live announcements (service).',
        lead: 'Material\u2019s LiveAnnouncer, strct-sized: a root-provided service maintaining hidden `aria-live` regions (polite + assertive). `announce(message, politeness?)` clears-then-sets so identical consecutive messages still speak, and stale text is wiped after 10s.',
        inputs: [
          {
            name: "announce(message, politeness = 'polite')",
            type: 'method',
            description:
              'Queue an announcement; `assertive` interrupts \u2014 reserve it for failures.',
          },
        ],
        do: ['Announce async outcomes with no visible text change ("12 rows loaded").'],
        dont: ['Do not announce what a focused control already reads out.'],
        a11y: ['This IS the a11y \u2014 pair every silent state change with an announcement.'],
      },
      {
        id: 'hotkeys',
        title: 'Hotkeys',
        selector: 'strct-hotkeys-help',
        importNames: ['StrctHotkeysService', 'StrctHotkeysHelp', 'StrctHotkey'],
        summary: 'Central hotkey registry + ? cheatsheet overlay.',
        lead: 'Blueprint\u2019s pattern: components register `{ combo, description, group, handler }` with `StrctHotkeysService` (combos like `mod+k` \u2014 mod = Ctrl/\u2318; plain keys are suppressed while typing) and get a dispose function back. `<strct-hotkeys-help/>`, mounted once, registers `?` itself and renders the grouped cheatsheet \u2014 shortcuts stay discoverable.',
        inputs: [
          {
            name: 'register(hotkey)',
            type: '() => void',
            description: 'Service: add a hotkey; call the returned function to unregister.',
          },
          {
            name: 'open',
            type: 'boolean',
            default: 'false',
            description: 'Overlay: two-way visibility (`?` toggles it too).',
          },
          {
            name: 'title / emptyText',
            type: 'string',
            description: 'Overlay: localizable strings.',
          },
        ],
        do: ['Register in a component\u2019s constructor and dispose via DestroyRef.'],
        dont: [
          'Do not bind single letters that fight with typing \u2014 they are muted in inputs anyway.',
        ],
        a11y: [
          'The overlay is a labeled dialog; Escape closes locally (never swallowed app-wide); combos render as kbd chips.',
        ],
      },
      {
        id: 'toast',
        title: 'Toast',
        selector: 'strct-toast-outlet',
        importNames: ['StrctToastOutlet', 'StrctToastService'],
        summary: 'Transient notifications via a service.',
        lead: 'Transient notifications raised from `StrctToastService` and rendered by a single `strct-toast-outlet` placed near the app root. Call from anywhere via dependency injection.',
        methods: [
          {
            name: 'show(message, options?)',
            type: '(string, { type?; duration? }) => number',
            description: 'Queue a toast; returns its id.',
          },
          {
            name: 'info / success / warning / critical',
            type: '(message, duration?) => number',
            description: 'Convenience helpers per type.',
          },
          {
            name: 'dismiss(id)',
            type: '(id: number) => void',
            description: 'Remove a specific toast.',
          },
          { name: 'clear()', type: '() => void', description: 'Remove all toasts.' },
        ],
        do: [
          'Render the outlet once near the app root.',
          'Use a duration of 0 for messages that must be acknowledged.',
        ],
        dont: [
          'Do not use toasts for critical errors that need a decision — use a modal or alert.',
        ],
      },
      {
        id: 'skeleton',
        title: 'Skeleton',
        selector: 'strct-skeleton',
        importNames: ['StrctSkeleton'],
        summary: 'Loading placeholder shapes.',
        lead: 'Animated placeholder shapes shown while content loads, sized to approximate the eventual content.',
        inputs: [
          { name: 'width', type: 'string', default: `'100%'`, description: 'CSS width.' },
          { name: 'height', type: 'string', default: `'14px'`, description: 'CSS height.' },
          {
            name: 'circle',
            type: 'boolean',
            default: 'false',
            description: 'Render as a circle (e.g. an avatar placeholder).',
          },
        ],
        do: ['Match skeleton shapes to the real content’s layout.'],
        dont: ['Do not show skeletons for very fast loads — a flash is worse than nothing.'],
        a11y: ['Decorative; pair with an aria-busy region for screen readers.'],
      },
      {
        id: 'empty-state',
        title: 'Empty state',
        selector: 'strct-empty-state',
        importNames: ['StrctEmptyState'],
        summary: 'Zero / permission / error states.',
        lead: 'A centered empty, permission or error state — an icon, a title, an optional description and a slot for call-to-action buttons. Project actions as children.',
        inputs: [
          {
            name: 'variant',
            type: `'empty' | 'denied' | 'error' | 'notfound'`,
            default: `'empty'`,
            description: 'Preset that supplies a default icon + tone.',
          },
          { name: 'icon', type: 'string', default: `''`, description: 'Override the preset icon.' },
          {
            name: 'tone',
            type: `'neutral' | 'warning' | 'critical' | 'accent'`,
            default: `''`,
            description: 'Override the preset tone.',
          },
          { name: 'title', type: 'string', description: 'Headline. Required.' },
          { name: 'description', type: 'string', default: `''`, description: 'Supporting text.' },
        ],
        do: [
          'Always offer a next action (CTA) where one makes sense.',
          'Use `denied` for permission walls and `error` for failures.',
        ],
        dont: ['Do not use an empty state where a brief inline message would do.'],
        a11y: ['The title is a heading; the CTA is a real button.'],
      },
    ],
  },
  {
    id: 'patterns',
    label: 'Patterns',
    icon: 'grid',
    loadExamples: () => import('../pages/patterns.page').then((m) => m.PatternsPage),
    components: [
      {
        id: 'login',
        title: 'Login',
        selector: 'strct-login',
        importNames: ['StrctLogin'],
        summary: 'Centered or split login scaffold.',
        lead: 'A login page scaffold in centered or split layouts. In split mode, project a decorative aside via `strctLoginAside` and the form via `strctLoginMain`.',
        inputs: [
          {
            name: 'maxWidth',
            type: 'number',
            default: '880',
            description: 'Max width of the card in pixels.',
          },
          {
            name: 'split',
            type: 'boolean',
            default: 'false',
            description: 'Two-panel layout with a decorative aside.',
          },
        ],
        do: ['Use `strctLoginMain` for the form content in split mode.'],
        dont: [
          'Do not place two default ng-content slots in separate branches when extending — Angular routes default content to one slot only.',
        ],
      },
      {
        id: 'contextmenu',
        title: 'Context menu',
        selector: '[strctContextMenu], strct-context-menu',
        importNames: [
          'StrctContextMenuTrigger',
          'StrctMenuItem',
          'StrctContextMenu',
          'StrctSubmenu',
        ],
        summary: 'Data-driven right-click menu with submenus.',
        lead: 'Two flavours. **Recommended:** the `[strctContextMenu]="items"` directive — attach a `StrctMenuItem[]` to any element; the menu portals into the body (no clipping), positions by its real size, supports full keyboard navigation and nested submenus, and runs each item\'s `action`. A content-projection `strct-context-menu` element (with `strct-submenu` fly-outs) also remains for static menus.',
        inputs: [
          {
            name: 'strctContextMenu',
            type: 'StrctMenuItem[]',
            description:
              'Menu data: `{ label; icon?; critical?; disabled?; divider?; children?; action? }[]`. Required (directive).',
          },
          {
            name: 'strctContextMenuData',
            type: 'unknown',
            default: 'undefined',
            description: "Payload passed to each item's `action`.",
          },
        ],
        outputs: [
          {
            name: 'menuSelect',
            type: 'StrctMenuItem',
            description: 'Fired with the chosen item (directive).',
          },
        ],
        do: [
          'Prefer the directive for per-object, data-driven menus (e.g. one menu per tree node).',
          'Add submenus via item `children`.',
        ],
        dont: ['Do not hide the only way to perform an action behind a right-click menu.'],
        a11y: [
          'Portaled to the body; positioned by real size; full keyboard support (↑/↓/→/←/Enter/Esc, roving tabindex); closes on outside click / Escape / scroll / resize.',
        ],
      },
    ],
  },
];

/** Flat, ordered list of every component (drives prev / next + search). */
export const ALL_COMPONENTS: (DocComponent & { category: DocCategory })[] = DOCS.flatMap((cat) =>
  cat.components.map((c) => ({ ...c, category: cat })),
);

export const COMPONENT_COUNT = ALL_COMPONENTS.filter((c) => !c.utility).length;

export function findComponent(id: string) {
  return ALL_COMPONENTS.find((c) => c.id === id) ?? null;
}

/** Guide pages shown above the component categories in the sidebar. */
export interface GuideLink {
  label: string;
  path: string;
}
export const GUIDES: { id: string; label: string; icon: string; items: GuideLink[] } = {
  id: 'foundations',
  label: 'Foundations',
  icon: 'book',
  items: [
    { label: 'Get started', path: '/get-started' },
    { label: 'Theming', path: '/foundations/theming' },
    { label: 'Icons', path: '/foundations/icons' },
    { label: 'Playground', path: '/playground' },
    { label: 'Theme playground', path: '/theme-playground' },
    { label: 'Guidelines', path: '/guidelines' },
  ],
};

/** End-to-end example pages composed from the library (datacenter console). */
export const SCENARIOS: { id: string; label: string; icon: string; items: GuideLink[] } = {
  id: 'scenarios',
  label: 'Scenarios',
  icon: 'datacenter',
  items: [
    { label: 'Dashboard', path: '/scenarios/dashboard' },
    { label: 'Inventory', path: '/scenarios/inventory' },
    { label: 'Host detail', path: '/scenarios/host' },
    { label: 'VM settings', path: '/scenarios/vm-settings' },
    { label: 'New cluster', path: '/scenarios/new-cluster' },
    { label: 'Empty & errors', path: '/scenarios/states' },
  ],
};
