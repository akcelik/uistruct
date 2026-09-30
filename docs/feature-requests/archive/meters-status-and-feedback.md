# FR-48-18 … 23 — Meters, status and feedback

> **FR-48-18 and FR-48-20 SHIPPED in 4.6.0 (2026-09-29)** — the two this document holds that the
> audit ranked highest. Progress gained meter mode (visible label / value / caption, segments,
> indeterminate, a neutral tone); the spinner gained a visible caption; the empty state gained
> `size="sm"` and a `loading` variant.
>
> Measured in Chrome with the motion preference emulated both ways, which caught a real defect on
> the way: the reduced-motion striped fill was being outranked by the tone rule
> (`.strct-progress--neutral .strct-progress__fill`), so it never painted. Headless Chrome also
> emulates `reduce` by default, so the first reading showed no animation in either mode.
>
> **FR-48-19, 21 and 22 SHIPPED in 4.14.0 (2026-09-29)** — `pulse` and the new
> `strct-live-indicator`; the metric tile's `href` / `interactive` / `captionStatus` /
> `[strctMetricMeter]`; the alert's `icon` override and its inner row.
>
> Measured in Chrome, with the motion preference emulated both ways: the pulsing dot runs
> `strct-dot-pulse` for 1s and stays **10×10 — the same size as a plain dot**, so the halo moves
> and the dot does not; under `reduce` the animation is `none` and the halo is a static 3px ring.
> The indicator reads "Live · updates every 5 s", "Connecting…", "Reconnecting…", "Paused" and
> "Last updated 3 min ago" with success / accent / warning / neutral / warning dots, and only the
> live one pulses.
>
> The tile's hit area measures **189×115 against a 189×115 tile** — it covers the border, not just
> the padding box — Tab lands on it with `:focus-visible` and a 2px accent ring, its name is
> "Alarms: 7", the caption tone leaves the value neutral, and a projected meter sits between the
> value and the caption.
>
> The alert is `display: block` with a flex row inside: with an inline `display: block; margin-top:
8px` — the override 124 alerts in the app carry — the icon still sits beside the text.
>
> **FR-48-23 SHIPPED in 4.15.0 (2026-09-29)** — the new `strct-legend`, plus the donut's
> `legendPosition` and `keepEmpty`.
>
> Measured in Chrome: the three swatch shapes render as a 14×2 line, a 14×2 dashed line and a 9×9
> dot, the palette colours resolve (`--chart-1` blue, `--chart-4` amber) and the status ones too;
> a zero category keeps its row at 0.55 opacity; an interactive row is a toggle button that flips
> to `aria-pressed="false"`, goes to 0.45 opacity with a line-through, and reports "off: Memory".
> The donut's legend sits under the ring with `legendPosition="below"`, beside it otherwise, and
> `keepEmpty="false"` drops the zero row (3 rows → 2).
>
> Two notes on the proposal. `status: 'accent'` maps to `--acc`, not `--accent` — the first
> reading showed the swatch falling back to muted grey, which is how the mapping bug was caught.
> And `keepEmpty` defaults to **true**: the library's donut already keeps a zero row (it is the
> app's own legend that dropped it), so keeping is the existing behaviour and the input is the
> opt-out rather than the opt-in.
>
> **Every ask in this document has shipped.**

**From:** HyperStruct · **Version:** 4.4.0. Part of [hyperstruct-hand-built-audit.md](../hyperstruct-hand-built-audit.md).

---

## FR-48-18 — `strct-progress`: meter mode

### Rule

**A capacity bar says what it measures and how much, next to the bar, and it can show more than one thing.** Examples
are "Memory 293 GB of 512 GB — 219 GB free across 2 nodes" and "used now, plus what would arrive if this host failed".
A running task with no percentage is still visibly running.

### What the app does today

`strct-progress` renders only the track. `label` is aria-only, the status tones start at `accent`, and it takes one
value. Every capacity screen in HyperStruct therefore wraps it or replaces it:

