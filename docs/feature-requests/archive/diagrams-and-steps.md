# FR-48-30 … 32 — Diagrams and steps

> **FR-48-30 and FR-48-32 SHIPPED in 4.18.0 (2026-09-29)** — the new `strct-steps` and
> `strct-change`.
>
> Measured in Chrome: the remediation run renders as an `<ol>` of 7 pills with the six states
> carrying their own tones (success green, accent, warning, muted, `--t4` outline), the skipped one
> struck through with its reason as the tooltip, exactly one `aria-current="step"`, and every step
> saying its state in words ("in progress"). The active pill's edge runs `strct-steps-pulse` and
> holds still at 0.5 opacity under `prefers-reduced-motion`. All four appearances render from the
> same data — pills, dots (labels hidden), vertical + numbered + dense, and cards with descriptions
> and a per-step action that fires ("ran Baseline"). `strct-change` reads "from v10.27 to v10.28"
> for assistive tech while the glyphs stay hidden, with the old value muted and the new one at
> weight 600.
>
> **FR-48-31 SHIPPED in 4.19.0 (2026-09-29)** — `layout="fan-out" | "tree"`, `edges`, `columns`,
> `nodes[].column` / `data`, and an `<ng-template strctFlowNode>`.
>
> Measured in Chrome: the blast-radius diagram renders as three labelled column groups (1 / 2 / 1
> nodes) with three orthogonal edges whose paths start at the source box's real right edge (x=141)
> and end at the target's left (x=189) — geometry measured from the boxes and re-measured on
> resize, not guessed — coloured success / success / critical with the third dashed, over an
> `aria-hidden` SVG whose viewBox matches the container (520×190). The topology renders as a tree
> of four depth-derived columns (1 / 2 / 2 / 1) with six edges, one animated. At a 400px container
> the columns stack, the SVG is `display: none` and each column takes a 2px rail. Chain mode is
> untouched, still `role="img"` with its one summary.
>
> **Every ask in this document has shipped.**

**From:** HyperStruct · **Version:** 4.4.0. Part of [hyperstruct-hand-built-audit.md](../hyperstruct-hand-built-audit.md).

---

## FR-48-30 — `strct-steps` (new): a read-only status stepper

### Rule

**A process the user watches, rather than drives, shows each step's state in order.** The user did not start each step
and cannot go back to one, so a wizard's rail is the wrong control. A timeline implies history, so it is wrong too.
Examples: an update run per host (Check → Download → Maintenance → Install → Restart → Verify → Back in service), and a
three-step method on a landing page (Baseline → Check → Remediate).

### What the app does today

- object-detail/updates/remediation-run.ts:270–287 `.steps / .step.done | .active | .failed | .skipped / .sep`: pills
  with tinted borders, connector lines, and "skipped" struck through. There is one row per host, so dozens are on
  screen during a cluster run.
- object-detail/updates/object-updates.ts:362–410: numbered process cards (`.steps / .step / .no`, a 22px accent-tinted
  circle, title, one line and an action).
- updates/remediate-wizard.ts:222–233: a numbered `<ol class="flow">`, "what happens, in order".

`strct-wizard` owns its steps' navigation, and `strct-timeline` is vertical and time-ordered. Neither shows
"skipped" or "blocked".

### Proposed API

```html
<strct-steps [steps]="steps" appearance="pills" [numbered]="false" />
```

```ts
interface StrctStepState {
  id: string;
  label: string;
  state: 'pending' | 'active' | 'done' | 'failed' | 'skipped' | 'blocked';
  description?: string;      // shown by the 'cards' appearance; the tooltip for 'pills'
}
readonly steps = input.required<StrctStepState[]>();
readonly appearance = input<'pills' | 'dots' | 'cards'>('pills');
readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
readonly numbered = input(false, { transform: booleanAttribute });
readonly dense = input(false, { transform: booleanAttribute });
```

- **Tones:**

  | State   | Tone                                       |
  | ------- | ------------------------------------------ |
  | done    | success                                    |
  | active  | accent, with a pulse unless reduced motion |
  | failed  | critical                                   |
  | blocked | warning                                    |
  | skipped | `--t3`, struck through                     |
  | pending | `--t4` outline                             |

- **`pills`.** Pills joined by a hairline, wrapping onto a second line when narrow.
- **`cards`.** Equal-width cards with number, label, description, and a `[strctStepAction]` slot per step (the three
  update cards).
