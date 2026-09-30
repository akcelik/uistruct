# FR-48-39 — Chat: thread, message, typing indicator, composer

> **SHIPPED in 4.23.0 (2026-09-30)** — `strct-chat-thread`, `strct-chat-message`,
> `strct-chat-composer` and `[strctChatAttachment]`.
>
> Measured in Chrome: the thread is a `role="log"` with `aria-live="polite"` and its own name;
> each message is an `article` named by its author — a system line reads as **"System"**, not as
> the assistant, which the first reading caught. The user's bubble is the accent tint, the
> assistant's `--bg-2`, the system line has no bubble at all, and the approval card sits under the
> bubble rather than inside it. Typing into the composer enables Send, **Shift+Enter does not send**
> and Enter does: the draft clears, the typing dots appear, and the reply arrives with the caret
> running `strct-chat-caret` while the message is `aria-busy="true"` — `animation: none` under
> `prefers-reduced-motion`. When the reply finishes, both the caret and `aria-busy` go, so assistive
> tech announces it once.
>
> **Every ask in this document has shipped.**

**From:** HyperStruct · **Version:** 4.4.0. Part of [hyperstruct-hand-built-audit.md](hyperstruct-hand-built-audit.md).

## Rule

**An assistant panel is built from the library, like every other panel.** A conversation is a thread of messages from
two or more authors. A reply streams in with a caret. While the assistant thinks, a typing indicator shows. The user
writes in a composer that grows, sends on Enter, and breaks lines on Shift+Enter. A message may carry an action card
the user must approve.

## What the app does today

shell/ai-assistant.ts is the operations assistant. Everything in it except the buttons and badges is hand-built:

| Part             | Where                                | Built from                                                                                     |
| ---------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Message rows     | :71, :130, :137 `.ai-msg`            | flex rows, author-dependent alignment                                                          |
| Avatars          | :72 `.ai-avatar`, `.ai-empty-avatar` | round icon tiles (FR-48-29)                                                                    |
| Bubbles          | `.ai-bubble`                         | radius, `backdrop-filter: blur`, a gradient user bubble                                        |
| Streaming caret  | :132 `.ai-caret`                     | blinking bar after the last token                                                              |
| Typing indicator | :144 `.ai-typing`                    | three animated dots                                                                            |
| Composer         | :158 `.ai-input-row`, `.ai-send`     | a bordered box around a raw textarea and a send button (FR-48-06)                              |
| Suggestions      | :64 `.ai-chip`                       | pills (FR-48-03)                                                                               |
| Action approval  | :82 `.ai-approval`                   | 3px left rail, blur and radius 12. This one migrates to `strct-card [status]`; the rest cannot |
| Empty state      | :53 `.ai-empty`                      | gradient avatar, gradient title and chips                                                      |

## Proposed API

```html
<strct-chat-thread [busy]="thinking()" label="Assistant conversation">
  @for (m of messages(); track m.id) {
  <strct-chat-message
    [author]="m.role"
    [streaming]="m.streaming"
    [name]="m.role === 'user' ? me : 'Assistant'"
    avatarIcon="sparkle"
  >
    <div [innerHTML]="m.html"></div>
    <strct-card strctChatAttachment status="warning">…approval…</strct-card>
  </strct-chat-message>
  }
</strct-chat-thread>
<strct-chat-composer
  [(value)]="draft"
  (send)="send($event)"
  placeholder="Ask about this cluster…"
  [disabled]="thinking()"
/>
```

```ts
// strct-chat-thread
readonly busy = input(false, { transform: booleanAttribute });   // shows the typing indicator after the last message
readonly label = input('Conversation');
readonly autoScroll = input(true, { transform: booleanAttribute }); // keeps the latest message in view unless the user scrolled up
// strct-chat-message
readonly author = input<'user' | 'assistant' | 'system'>('assistant');
readonly name = input('');
readonly avatarIcon = input('');
readonly streaming = input(false, { transform: booleanAttribute }); // caret after the content; aria-busy
readonly time = input<Date | null>(null);
// strct-chat-composer
readonly value = model('');
readonly placeholder = input('');
readonly disabled = input(false, { transform: booleanAttribute });
readonly maxRows = input(8);
readonly send = output<string>();
readonly sendLabel = input('Send');
```

- **Bubbles.** Surfaces use tokens: assistant `--bg-2`, user `--acc-s` with `--acc30`, system centred `--t3` text.
- **Motion.** No blur and no gradients by default; a consumer may add them. The caret and the typing dots respect
  `prefers-reduced-motion`.

## Accessibility

- **Thread.** It is `role="log"` with `aria-live="polite"`. A streaming message is announced once, when streaming ends,
  not token by token.
- **Messages.** Each is an `article` labelled by its author.
- **Composer.** It is a labelled textarea. Enter sends and Shift+Enter breaks a line, as a documented pattern; during
  IME composition Enter never sends.

## Acceptance

The assistant panel renders from the four components plus FR-48-03 tags and a `strct-card` approval. A streaming reply
shows the caret and is announced once. The composer grows to `maxRows` and then scrolls, and sends on Enter.
