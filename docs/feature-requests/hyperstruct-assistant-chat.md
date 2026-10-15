# HyperStruct's assistant chat window on 5.6.1 → FR-51-01 … 06

**From:** HyperStruct · **Version:** 5.6.1 · **Date:** 2026-10-13

HyperStruct rebuilt its assistant's chat window (HyperStruct decision O312) on `strct-chat-thread`,
`strct-chat-message` and `strct-chat-composer` (FR-48-39). The window now keeps server-side conversations with a side
list, a Stop button, per-reply copy, Markdown replies with tables and code, and object chips that open the object's
page. The chat components carried most of it; the items below are what the app had to write itself.

Each item names the local workaround, which is marked in HyperStruct's code with the FR id. "Measured" means a running
probe or spec; "read" means source only.

Suggested order: **FR-51-02** (the biggest piece of app code that belongs in the library), then **FR-51-01** and
**FR-51-03** (every chat needs them).

> **FR-51-01 … 06 SHIPPED in 5.11.0 (2026-10-15)** — every item in this document.
>
> - **02** `strct-markdown`: a reader that returns plain objects and templates that draw them, so no
>   HTML is ever built. Specs assert that `<img onerror>` and `<b>` render as characters, that
>   `javascript:`, `data:`, `//host` and relative links stay text, that an image is only its alt
>   text, that an unterminated fence is already a code block, that the caret sits in the last
>   paragraph, and that the reader is bounded on hostile input. `tokens` +
>   `[strctMarkdownToken]` carry app-specific spans without forking it.
> - **01** `strct-chat-composer [busy]` with `(stop)` — one button, in the place the eye is.
> - **03** `[strctChatMessageActions]` under the bubble.
> - **04** `strct-tag [href]` / `[target]`.
> - **05** `strct-modal [closeOnEscape]` / `[closeOnBackdrop]`, with a handled Escape left alone.
> - **06** `strct-list-item [disabled]` / `[disabledReason]`.

---

### FR-51-01 — `strct-chat-composer`: a Stop mode

**Where.** `chat/chat.ts` ~340–370 (read): the composer has `sendDisabled`, and its one button only sends.

**Need.** While a reply streams, every chat UI the operators know (ChatGPT, Copilot) turns Send into Stop in the same
place. HyperStruct puts a separate `strct-button` "Stop" beside the composer, and the composer's own button sits
disabled next to it: two buttons for one action, and the Stop is not where the eye is.

**Proposed.**

- `busy` input (or `stoppable`): the send button becomes a Stop button — square icon, `aria-label` from a `stopLabel`
  input (default "Stop"), enabled whatever the draft holds.
- `(stop)` output.
- While busy, Enter still never sends (as `sendDisabled` today); the draft stays editable.
- The swap is announced politely ("Stop" / "Send") or left to the label change — the library's call.

**Acceptance.** One button in the box; clicking it while busy emits `stop` and never `send`; keyboard users reach it
with the same Tab stop as Send.

**HyperStruct workaround:** `shell/ai-assistant.ts`, the `ai-stop` button beside the composer.

### FR-51-02 — `strct-markdown`: a safe Markdown view (or a Markdown mode of `strct-chat-message`)

**Need.** Model replies are Markdown. Drawing them as plain text left tables as rows of pipes and `**` everywhere. An
app that reaches for a Markdown library ends up handing the browser HTML (`innerHTML` + a sanitiser), which a banking
appliance's reviewers refuse, and pulls a dependency into a sealed build.

**What HyperStruct wrote** (`shell/assistant/markdown.ts` + `assistant-markdown.ts`, ~1,000 lines, plus ~400 lines of specs):

- A reader that builds a tree of plain objects — paragraphs, headings, emphasis/strong/strikethrough (CommonMark's
  delimiter rules, bounded), inline code, fenced code, ordered/unordered/nested lists, GFM tables with alignment, block
  quotes, rules, links, autolinks — and templates that draw the tree. Every word reaches the page as a text node; raw
  HTML is shown as the characters it is.
- A link policy: http(s) opens in a new tab with `rel="noopener noreferrer"` and an external mark; a path inside the app
  is routed; anything else (`javascript:`, `data:`, `//host`, relative) stays the text the model wrote. Images are
  never loaded.
- Streaming without flicker: a fence that has not closed yet is still a code block, so a reply streaming code is a code
  block from its first line; blocks are tracked by index, so the DOM is updated, not rebuilt.
