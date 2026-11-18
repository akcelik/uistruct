# FR-84 — A grid that failed to read, and a bar with no reading

**Filed by:** HyperStruct, 2026-11-17, against **7.20.0**, from its avionics-grade review (O519,
findings UI-N4 and UI-N9: display integrity).

## The case

A read that fails must never look like a read that found nothing. HyperStruct found screens where it
did:

| screen                        | the read failed, the screen said |
| ----------------------------- | -------------------------------- |
| Migrate ▸ what blocks a move  | "Nothing blocks a move"          |
| Restore ▸ recovery points     | "This VM has no recovery point." |
| a port profile ▸ its adapters | "none on this profile"           |

The cause is the same each time: on an error the consumer hands `strct-datagrid` an empty array, and
the grid draws its `emptyText`. Of 429 datagrids in HyperStruct, 26 switch their `emptyText` by hand
when the read failed; the rest cannot tell the two apart.

`strct-progress` has the same gap for a single value: `[value]` is a `number`, so a fullness that was
not read is drawn as an empty bar (`value ?? 0`) — "0 % used" — even when `valueText` says
"Not read".

## Ask

### FR-84-01 — `strct-datagrid [error]`

An input `[error]="'The recovery points could not be read.'"` (a string or null). When set:

- the grid draws the error in place of the rows and of `emptyText`, with the critical tone and an
  icon distinct from the empty state's, so "could not be read" and "none" never look alike;
- rows passed alongside an error (the last good read, kept on purpose) stay visible under a one-line
  error band instead of being replaced, so a consumer can keep what it last showed;
- the footer's refresh (`sync`) action stays available;
- a screen reader announces the error once, as a status, not per row.

### FR-84-02 — `strct-progress [value]="null"`

`value` accepts `null`: the reading is not known. The track is drawn without a fill and without the
status colour, `valueText` defaults to "Not read", and `aria-valuenow` is omitted (with
`aria-valuetext` carrying the text), so assistive tech does not read "0 percent".

## Acceptance

- An errored grid and an empty grid are visibly and audibly different, in both themes.
- `strct-progress` with `null` is visibly different from `0`, and never takes the status colour.
- Existing consumers that never set the new values see no change.
