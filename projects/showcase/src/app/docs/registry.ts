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

const STATUS_VALUES = `'neutral' | 'accent' | 'success' | 'warning' | 'danger'`;

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
          { name: 'variant', type: `'primary' | 'danger' | 'outline' | 'flat' | 'neutral'`, default: `'neutral'`, description: 'Emphasis level. Primary/danger tint the border and text; outline/flat are neutral.' },
          { name: 'size', type: `'md' | 'sm' | 'mini'`, default: `'md'`, description: 'Control height and padding.' },
          { name: 'solid', type: 'boolean', default: 'false', description: 'Opt in to a filled surface. Use sparingly, for the single primary action.' },
          { name: 'block', type: 'boolean', default: 'false', description: 'Stretch to the full width of the container.' },
          { name: 'iconOnly', type: 'boolean', default: 'false', description: 'Square padding for a single-icon button. Pair with aria-label.' },
        ],
        do: [
          'Use exactly one primary (or solid) button per view to signal the main action.',
          'Give icon-only buttons an aria-label so they are announced.',
          'Reach for danger only on destructive actions.',
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
        a11y: ['The host carries role="group"; label it with aria-label when the grouping is not obvious.'],
      },
      {
        id: 'speeddial',
        title: 'Speed dial',
        selector: 'strct-speed-dial',
        importNames: ['StrctSpeedDial'],
        summary: 'Floating action button that fans out to reveal actions.',
        lead: 'A floating action button that expands to reveal a set of actions in one of four directions. Project icon buttons (optionally with `strctTooltip`) as the actions. Closes on outside click or Escape.',
        inputs: [
          { name: 'icon', type: 'string', default: `'ellipsis'`, description: 'Glyph shown on the trigger; rotates 45° when open.' },
          { name: 'direction', type: `'up' | 'down' | 'left' | 'right'`, default: `'up'`, description: 'Direction the actions fan out.' },
        ],
        methods: [
          { name: 'toggle()', type: '() => void', description: 'Programmatically open or close the dial.' },
        ],
        do: ['Keep the action count small (2–5).', 'Add a tooltip to each action so its purpose is clear.'],
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
          { name: 'status', type: STATUS_VALUES, default: `'neutral'`, description: 'Semantic color.' },
          { name: 'solid', type: 'boolean', default: 'false', description: 'Filled style with uniform edges (no left rail).' },
        ],
        do: ['Use semantic status to mirror real state (success = healthy, danger = failed).', 'Keep the label to a single short word.'],
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
          { name: 'status', type: STATUS_VALUES, default: `'neutral'`, description: 'Semantic color.' },
          { name: 'removable', type: 'boolean', default: 'false', description: 'Show a trailing remove button.' },
        ],
        outputs: [
          { name: 'removed', type: 'void', description: 'Fired when the remove button is clicked.' },
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
          { name: 'src', type: 'string', default: `''`, description: 'Image URL. Falls back to initials when empty.' },
          { name: 'name', type: 'string', default: `''`, description: 'Full name; used for initials and the title tooltip.' },
          { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Avatar diameter.' },
          { name: 'status', type: `'none' | 'online' | 'busy' | 'offline'`, default: `'none'`, description: 'Presence dot.' },
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
          { name: 'value', type: 'number', default: '0', description: 'Percentage 0–100 (clamped).' },
          { name: 'status', type: `'accent' | 'success' | 'warning' | 'danger'`, default: `'accent'`, description: 'Fill color.' },
        ],
        do: ['Switch to warning / danger as usage crosses your thresholds.'],
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
          { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Ring diameter.' },
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
      { id: 'input', title: 'Input', selector: 'input[strctInput], textarea[strctInput], select[strctInput]', importNames: ['StrctInput'], summary: 'Shared field style for native inputs.', lead: 'A directive that applies the shared control style to native input, textarea and select elements — no wrapper component, full native behaviour and form integration.' },
      { id: 'textarea', title: 'Textarea', selector: 'textarea[strctInput]', importNames: ['StrctInput'], summary: 'Multi-line, vertically resizable text field.', lead: 'The same strctInput directive on a textarea, vertically resizable.' },
      { id: 'select', title: 'Select', selector: 'select[strctInput]', importNames: ['StrctInput'], summary: 'Native select with a custom chevron.', lead: 'A native select styled with strctInput and a custom chevron, keeping native keyboard and accessibility behaviour.' },
      { id: 'checkbox', title: 'Checkbox', selector: 'strct-checkbox', importNames: ['StrctCheckbox'], summary: 'Custom checkbox with form binding.', lead: 'A custom-drawn checkbox that is ControlValueAccessor-compatible, so it works with ngModel and reactive forms.' },
      { id: 'toggle', title: 'Toggle', selector: 'strct-toggle', importNames: ['StrctToggle'], summary: 'On / off switch.', lead: 'A binary on/off switch, ControlValueAccessor-compatible.' },
      { id: 'radio', title: 'Radio group', selector: 'strct-radio-group, strct-radio', importNames: ['StrctRadioGroup', 'StrctRadio'], summary: 'Single choice from a set.', lead: 'A radio group for a single choice from a small set; bind the group with ngModel.' },
      { id: 'range', title: 'Slider', selector: 'strct-range', importNames: ['StrctRange'], summary: 'Range input with a filled track.', lead: 'A range slider with a filled track and an optional live value readout.' },
      { id: 'combobox', title: 'Combobox', selector: 'strct-combobox', importNames: ['StrctCombobox'], summary: 'Type to filter, click to select.', lead: 'A filterable single-select: type to narrow the list, click to choose. ControlValueAccessor-compatible.' },
      { id: 'datepicker', title: 'Date picker', selector: 'strct-datepicker', importNames: ['StrctDatepicker'], summary: 'Calendar popover; ISO date value.', lead: 'A calendar popover whose value is an ISO date string.' },
      { id: 'password', title: 'Password', selector: 'strct-password', importNames: ['StrctPassword'], summary: 'Reveal toggle and optional strength meter.', lead: 'A password field with a show/hide toggle and an optional strength meter.' },
      { id: 'file', title: 'File upload', selector: 'strct-file', importNames: ['StrctFile'], summary: 'Drag-and-drop or browse; File[] value.', lead: 'A drag-and-drop or browse file field whose value is a File array.' },
      { id: 'colorpicker', title: 'Color picker', selector: 'strct-color-picker', importNames: ['StrctColorPicker'], summary: 'Preset swatches plus a hex field.', lead: 'A color picker with preset swatches and a hex input; value is a #rrggbb string.' },
      { id: 'cascade', title: 'Cascade select', selector: 'strct-cascade-select', importNames: ['StrctCascadeSelect'], summary: 'Pick a leaf from nested groups.', lead: 'Selects a leaf value from nested groups — e.g. a port group under a virtual switch.' },
      { id: 'rating', title: 'Rating', selector: 'strct-rating', importNames: ['StrctRating'], summary: 'Star rating with clear-on-repeat.', lead: 'A star rating control; click the active star again to clear.' },
      { id: 'chips', title: 'Chips', selector: 'strct-chips', importNames: ['StrctChips'], summary: 'Free-text tags; string[] value.', lead: 'Free-text tag entry: type and press Enter to add, Backspace to remove the last. Value is a string array.' },
      { id: 'otp', title: 'Input OTP', selector: 'strct-input-otp', importNames: ['StrctInputOtp'], summary: 'One-time-password boxes.', lead: 'Segmented one-time-password boxes with auto-advance, backspace and paste support.' },
      { id: 'knob', title: 'Knob', selector: 'strct-knob', importNames: ['StrctKnob'], summary: 'Rotary dial — drag, keys or scroll.', lead: 'A rotary dial adjustable by drag, arrow keys or scroll. ControlValueAccessor-compatible.' },
      { id: 'inputmask', title: 'Input mask', selector: 'strct-input-mask', importNames: ['StrctInputMask'], summary: 'Formatted entry with mask tokens.', lead: 'Formatted text entry. Tokens: 9 = digit, A = letter, * = alphanumeric, H = hex; everything else is a literal.' },
    ],
  },
  {
    id: 'surfaces',
    label: 'Surfaces',
    icon: 'sidebar',
    loadExamples: () => import('../pages/surfaces.page').then((m) => m.SurfacesPage),
    components: [
      { id: 'card', title: 'Card', selector: 'strct-card', importNames: ['StrctCard', 'StrctCardHeader', 'StrctCardBlock', 'StrctCardFooter'], summary: 'Container composed of header / block / footer.', lead: 'A surface container composed from header, block and footer pieces, each reading from the shared token layer.' },
      { id: 'accordion', title: 'Accordion', selector: 'strct-accordion', importNames: ['StrctAccordion', 'StrctAccordionPanel'], summary: 'Independently collapsible panels.', lead: 'A stack of independently collapsible panels; each manages its own expanded state.' },
      { id: 'tabs', title: 'Tabs', selector: 'strct-tabs', importNames: ['StrctTabs', 'StrctTab'], summary: 'Tabbed content from projected children.', lead: 'A tab group built from projected strct-tab children, with optional disabled tabs.' },
      { id: 'tree', title: 'Tree', selector: 'strct-tree', importNames: ['StrctTree', 'StrctTreeNode'], summary: 'Nested, expandable nodes with icons.', lead: 'Nested, expandable nodes with optional icons and active state.' },
      { id: 'modal', title: 'Modal', selector: 'strct-modal', importNames: ['StrctModal'], summary: 'Overlay dialog with focus trap.', lead: 'An overlay dialog with two-way open, backdrop and Escape dismiss, and a focus trap that restores focus on close.' },
      { id: 'dropdown', title: 'Dropdown', selector: 'strct-dropdown', importNames: ['StrctDropdown', 'StrctDropdownItem'], summary: 'Click-to-open menu.', lead: 'A click-to-open menu that closes on outside click; items can be marked danger.' },
      { id: 'wizard', title: 'Wizard', selector: 'strct-wizard', importNames: ['StrctWizard', 'StrctStep'], summary: 'Multi-step flow with Back / Next / Finish.', lead: 'A multi-step flow with built-in Back / Next / Finish controls and a finished output.' },
      { id: 'divider', title: 'Divider', selector: 'strct-divider', importNames: ['StrctDivider'], summary: 'Separator rule, optional label, vertical mode.', lead: 'A separator rule, optionally with a centered label or in vertical inline mode.' },
    ],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    icon: 'compass',
    loadExamples: () => import('../pages/navigation.page').then((m) => m.NavigationPage),
    components: [
      { id: 'breadcrumb', title: 'Breadcrumb', selector: 'strct-breadcrumb', importNames: ['StrctBreadcrumb', 'StrctBreadcrumbItem'], summary: 'Hierarchical location trail.', lead: 'A trail of links showing the current location within a hierarchy.' },
      { id: 'pagination', title: 'Pagination', selector: 'strct-pagination', importNames: ['StrctPagination'], summary: 'Page navigation for long lists.', lead: 'Page navigation for long lists, with previous / next and numbered pages.' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    icon: 'chart',
    loadExamples: () => import('../pages/data.page').then((m) => m.DataPage),
    components: [
      { id: 'table', title: 'Table', selector: 'strct-table', importNames: ['StrctTable'], summary: 'Lightweight styled table.', lead: 'A lightweight, token-styled table for simple tabular data.' },
      { id: 'datagrid', title: 'Datagrid', selector: 'strct-datagrid', importNames: ['StrctDatagrid'], summary: 'Selectable, expandable data grid.', lead: 'A richer grid with selection, batch actions, expandable rows and an optional single-column detail pane.' },
      { id: 'detailpane', title: 'Detail pane', selector: 'strct-datagrid', importNames: ['StrctDatagrid', 'StrctRowDetailDef'], summary: 'Collapse the grid to a master / detail view.', lead: 'A datagrid mode that collapses the table to its first column and opens a side detail pane for the active row.' },
      { id: 'timeline', title: 'Timeline', selector: 'strct-timeline', importNames: ['StrctTimeline', 'StrctTimelineItem'], summary: 'Vertical sequence of events.', lead: 'A vertical sequence of dated events with semantic markers.' },
      { id: 'stack', title: 'Stack view', selector: 'strct-stack', importNames: ['StrctStack', 'StrctStackItem'], summary: 'Key / value detail list.', lead: 'A label / value list for read-only object details.' },
    ],
  },
  {
    id: 'charts',
    label: 'Charts',
    icon: 'gauge',
    loadExamples: () => import('../pages/charts.page').then((m) => m.ChartsPage),
    components: [
      { id: 'sparkline', title: 'Sparkline', selector: 'strct-sparkline', importNames: ['StrctSparkline'], summary: 'Tiny inline trend line.', lead: 'A tiny inline trend line for at-a-glance metrics.' },
      { id: 'line', title: 'Line & area', selector: 'strct-chart', importNames: ['StrctChart'], summary: 'Line or filled area chart.', lead: 'A line or filled area chart for time series, driven by plain data arrays.' },
      { id: 'bar', title: 'Bar', selector: 'strct-chart', importNames: ['StrctChart'], summary: 'Bar chart for categorical data.', lead: 'A bar chart for categorical comparisons.' },
      { id: 'donut', title: 'Donut', selector: 'strct-donut', importNames: ['StrctDonut'], summary: 'Proportional ring chart.', lead: 'A donut chart for showing parts of a whole.' },
      { id: 'gauge', title: 'Gauge', selector: 'strct-gauge', importNames: ['StrctGauge'], summary: 'Single-value radial gauge.', lead: 'A radial gauge for a single bounded value.' },
    ],
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: 'bell',
    loadExamples: () => import('../pages/feedback.page').then((m) => m.FeedbackPage),
    components: [
      { id: 'alert', title: 'Alert', selector: 'strct-alert', importNames: ['StrctAlert'], summary: 'Inline semantic banner.', lead: 'An inline banner for contextual messages, in four semantic tones.' },
      { id: 'tooltip', title: 'Tooltip', selector: '[strctTooltip]', importNames: ['StrctTooltip'], summary: 'Hover / focus hint directive.', lead: 'A directive that shows a small hint on hover or focus. Renders into the body so it escapes overflow and transform clipping.' },
      { id: 'signpost', title: 'Signpost', selector: 'strct-signpost', importNames: ['StrctSignpost'], summary: 'Click-triggered explanatory popover.', lead: 'A click-triggered popover for richer inline help than a tooltip.' },
      { id: 'toast', title: 'Toast', selector: 'strct-toast-outlet', importNames: ['StrctToastOutlet', 'StrctToastService'], summary: 'Transient notifications via a service.', lead: 'Transient notifications raised from a service and rendered by a single outlet placed near the app root.' },
      { id: 'skeleton', title: 'Skeleton', selector: 'strct-skeleton', importNames: ['StrctSkeleton'], summary: 'Loading placeholder shapes.', lead: 'Animated placeholder shapes shown while content loads.' },
    ],
  },
  {
    id: 'patterns',
    label: 'Patterns',
    icon: 'grid',
    loadExamples: () => import('../pages/patterns.page').then((m) => m.PatternsPage),
    components: [
      { id: 'login', title: 'Login', selector: 'strct-login', importNames: ['StrctLogin'], summary: 'Centered or split login scaffold.', lead: 'A login page scaffold in centered or split layouts, with a decorative aside panel.' },
      { id: 'contextmenu', title: 'Context menu', selector: 'strct-context-menu', importNames: ['StrctContextMenu', 'StrctSubmenu'], summary: 'Right-click menu with submenus.', lead: 'A right-click context menu supporting nested submenus, icons and dividers.' },
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