- **Localisation.** State words for assistive technology are a labels object.

### Accessibility

The component is an ordered list (`<ol>`). Each item carries `aria-current="step"` when active, and a visually hidden
state word ("Install, failed").

### Acceptance

The remediation host row (7 pills, one active, one skipped) and the three numbered update cards render from
`strct-steps` with no consumer CSS. The active pill pulses, and is static under reduced motion.

---

## FR-48-31 — `strct-flow`: a fan-out layout and node templates

### Rule

**Infrastructure diagrams fan out.** One source feeds several targets; one switch has several hosts, each with its own
uplinks. A diagram node carries more than one line: chips, a bar, a count. `strct-flow` draws a straight chain of
one-line terminals.

### What the app does today

- **Blast radius.** object-detail/host-failover.ts:20–75 is the Host Overview's "If this host failed" diagram: a
  three-column flow, this host → lands on (N targets) → stays down. It is built from:
  - `.fo / .col / .head`, and tone-bordered boxes `.box--source | target | nowhere | quiet`;
  - a gradient connector `.line / .link`;
  - VM chips, and a stacked used-plus-arriving bar (FR-48-18);
  - a container query that stacks the columns when narrow.
- **Switch topology.** object-detail/mvs-topology.ts:22–144 is a hand-written SVG: switch → hosts → uplinks → network,
  with tinted tiles, SVG path icons and animated dashed edges. Layout is computed in mvs-topology.layout.ts.

`StrctFlowNode` has `label`, `sublabel`, `role` and `status`, laid out on one axis.

### Proposed API

```html
<strct-flow
  layout="fan-out"
  [nodes]="nodes"
  [edges]="edges"
  [columns]="['This host', 'Lands on', 'Stays down']"
>
  <ng-template strctFlowNode let-node>
    <strong>{{ node.label }}</strong>
    <strct-progress [segments]="node.bar" />
    @for (vm of node.vms; track vm) { <strct-tag mono>{{ vm }}</strct-tag> }
  </ng-template>
</strct-flow>
```

```ts
readonly layout = input<'chain' | 'fan-out' | 'tree'>('chain');         // chain = today
interface StrctFlowNode { /* + */ column?: number; data?: unknown; }
interface StrctFlowEdge { from: string; to: string; status?: StrctStatus; style?: 'solid' | 'dashed'; animated?: boolean; }
readonly edges = input<StrctFlowEdge[] | null>(null);                   // null = consecutive chain, as today
readonly columns = input<string[] | null>(null);                        // column headings (fan-out)
```

- **Fan-out.** Places nodes in columns. Edges are drawn as orthogonal connectors in an SVG underlay. A node's box is
  `strct-card dense [status]`, so tone and surface match the rest of the library.
- **Tree.** Is fan-out with columns derived from depth, which is the topology case.
- **Narrow widths.** Under `--strct-flow-stack` (a container query) the columns stack, and edges become a leading
  rail.

### Accessibility

The diagram is described structurally, not visually. Each column is a group with its heading. Each node is a list item
listing its outgoing edges ("HV-01 → HV-02, HV-03"), and SVG edges are `aria-hidden`.

### Acceptance

The blast-radius diagram (one source, three targets, one "stays down") and a two-level topology render from
`strct-flow`. The columns stack under 480px. Chain mode is unchanged.

---

## FR-48-32 — A value change ("from → to")

### Rule

**An upgrade or an edit states what changes as "from → to".** The old value is muted, the arrow is the library's, and
the new value is emphasised.

### What the app does today

administration/appliance-update.ts:407–414 `.up-move / -from / -to`: mono text, an arrow icon and a bold target, for
"v10.27 → v10.28". The same sentence appears as prose in the cluster validation reasons ("updated from 26100.4351 to
26100.4652").

### Proposed API

```html
<strct-change from="v10.27" to="v10.28" mono />
```

```ts
readonly from = input.required<string>();
readonly to = input.required<string>();
readonly mono = input(false, { transform: booleanAttribute });
readonly label = input((from: string, to: string) => `from ${from} to ${to}`);   // accessible text
```

Alternatively, as a `strct-desc` option: `<strct-desc label="Version" [change]="{from, to}" />`.

### Acceptance

It renders inline at text height with the `arrowRight` icon, and is read as "from v10.27 to v10.28".
