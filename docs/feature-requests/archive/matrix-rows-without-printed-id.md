# FR-75-01 — Status-matrix rows that have a name, not a code

> **CLOSED, 2026-11-05.** Shipped in **v7.10.0** — both of the offered shapes, because they answer
> different questions and neither is redundant:
>
> - **`StrctMatrixAxis.code`**, printed before a row's label, leaving `id` to be the key a cell
>   names. This is the correction of the mistake behind both of this week's matrix reports: an id is
>   a key, and what gets printed is content. A row with no `code` still prints its `id`, so a
>   catalogue of checks needs no change; `code: ''` opts one row out.
> - **`rowIds`** (default `true`), for a matrix whose rows are all subjects rather than catalogue
>   entries. Nothing is printed and the label starts at the head's own edge — measured at
>   **0.00px** in, against the 2.4em the workaround was living with.
>
> One thing the ask did not raise and the component now does: **a key nobody prints is a key nobody
> reads out.** The spoken sentence carries the printed code, so an internal key never reaches a
> screen reader either. Measured: 9 cells of the hosts matrix, none naming one.
>
> HyperStruct can drop the zero-width-space ids.

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
