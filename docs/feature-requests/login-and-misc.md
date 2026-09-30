# FR-48-40 … 41 — Login art, QR code

> **SHIPPED in 4.24.0 (2026-09-30)** — `strct-login`'s `art` / `brandIcon` / `brandName` /
> `tagline` / `[strctLoginStatus]`, and the new `strct-qr`.
>
> Measured in Chrome: `art="network"` renders two glows, the dot grid and the node diagram, all
> `aria-hidden`; the nodes run `strct-login-pulse` and go to `animation: none` under
> `prefers-reduced-motion`; their fill follows the scheme (light `rgb(74,107,143)` → dark
> `rgb(123,158,200)`), because the art is palette tokens only.
>
> The QR code is a `role="img"` with its label, 176px over a 53-module viewBox (version 7 plus the
> 4-module quiet zone), and — **with the page in dark mode** — still black modules on a white quiet
> zone. That is the deliberate exception to "tokens only": a themed QR code is an unscannable one.
>
> The encoder is dependency-free (byte mode, versions 1–10, all four levels) and is verified rather
> than assumed: its Reed–Solomon parity matches the published 1-M vector, and a reader written from
> the spec in the tests reads every code back — format bits, mask, zig-zag, de-interleaved blocks
> with **zero syndromes**, and the original text, including a Unicode string at each level. Writing
> that reader caught two real defects: the generator polynomial multiplied the wrong term by α^i,
> and the second format copy was written one bit out, over the dark module.
>
> **Every ask in this document has shipped.**

**From:** HyperStruct · **Version:** 4.4.0. Part of [hyperstruct-hand-built-audit.md](hyperstruct-hand-built-audit.md).

---

## FR-48-40 — `strct-login`: the showcase's art as a built-in aside

### Rule

**What the library shows as its login screen, a consumer can have by asking for it.** HyperStruct's sign-in page is the
UIStruct showcase's split login demo, copied out of the showcase into the app's own `login.html` and `login.css`. It is
therefore the one screen whose look the library cannot update.

### What the app does today

login.html (:5–39) and login.css:

- **Aside art:**
  - `.auth-hero__glow--a` and `--b`, blurred radial glows;
  - `.auth-hero__matrix`, a dot grid;
  - `.auth-hero__net`, an SVG network with pulsing `.auth-net__node`s.
- **Text:** the `.auth-rule` accent bar and `.auth-kicker / .auth-welcome / .auth-lead`.
- **Brand:** the `.auth-brand__mark` icon tile (see FR-48-29).
- **Status strip:** `.auth-status` (border, radius 10, `--acc-s` background, a pulsing dot; see FR-48-19), which says
  whether the appliance is reachable.

`strct-login [split]` provides only the two-pane layout.

### Proposed API

```ts
// strct-login (additions)
readonly art = input<'none' | 'network' | 'grid'>('none');      // the showcase's aside, built in
readonly brandIcon = input('');                                  // icon tile beside the product name
readonly brandName = input('');
readonly tagline = input('');                                    // the kicker line
```

- **Slot.** `[strctLoginStatus]` is projected at the aside's foot.
- **Art.** It uses palette tokens only, so it follows all six schemes. It is `aria-hidden`, and it is static under
  `prefers-reduced-motion`.

### Acceptance

`<strct-login split art="network" brandIcon="server" brandName="HyperStruct">` renders the showcase's aside. The app's
`login.css` can then be deleted except for layout.

---

## FR-48-41 — `strct-qr` (new)

### Rule

**Enrolling an authenticator app shows a QR code the library draws,** with the quiet zone and contrast the scanner
needs in every theme. It is not an image the consumer frames on white.

### What the app does today

shell/security-keys-dialog.ts:166 `.sk-qr`: the TOTP enrolment QR image on a white padded frame. The white is
hard-coded because a dark theme makes the code unscannable.

### Proposed API

```ts
readonly value = input.required<string>();        // e.g. an otpauth:// URI
readonly size = input(176);                       // px
readonly label = input('QR code');                // accessible name
readonly errorCorrection = input<'L' | 'M' | 'Q' | 'H'>('M');
```

- **Rendering.** An SVG, always dark modules on a light quiet zone of 4 modules, regardless of theme. That is a
  documented exception to "tokens only", for scannability.
- **Implementation.** A dependency-free encoder in the library.

### Accessibility

`role="img"` with `label`. The consumer is expected to show the secret as text beside it; the typings say so.

### Acceptance

An `otpauth://` URI renders a scannable 176px code in dark and light themes, and a standard reader decodes the same
string.