- **Visible label, value and caption:**
  - object-detail/overview-parts.ts:84–97 `.res / .t / .num / .n` (the capacity rows on every Overview, styled in
    overview-cards.css:29–53); also :526 `.mem .lbl`, :862 and :880 `.vol`;
  - administration/appliance-health.ts:89–96 `.hl-util / .hl-bar / .hl-pct`;
  - core/ui/host-status-cell.ts:51, where the CPU % sits beside the bar in every host grid;
  - dashboard.ts:591 `.hs`.
- **Indeterminate, with a neutral tone:** shell/recent-tasks.ts:192 `.rt-prog / .rt-track / .rt-fill`. It has its own
  tones (ok, bad, warn, run, idle), an `.indet` sweep animation for tasks that report no percentage, and `.rt-pct`
  text.
- **Two values:**
  - object-detail/host-failover.ts:47 `.bar .used` plus `.arriving` stacks what a host already runs and what would land
    on it;
  - dynamic-optimization-dialog.ts:57 `.do-bar-fill` plus `.do-bar-proj` shows current against projected load.

### Proposed API

```ts
// strct-progress (additions; defaults = 4.4.0)
readonly showValue = input(false, { transform: booleanAttribute });     // renders valueText (default `${value}%`) at the row's end
readonly valueText = input<string>('');                                 // e.g. "293 GB of 512 GB"
readonly caption = input('');                                           // a line under the bar, --t3
readonly visibleLabel = input(false, { transform: booleanAttribute });  // renders `label` above the bar, not only for aria
readonly indeterminate = input(false, { transform: booleanAttribute });
readonly segments = input<{ value: number; status?: StrctStatus; label?: string }[] | null>(null);
// status gains 'neutral' (StrctProgressStatus → StrctStatus)
```

- **Layout** (with `visibleLabel` or `showValue`): the label is at the start and the value at the end, on one row above
  the track, followed by the caption.
- **`segments`.** Stacks fills in order, and their sum is clamped to 100. Each segment gets its tone and appears in the
  accessible text ("Used 61%, arriving 22%").
- **`indeterminate`.** Draws a sweeping fill and leaves out `aria-valuenow`; under `prefers-reduced-motion` it is a
  static striped fill.
- **`status: 'neutral'`.** Uses `--t3` for the fill: queued, idle, unknown.

### Accessibility

The element is `role="progressbar"`. `aria-valuetext` is `valueText` when given, and `label` stays the accessible name
whether visible or not. Segments are joined into `aria-valuetext`.

### Acceptance

1. `<strct-progress [value]="57" label="Memory" visibleLabel showValue valueText="293 GB of 512 GB" caption="219 GB
free across 2 nodes" />` renders today's Overview capacity row with no consumer CSS.
2. `[segments]="[{value:61,status:'accent'},{value:22,status:'warning'}]"` stacks two fills.
3. `indeterminate` sweeps, and is static under reduced motion.
4. Defaults are unchanged.

---

## FR-48-19 — `strct-status-dot pulse`, and a live / last-updated indicator

### Rule

**Something happening now pulses once a second; something that should be live and is not says so.** A dot that is live
and a dot that is merely green are different facts. "Live · updates every 5 s" and "Reconnecting…" are states of one
indicator, not three captions.

### What the app does today

- **Pulsing dots** with their own `@keyframes`:
  - shell/recent-tasks.ts:99 `.rt-dot` (a task running);
  - login.html:40 `.auth-status__dot`;
  - object-detail/host-monitor-view.ts:174 `.mon-dot` and :189 `.mon-livedot` (live charts).
- **Live captions** in plain text:
  - administration/appliance-ha.ts:271 `.ha-cap` ("Live · updates every 5 s");
  - :88 `.ha-reconnect` ("↻ Reconnecting…", at 0.85 opacity);
  - appliance-health.ts:135 `.hl-foot`.
