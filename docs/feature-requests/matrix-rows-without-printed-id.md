# FR-75-01 — Status-matrix rows that have a name, not a code

**Filed by:** HyperStruct, 2026-11-05, against **7.9.1**. Seen while adopting `strct-status-matrix` for
Administration ▸ Host Update Manager (clusters × update baselines) and Cluster ▸ Updates (hosts ×
baselines), HyperStruct O464. Measured in Chrome.

## What happens

`strct-status-matrix` prints every row's `id` before its label (`.strct-status-matrix__rowid`,
`min-width: 2.4em`, muted). That fits a catalogue of checks (`H9 · Priority flow control`). When the
rows are clusters or hosts, the row has no code: the only id is an internal key (`c:PROD-CL02`,
`h:1`), and printing it reads **"c:PROD-CL02PROD-CL02"** (with BUG-74-01's missing gap).

## Ask

A way to leave the id out of the row head, for example:

- an input on the matrix, `rowIds: boolean` (default `true`), or
- an optional `code` on `StrctMatrixAxis` that is printed when present, keeping `id` as the key only.

When nothing is printed, the label starts at the head's start edge (no 2.4em indent), and the hint
lines up under it. The rollup row is unchanged.

## Meanwhile in HyperStruct

Each row's id is an invisible one (zero-width spaces, unique by count), mapped both ways for the cells
and the picked cell. The label then starts 2.4em in, which reads like an indent under the "Cluster"
heading.
