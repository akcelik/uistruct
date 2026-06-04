export interface NavComponent {
  /** Fragment id used to scroll to the demo on its page. */
  id: string;
  label: string;
}

export interface NavCategory {
  id: string;
  route: string;
  label: string;
  /** strct-icon name. */
  icon: string;
  items: NavComponent[];
}

/** Drives the sidebar (icon strip + tree) and is the single source of truth
 *  for which demos exist. */
export const NAV: NavCategory[] = [
  {
    id: 'overview',
    route: 'overview',
    label: 'Overview',
    icon: 'palette',
    items: [
      { id: 'palettes', label: 'Palettes & themes' },
      { id: 'tokens', label: 'Color tokens' },
    ],
  },
  {
    id: 'icons',
    route: 'icons',
    label: 'Icons',
    icon: 'hexagon',
    items: [
      { id: 'gallery', label: 'Icon set' },
      { id: 'states', label: 'Object states' },
      { id: 'vendors', label: 'Vendors' },
    ],
  },
  {
    id: 'controls',
    route: 'controls',
    label: 'Controls',
    icon: 'layers',
    items: [
      { id: 'button', label: 'Button' },
      { id: 'buttongroup', label: 'Button group' },
      { id: 'speeddial', label: 'Speed dial' },
      { id: 'badge', label: 'Badge' },
      { id: 'tag', label: 'Tag' },
      { id: 'avatar', label: 'Avatar' },
      { id: 'progress', label: 'Progress' },
      { id: 'spinner', label: 'Spinner' },
    ],
  },
  {
    id: 'forms',
    route: 'forms',
    label: 'Forms',
    icon: 'form',
    items: [
      { id: 'input', label: 'Input' },
      { id: 'textarea', label: 'Textarea' },
      { id: 'select', label: 'Select' },
      { id: 'checkbox', label: 'Checkbox' },
      { id: 'toggle', label: 'Toggle' },
      { id: 'radio', label: 'Radio group' },
      { id: 'range', label: 'Slider' },
      { id: 'combobox', label: 'Combobox' },
      { id: 'datepicker', label: 'Date picker' },
      { id: 'password', label: 'Password' },
      { id: 'file', label: 'File upload' },
      { id: 'colorpicker', label: 'Color picker' },
      { id: 'cascade', label: 'Cascade select' },
      { id: 'rating', label: 'Rating' },
      { id: 'chips', label: 'Chips' },
      { id: 'otp', label: 'Input OTP' },
    ],
  },
  {
    id: 'surfaces',
    route: 'surfaces',
    label: 'Surfaces',
    icon: 'sidebar',
    items: [
      { id: 'card', label: 'Card' },
      { id: 'accordion', label: 'Accordion' },
      { id: 'tabs', label: 'Tabs' },
      { id: 'tree', label: 'Tree' },
      { id: 'modal', label: 'Modal' },
      { id: 'dropdown', label: 'Dropdown' },
      { id: 'wizard', label: 'Wizard' },
      { id: 'divider', label: 'Divider' },
    ],
  },
  {
    id: 'navigation',
    route: 'navigation',
    label: 'Navigation',
    icon: 'compass',
    items: [
      { id: 'breadcrumb', label: 'Breadcrumb' },
      { id: 'pagination', label: 'Pagination' },
    ],
  },
  {
    id: 'data',
    route: 'data',
    label: 'Data',
    icon: 'chart',
    items: [
      { id: 'table', label: 'Table' },
      { id: 'datagrid', label: 'Datagrid' },
      { id: 'detailpane', label: 'Detail pane' },
      { id: 'timeline', label: 'Timeline' },
      { id: 'stack', label: 'Stack view' },
    ],
  },
  {
    id: 'charts',
    route: 'charts',
    label: 'Charts',
    icon: 'gauge',
    items: [
      { id: 'sparkline', label: 'Sparkline' },
      { id: 'line', label: 'Line & area' },
      { id: 'bar', label: 'Bar' },
      { id: 'donut', label: 'Donut' },
      { id: 'gauge', label: 'Gauge' },
    ],
  },
  {
    id: 'feedback',
    route: 'feedback',
    label: 'Feedback',
    icon: 'bell',
    items: [
      { id: 'alert', label: 'Alert' },
      { id: 'tooltip', label: 'Tooltip' },
      { id: 'signpost', label: 'Signpost' },
      { id: 'toast', label: 'Toast' },
      { id: 'skeleton', label: 'Skeleton' },
    ],
  },
  {
    id: 'patterns',
    route: 'patterns',
    label: 'Patterns',
    icon: 'grid',
    items: [
      { id: 'login', label: 'Login' },
      { id: 'contextmenu', label: 'Context menu' },
    ],
  },
];

/** Total number of documented components (excludes the overview pseudo-items). */
export const COMPONENT_COUNT = NAV.filter((c) => c.id !== 'overview').reduce(
  (sum, c) => sum + c.items.length,
  0,
);