- **Existing precedent.** `strct-hero` has a `live` input, but only for the hero.

### Proposed API

```ts
// strct-status-dot (addition)
readonly pulse = input(false, { transform: booleanAttribute });
```

```html
<strct-live-indicator state="live" [updatedAt]="lastRead" [interval]="5000" />
<!-- state: 'live' | 'connecting' | 'reconnecting' | 'paused' | 'stale' -->
```

- **`strct-live-indicator` (new, small).**
  - A pulsing success dot plus "Live" or "Live · updates every 5 s" when `live`.
  - A warning dot plus "Reconnecting…" when `reconnecting`.
  - A neutral dot plus "Paused" when `paused`.
  - A warning dot plus "Last updated 3 min ago" when `stale` (relative time from `updatedAt`, re-rendered every 30 s).
- **Localisation.** All strings are inputs, in a `labels` object.
- **Motion.** Under `prefers-reduced-motion` the pulse is a static ring.

### Accessibility

The indicator is `role="status"` with polite announcements on state change only, never on each tick.

### Acceptance

`pulse` animates the dot's halo and not its size. The live indicator switches wording and tone by `state`, and
announces "Reconnecting" once.

---

## FR-48-20 — `strct-spinner` visible caption; `strct-empty-state` compact size and loading variant

### Rule

**Waiting and emptiness are said in words, at the size of the place they fill.** A card that is still reading says
"Reading…" beside a small spinner. A 240px frame with nothing in it says so in one line, without a 56px icon chip.

### What the app does today

About 70 loading and empty states are plain text, because the components are either aria-only or page-sized:

- **Reading…** object-detail.html:216, :234 and :329; mvs-overview-cards.ts:94; tags-card.ts:58;
  host-monitor-view.ts:330 `.mon-load`.
- **Loading…** administration: alarms-view:188, appliance-ha:275, appliance-license:104, appliance-logs:132,
  roles:221 … (25 in 20 files).
- **One-line empty states:** custom-attributes-card.ts:93, alarms-bell.ts:62, drift-indicator.ts:54,
  host-profiles.ts:156.
- **Placeholders too small for `strct-empty-state`:** the console thumbnail (vm-console.ts:74).

`strct-spinner.label` is announced but not shown. `strct-empty-state` has 40px padding, a 56px icon chip, and no size
input.

### Proposed API

```ts
// strct-spinner
readonly caption = input('');            // visible text beside the spinner (also the accessible name when set)
// strct-empty-state
readonly size = input<'md' | 'sm'>('md'); // sm: inline row — 16px icon, title and description on one line, --space-3 padding
// StrctEmptyVariant gains 'loading' — the icon chip becomes a spinner, the title defaults to "Loading…"
```

### Accessibility

A spinner with `caption` is `role="status"` with the caption as its text. The empty state's `loading` variant is
`aria-busy="true"`.

### Acceptance

`<strct-spinner size="sm" caption="Reading the host's switches…" />` renders inline at text height.
`<strct-empty-state size="sm" icon="tag" title="No tags" />` is one 32px-high row. Defaults are unchanged.

---

## FR-48-21 — `strct-metric-tile`: interactive / link, caption tone, meter slot

### Rule

**A KPI you can drill into is a link, a caption can carry the warning, and a tile may show its number over a bar.**

### What the app does today

- **Link.** dashboard.ts:446 `a.kpi` wraps every Home KPI tile in an anchor, adding the radius and focus ring. The
  tile has no link or `interactive` input, though `strct-card` has one.
- **Caption tone.** estate-overview-cards.ts:140 `.stats` uses its own tiles, because `status` tints the value and not
  the caption: "2 down" is the warning, and 14 nodes is not.
- **Meter.** vm-settings.ts:528 and :588 `.hero__big` put a 40px number above a `strct-progress` in a bordered box.
  csv-panel.ts:93 puts a 26px percentage above "X of Y used".

### Proposed API

