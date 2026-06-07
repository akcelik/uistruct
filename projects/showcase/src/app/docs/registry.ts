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
        ],
        do: ['Switch to warning / critical as usage crosses your thresholds.'],
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
          model('string', 'Entered code.'),
          { name: 'length', type: 'number', default: '6', description: 'Number of boxes.' },
          {
            name: 'masked',
            type: 'boolean',
            default: 'false',
            description: 'Obscure entered characters.',
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
        id: 'card',
        title: 'Card',
        selector: 'strct-card',
        importNames: ['StrctCard', 'StrctCardHeader', 'StrctCardBlock', 'StrctCardFooter'],
        summary: 'Container composed of header / block / footer.',
        lead: 'A surface container composed from `strct-card-header`, `strct-card-block` and an optional `strct-card-footer`, each reading from the shared token layer. The pieces are pure composition — no inputs.',
        do: ['Compose only the pieces you need; all are optional except the card itself.'],
        dont: ['Do not nest cards deeply — flatten the hierarchy instead.'],
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
              'On `strct-tree`: data-driven node list (`{ label; icon?; badge?; active?; expanded?; children?; data? }`). When set, projected content is ignored and the tree recurses itself.',
          },
          {
            name: 'nodeMenu',
            type: '(node) => StrctMenuItem[]',
            default: 'null',
            description:
              'On `strct-tree`: resolver that returns the right-click menu items for a given node. The tree wires a `[strctContextMenu]` trigger on every node row; nodes whose result is empty open no menu.',
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
            description: 'On `strct-tree-node`: status dot on the icon (ok / warn / crit / off …).',
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
        lead: 'An overlay dialog with two-way `open`, backdrop and Escape dismiss, and a focus trap that restores focus on close. Project the footer through `strctModalFooter`.',
        inputs: [
          {
            name: 'open',
            type: 'boolean',
            default: 'false',
            description: 'Two-way open state (`[(open)]`).',
          },
          {
            name: 'title',
            type: 'string',
            default: `''`,
            description: 'Header title (also the aria-labelledby target).',
          },
          {
            name: 'size',
            type: `'sm' | 'md' | 'lg'`,
            default: `'md'`,
            description: 'Dialog width.',
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
            default: 'true',
            description: 'Allow closing via backdrop click / Escape.',
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
        id: 'dropdown',
        title: 'Dropdown',
        selector: 'strct-dropdown',
        importNames: ['StrctDropdown', 'StrctDropdownItem'],
        summary: 'Click-to-open menu.',
        lead: 'A click-to-open menu that closes on outside click. Mark the trigger with `strctDropdownTrigger`; project `strct-dropdown-item` entries (which can be `critical` or `disabled`).',
        inputs: [
          {
            name: 'align',
            type: `'start' | 'end'`,
            default: `'start'`,
            description: 'Which edge the menu aligns to.',
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
        a11y: ['Closes on outside click and Escape; the menu escapes overflow clipping.'],
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
    ],
  },
  {
    id: 'data',
    label: 'Data',
    icon: 'chart',
    loadExamples: () => import('../pages/data.page').then((m) => m.DataPage),
    components: [
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
        ],
        outputs: [
          {
            name: 'selectionChange',
            type: 'StrctRow[]',
            description: 'Emits the selected rows when selection changes.',
          },
          {
            name: 'syncChange',
            type: 'void',
            description: 'Emitted when the refresh button is clicked.',
          },
        ],
        methods: [
          {
            name: 'sortBy(key)',
            type: '(key: string) => void',
            description: 'Toggle sort on a column (asc → desc → none).',
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
        importNames: ['StrctChart'],
        summary: 'Line or filled area chart.',
        lead: 'A line or filled area chart for time series, driven by plain data arrays. Set `type` to `line` or `area`.',
        inputs: [
          { name: 'data', type: 'number[]', description: 'Series values. Required.' },
          {
            name: 'type',
            type: `'line' | 'area' | 'bar'`,
            default: `'line'`,
            description: 'Chart style.',
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
            name: 'max',
            type: 'number | null',
            default: 'null',
            description: 'Fixed Y maximum; null auto-scales.',
          },
        ],
        do: ['Use for continuous time-series data.'],
        dont: ['Do not use a line chart for unordered categories — use bars.'],
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
        summary: 'Proportional ring chart.',
        lead: 'A donut chart for parts of a whole, with an optional center label/value. Segments are `{ value; label }`.',
        inputs: [
          {
            name: 'segments',
            type: 'StrctDonutSegment[]',
            description: '`{ value; label; ... }[]`. Required.',
          },
          { name: 'size', type: 'number', default: '120', description: 'Diameter in pixels.' },
          { name: 'thickness', type: 'number', default: '14', description: 'Ring stroke width.' },
          {
            name: 'centerValue',
            type: 'string | number',
            default: `''`,
            description: 'Big value in the middle.',
          },
          {
            name: 'centerLabel',
            type: 'string',
            default: `''`,
            description: 'Caption under the center value.',
          },
        ],
        do: ['Use for a small number of segments (2–5).'],
        dont: ['Do not use a donut for many slivers — a bar chart reads better.'],
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
          { name: 'label', type: 'string', default: `''`, description: 'Caption under the value.' },
          { name: 'size', type: 'number', default: '120', description: 'Diameter in pixels.' },
          { name: 'thickness', type: 'number', default: '12', description: 'Arc stroke width.' },
        ],
        do: ['Switch status with thresholds to flag warning / critical levels.'],
        dont: ['Do not use a gauge for multi-series data.'],
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

export const COMPONENT_COUNT = ALL_COMPONENTS.length;

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
  ],
};
