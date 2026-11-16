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
