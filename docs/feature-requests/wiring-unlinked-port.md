# FR-72-02 — A port with no cable says what the consumer knows, not "not wired"

**Filed by:** HyperStruct, 2026-11-05, against **7.7.0**, while adopting `strct-wiring` on Cluster ▸
Network Health (HyperStruct O458).

## The case

HyperStruct draws each adapter a cluster's checks judge (node port) and the switch port LLDP heard on
it (switch port). An adapter whose switch has sent **nothing** — LLDP off on the port, a capture never
run, or a switch that does not speak LLDP — is a node port with no link. We keep it on the map,
because "nothing was heard here" is part of the answer, and we say so in its `meta`:
`no switch port heard`.

`portSummary()` then gives that port the sentence **"not wired"**:

```ts
if (!out.length) return 'not wired';
```

That sentence is read by assistive tech on every width and, **below 560px, shown as visible text**
under the port (`.strct-wiring__sr` becomes visible when the columns stack). It claims a fact the page
does not have: the cable may well be there. HyperStruct's rule — and a fair rule for any monitoring
screen — is that an unread value is never written as a negative.

The same port means different things in different maps:

| Map                                 | A port with no link means     |
| ----------------------------------- | ----------------------------- |
| Node → switch, from LLDP            | nothing heard on it (unknown) |
| Patch panel A → B, from a CMDB      | not patched (a fact)          |
| Initiator → target, from the fabric | no session (a fact)           |

So the library cannot pick one sentence for all of them; the consumer knows which it is.

## Ask

1. **`StrctWiringPort.unlinked?: string`** — the sentence for this port when no drawn link lands on
   it, used in place of "not wired" in both the accessible text and the stacked layout's visible line.
2. **`unlinkedText` input** on `strct-wiring` — the same for every port that sets none, default
   `'not wired'` (no change for current consumers).

Either alone would do for HyperStruct (we would set `unlinkedText="nothing heard from a switch"`);
the per-port field lets a map mix a known-unpatched port with an unread one.

## Not asked

- No change to how links are drawn, filtered or announced.
- A link whose far end is not on the map is still neither drawn nor announced — that rule is right.