```ts
// strct-metric-tile (additions)
readonly interactive = input(false, { transform: booleanAttribute });   // pointer, hover, focus ring, (activated)
readonly href = input<string | null>(null);                             // renders the tile as <a href>; routerLink via a host directive
readonly activated = output<void>();
readonly captionStatus = input<StrctStatus | null>(null);               // tints the caption; null = --t3
```

`[strctMetricMeter]` is projected under the value and above the caption (for example a `strct-progress`).

### Acceptance

`<strct-metric-tile href="/alarms" …>` is a link with the tile's look and a visible focus ring.
`captionStatus="warning"` tints only the caption. A projected meter sits under the value.

---

## FR-48-22 — `strct-alert`: an `icon` override, and a layout that survives a host `display`

### Rule

**An alert's icon says what kind of note it is when the tone alone does not:** a lock for a locked setting, a shield
for a security note. Setting the host's `display` for spacing must not break the layout.

### What the app does today

- **Custom icons.** Note boxes built by hand only so they can show a lock, shield or filter icon:
  webhooks-view.ts:183 and :223 `.whf-note`; identity-sources.ts:279 and :331; domain-services.ts:243; and
  backup-keys.ts:108. `strct-alert` computes its icon from `type`.
- **Host `display` overrides.** 124 `strct-alert`s in HyperStruct carry an inline `style="display:block; margin…"` (60
  in administration, 3 on the login page). `.strct-alert` is `display:flex` with an inline-flex icon and a block body,
  so the override puts the icon on its own line above the text. HyperStruct is removing those styles. The library can
  make the component immune to this too.

### Proposed API

```ts
readonly icon = input<string | null>(null);   // null = derived from type, as today
```

Layout moves to an inner element. The host becomes `display:block` by default, and
`<div class="strct-alert__row">` carries the flex. A consumer's `display:block` or margins then no longer change the
arrangement.

### Acceptance

`<strct-alert type="info" icon="lock">` shows a lock. `<strct-alert style="display:block;margin-top:8px">` renders its
icon beside the text. Default rendering is unchanged.

---

## FR-48-23 — `strct-legend` (new); `strct-donut` legend below the ring and zero rows

### Rule

**A chart's key is a component.** The same swatch, label and value rows serve a line chart's series picker, a diagram's
edge styles and a donut's categories. A category with zero items still appears in the key, because "0 failed" is
information.

### What the app does today

- object-detail/host-monitor-view.ts:258 and :386 `.mon-sw`: 9px squares with an inline background, keying the
  series.
- object-detail/mvs-topology.ts:146–161 `.legend / .sw / .dot`: line swatches (solid, dashed, animated) and dots for the
  topology's edges and states.
- object-detail/overview-parts.ts:682–707 `.legend / .lg / .sw / .v`: donut legends under the ring, on Home and the
  datacenter Overview.
  - `strct-donut [legend]` puts the legend beside the ring.
  - It drops a zero-count row with its segment.

### Proposed API

```html
<strct-legend [items]="items" orientation="vertical" />
```

```ts
interface StrctLegendItem {
  label: string;
  value?: string | number;
  status?: StrctStatus;        // or
  color?: string;              // a chart palette colour (--c1…)
  shape?: 'square' | 'dot' | 'line' | 'dash';
  muted?: boolean;             // e.g. a zero row
}
readonly items = input.required<StrctLegendItem[]>();
readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
readonly interactive = input(false, { transform: booleanAttribute });   // rows toggle; (itemToggle) emits the label
```

```ts
// strct-donut (additions)
readonly legendPosition = input<'side' | 'below'>('side');
readonly keepEmpty = input(false, { transform: booleanAttribute });     // zero segments stay in the legend, muted
```

### Accessibility

The legend is a list (`role="list"`). With `interactive`, each row is a toggle button with `aria-pressed`.

### Acceptance

The topology legend (line, dash, dot shapes) and the donut-below layout render from the component. A zero row stays,
muted.
