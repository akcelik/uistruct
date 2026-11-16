# FR-81-01 — A port (and a device) can show its details on hover and on focus

**Filed by:** HyperStruct, 2026-11-15, against **7.16.0**, after its operator asked of the host network
map: "Topoloji çizimlerindeki portların üzerine mouse ile gelince kart (NIC) bilgisi de gösterebilir mi?"
— can the map show the adapter card's details when the pointer is over a port.

## The case

HyperStruct draws two maps with `strct-wiring`:

- **Host ▸ Configuration ▸ Networking ▸ Overview** (HyperStruct O514): host adapters → virtual switches →
  physical adapters → the switch ports heard on each cable.
- **Cluster / Host ▸ Health ▸ Network Health** (HyperStruct O457): each adapter the checks judge and the
  switch port heard on it.

A port carries `label` and `meta` only — "SLOT 3 Port 1" / "25 GbE · up". What the operator asks next
about that port is the card behind it, and today it is one click and a page away:

| Port                        | What the operator wants to read without leaving the map                                       |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| a physical adapter          | model, MAC, driver, speed, link, the switch it is an uplink of, the switch port heard, when   |
| a host (virtual) adapter    | connection name, IPv4/prefix, VLAN, MTU, its gateway and DNS servers, its switch              |
| a switch port heard on LLDP | switch name, port and its description, native/tagged VLANs, MTU, platform, management address |
| a device head (a switch)    | type, who manages it, teaming, load balancing                                                 |

Squeezing that into `meta` makes every port two lines of noise. Clicking is already taken: in
`navigable` mode a click (`portActivate`) opens the port's page or selects its link, and HyperStruct
wants to keep that.

`strct-wiring` gives a consumer no way in: the port body is the library's own template
(`portBody`), there is no content projection (`ngContentSelectors: never`) and no detail field on
`StrctWiringPort` or `StrctWiringNode`.

## Ask

1. **`StrctWiringPort.detail?: StrctWiringDetail`** and **`StrctWiringNode.detail?: StrctWiringDetail`**:

   ```ts
   interface StrctWiringDetail {
     /** The card's title — "SLOT 3 Port 1 · ConnectX-4 Lx". Defaults to the port's / node's label. */
     title?: string;
     /** Property rows in order, as a description list reads them. */
     rows: { label: string; value: string; mono?: boolean }[];
     /** A line under the rows — "Click to open it in Physical Adapters." */
     note?: string;
   }
   ```

   When set, the map shows a small card anchored to the port (or the device head):
   - on **pointer hover** after a short delay (~300 ms), and on **keyboard focus** of the port
     (the roving-cursor focus the map already has);
   - **hoverable** — the pointer can move into the card without it closing — and **dismissible** with
     Escape, and **persistent** while hovered or focused (WCAG 2.1 1.4.13, Content on Hover or Focus);
   - placed to stay inside the viewport and never covering the cable it describes when there is room
     either side;
   - one card at a time.

2. **Accessible text:** the port's `aria-describedby` points at the card's text (or an always-present
   visually hidden copy), so a screen reader hears the details on focus without the card having to be
   visible — and in the stacked (< 560 px) layout, where hover does not exist, the same rows can be
   read the same way.

3. **No change to clicks:** `portActivate`, `linkActivate`, `selected` and `isolate` behave exactly as
   today. A map that sets no `detail` renders exactly as today.

Optional, if a template is preferred over data: a `strctWiringDetail` content template
(`let-port`, `let-node`) the library renders inside its own card — the data shape above would still
cover both HyperStruct maps.

## Not asked

- No change to how ports, devices or links are drawn, coloured, filtered or announced.
- No click-to-pin: the card is for reading on the way; the click keeps its meaning.
- No touch long-press gesture; the stacked layout's accessible text is enough there.

## Shipped in 7.17.0 (2026-11-16)

`StrctWiringPort.detail` and `StrctWiringNode.detail`, taking
`StrctWiringDetail` — `{ title?, rows: { label, value, mono? }[], note? }`,
the data shape the FR proposed, which covers both HyperStruct maps. Measured
by `scripts/wiring-detail.mjs` (16 checks) with real pointer and key events,
not synthetic DOM events.

### Against the acceptance

| asked                                                                | measured                                                                                                                                         |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| on hover after a short rest (~300 ms)                                | nothing at **150ms**, the card at **450ms**, and only once it had been placed                                                                    |
| on keyboard focus of the port                                        | at once on focus, and the map's own **ArrowDown** brings it to the next port                                                                     |
| hoverable — the pointer can move into the card                       | still open **600ms** after the pointer left the port for the card                                                                                |
| dismissible with Escape                                              | closed by Escape with the pointer still on the card                                                                                              |
| persistent while hovered or focused                                  | open after a further **2s**; a focused port keeps its card when the pointer leaves                                                               |
| placed inside the viewport                                           | three cards measured, none closer than **8px** to an edge                                                                                        |
| never covering the cable it describes when there is room either side | a host adapter's card goes **left** (its cable leaves right) and a switch port's **right** — **0 of 41** sampled points of either cable under it |
| one card at a time                                                   | hovering a second port replaces the first: **1** card drawn                                                                                      |
| `aria-describedby` points at the card's text                         | Chrome describes the port in **213 characters** — model, MAC, driver, speed, link, what was heard                                                |
| the same rows readable in the stacked layout                         | at **430px** all **7** copies are laid out as text under their ports, and no card is drawn                                                       |
| no change to clicks                                                  | the port still reports itself and still selects its single cable                                                                                 |
| a map that sets no detail renders as today                           | the map beside it: **16** ports, **0** cards, **0** copies, **0** descriptions                                                                   |

The card's own text clears AA on its own surface: **12.01:1** at its weakest
of 12 readings over three palettes and two themes.

### What the report did not have

- **A port cabled both ways has no cable-free side.** The acceptance asks the
  card not to cover the cable it describes "when there is room either side",
  and for a port in the middle of the map there is none: both sides are runs.
  It takes the side with more room, and **34 of 41** sampled points of one of
  its two cables fall under it. The card is dismissed by moving the pointer
  and never covers the port being read — but no placement can do better here,
  so it is measured and said rather than left to be found.
- **The copy a screen reader reads sits beside the port, not inside it.** A
  card's worth of rows inside the button would have joined the port's own
  accessible _name_ — "SLOT 3 Port 1 → tor-a Eth1/11, Model: …, MAC: …" — and
  buried the port in its own details. It is a sibling with an id, pointed at
  by `aria-describedby`, so the name stays the port and the description is the
  card.
- **The card is `position: fixed`, and closes on scroll.** A wiring map often
  sits in a scrolling pane; an absolutely placed card would be clipped by it.
  Fixed means it is never clipped, and a scroll or a resize dismisses it
  rather than leaving it stranded beside a port that has moved.
- **The visible card is hidden from assistive tech** (`aria-hidden`), because
  the same rows are already the port's description. Two copies in the
  accessibility tree would be read twice.