- Headings pulled down (`#` → h3) because a message is a region inside a dialog.
- Code blocks are `strct-code` (with its copy button); tables are `strct-table` with a cell template per column.
- Bounded work on hostile input (nesting depth, delimiter count, source size).

**Proposed.**

- `strct-markdown [source] [streaming]` with inputs for the link policy (`linkPolicy: (href) => 'external' | 'internal'
| null`, an `(navigate)` output for internal links), a heading offset, and the line-break mode.
- A hook for app-specific inline nodes, so an app can turn tokens into components without forking the reader:
  `[strctMarkdownToken]` templates keyed by a token kind, fed by a `tokens: (text) => Token[]` function (HyperStruct
  turns inventory identifiers into object chips this way).
- `streaming` places the caret at the end of the last inline run rather than after the last block (today
  `strct-chat-message streaming` draws the caret after the projected content, so after a table or a list it sits on
  its own line).

**Acceptance.** No `innerHTML` on the path; `<img onerror>`, `javascript:` links and unterminated fences render as text /
code; a 64 KiB reply re-parses per token without visible lag.

**HyperStruct workaround:** the reader and renderer above, marked FR-51-02 — ready to move, with their specs.

### FR-51-03 — `strct-chat-message`: an actions slot under the bubble

**Where.** `chat/chat.ts` ~200–215 (read): the message projects its content into the bubble and
`[strctChatAttachment]` after it. Nothing else.

**Need.** Every assistant reply has a small row under it: Copy, a status ("Stopped", "Model call failed"), and a quiet
"Used 3 tools" fold. HyperStruct puts that row in the attachment slot — which the library documents as "a card the
message carries".

**Proposed.**

- `[strctChatMessageActions]` slot under the bubble (or under the attachments): a quiet row, `--text-sm`, `--t3`.
- Optionally revealed on hover/focus-within for pointer devices, always reachable by keyboard, always shown on touch.
- Optionally a built-in `copyText` input that draws a `strct-copy` there ("Copy" / "Copied").

**HyperStruct workaround:** `shell/ai-assistant.ts`, the `ai-msg-foot` row with `strctChatAttachment`.

### FR-51-04 — A tag that is a link (an object chip)

**Where.** `tag/tag.ts` (read): `strct-tag` is a span; `interactive` makes its text a `role="button"` that emits
`activated`.

**Need.** An object chip in a reply opens the object's page — and should open it in a new tab on Ctrl/⌘-click, show the
address on hover and be copyable as a link, like any link. A `role="button"` tag can do none of that.

**Proposed.** `strct-tag [href]` (and `routerLink` through a directive) renders its text as an `<a>`, with the tag's
focus ring, hover and colours; or a dedicated `strct-object-chip [icon] [label] [href]`.

**HyperStruct workaround:** `shell/assistant/assistant-markdown.ts` wraps `strct-tag` in an anchor with
`text-decoration: none; color: inherit`.

### FR-51-05 — `strct-modal`: Escape without backdrop dismissal

**Where.** `modal/modal.ts` ~403–414 (read): `onBackdrop` and `onEscape` both follow `dismissible`.

**Need.** A chat window should close on Escape (the operator expects it; nothing is lost — the conversation stays) but
not on a stray click outside it. Today a consumer chooses both or neither.

**Proposed.** `closeOnEscape` (default: `dismissible`) and `closeOnBackdrop` (default: `dismissible`). Escape should
also yield to a focused control that uses it first — an IME composition (`isComposing`), a `strct-searchbox` with text
(which clears) — for example by ignoring a `defaultPrevented` event and having the searchbox prevent default when it
clears.

**HyperStruct workaround:** `shell/ai-assistant.ts` `escape()`, a capture-phase document listener while the window is
open.

### FR-51-06 — `strct-list-item`: disabled, with a reason

**Where.** `list/list.ts` (read): `interactive` on or off; no disabled state.

**Need.** HyperStruct's conversation list cannot switch away while a reply is arriving. The row stops being
interactive and puts the reason in a `title`, which a keyboard or touch user never sees.

**Proposed.** `disabled` + `disabledReason` (shown as the menu items' `hint` is, FR-42-01): the row keeps its tab stop,
announces `aria-disabled="true"` and its reason, and does not emit `activated`.

**HyperStruct workaround:** `shell/assistant/assistant-history.ts`, `[interactive]="!locked()"` with a tooltip.
