# FR-80-04 — `strct-progress` markers on an axis that is not a percentage

**Filed by:** HyperStruct, 2026-11-12, against **7.14.0**. HyperStruct's cluster validation draws a
running Test-Cluster's time against the time such a run usually takes (O509): the fill is the time so
far, two markers are the usual least and most. HyperStruct has dropped the markers until this ships,
marked in `validation-run-monitor.ts`.

## What a reader hears today

The bar's own value can be said in words — `valueText="6 min 12 s"` becomes its `aria-valuetext`.
A marker cannot: `valueDescription` says every marker as `` `${label} ${value}%` ``, so the bar reads
"6 min 12 s, usually at least 5 minutes 28%, usually at most 14 minutes 80%". On a time axis the 28%
and 80% are positions on the track, not quantities anyone asked for, and a validation that has no
percentage of completion must not be heard to have one. With no `valueText` the bar's head falls
back to `${value}%` too.

## Ask

- **`StrctProgressMarker.valueText?: string`** — what the marker is said as, in place of
  `${value}%`: `{ value: 28, label: 'usually at least', valueText: '5 minutes' }` reads "usually at
  least 5 minutes".
- When the bar has a `valueText` and every marker has one, nothing in the accessible text is a
  percentage.
- Drawn exactly as today: the markers keep the track's coordinates.

## Acceptance

- A bar with `valueText="6 min 12 s"` and two markers with `valueText` reads, in its
  `aria-valuetext`, "6 min 12 s, usually at least 5 minutes, usually at most 14 minutes" — no `%`.
- A marker without `valueText` reads as today (`label value%`), so existing bars do not change.
