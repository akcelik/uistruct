# BUG-74-01 — A status-matrix row id longer than a catalogue id runs into its label

**Filed by:** HyperStruct, 2026-11-05, against **7.9.1**. Seen while adopting `strct-status-matrix` for
Cluster ▸ Network Health ▸ Layer 2 (HyperStruct O462). Measured in Chrome; not seen by the operator,
because the app now works around it.

## What happens

`.strct-status-matrix__rowid` is `display:inline-block; min-width:2.4em` and the label follows it with no
gap. A catalogue id like `H9` is narrower than 2.4em, so the leftover width looks like a gap. Anything
longer runs straight into the label:

- `VLAN 711` + `DC2.mVS.Prd.Int.Gen.1` → **"VLAN 711DC2.mVS.Prd.Int.Gen.1"**
- `PVLAN 100` + `DC2.mVS.Prd.Int.Gen.1` → **"PVLAN 100DC2.mVS.Prd.Int.Gen.1"**

Rows are N checks in the FR that asked for this component, but a matrix's rows are whatever the
consumer judges: VLANs, switch ports, policies. Their ids are not always two characters.

## Ask

A gap between the id and the label (`margin-inline-end: var(--space-2)` on the id, or a `gap` on the
head) whatever the id's width. Keep the 2.4em minimum so `H2`…`H19` still line up. In the gate, check
a row with an 8-character id and assert at least `--space-2` between the id's right edge and the
label's left edge.

## Meanwhile in HyperStruct

The row id is the VLAN number alone (`711`), under the `VLAN` row heading. A private VLAN or an
untagged port is named in the hint.
