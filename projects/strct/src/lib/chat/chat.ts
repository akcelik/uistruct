import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { StrctAvatar } from '../avatar/avatar';
import { StrctIcon } from '../icon/icon';

/** Who wrote a message. */
export type StrctChatAuthor = 'user' | 'assistant' | 'system';

/** A card the message carries — an action to approve, a result to read. */
@Directive({ selector: '[strctChatAttachment]', host: { class: 'strct-chat__attachment' } })
export class StrctChatAttachment {}

/**
 * A conversation is a thread of messages from two or more authors, and an
 * assistant panel is built from the library like every other panel.
 *
 *   <strct-chat-thread [busy]="thinking()" label="Assistant conversation">
 *     …<strct-chat-message author="user">…</strct-chat-message>…
 *   </strct-chat-thread>
 *
 * The thread is a `role="log"` with `aria-live="polite"`: a streaming reply is
 * announced once, when it finishes, rather than token by token.
 */
@Component({
  selector: 'strct-chat-thread',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="strct-chat__list" #list><ng-content /></div>
    @if (busy()) {
      <div class="strct-chat__typing" [attr.aria-label]="typingLabel()" role="status">
        <span class="strct-chat__dot"></span>
        <span class="strct-chat__dot"></span>
        <span class="strct-chat__dot"></span>
      </div>
    }
  `,
  host: {
    class: 'strct-chat',
    role: 'log',
    'aria-live': 'polite',
    'aria-relevant': 'additions',
    '[attr.aria-label]': 'label()',
    '[attr.aria-busy]': 'busy() ? "true" : null',
    '(scroll)': 'onScroll()',
  },
  styles: [
    `
      .strct-chat {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        min-height: 0;
        overflow: auto;
        padding: var(--space-3);
      }
      .strct-chat__list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
      /* Three dots while the assistant thinks — still under reduced motion. */
      .strct-chat__typing {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding-inline-start: 38px;
      }
      .strct-chat__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--t3);
        animation: strct-chat-bounce 1.1s ease-in-out infinite;
      }
      .strct-chat__dot:nth-child(2) {
        animation-delay: 0.15s;
      }
      .strct-chat__dot:nth-child(3) {
        animation-delay: 0.3s;
      }
      @keyframes strct-chat-bounce {
        0%,
        70%,
        100% {
          opacity: 0.35;
          transform: translateY(0);
        }
        35% {
          opacity: 1;
          transform: translateY(-3px);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-chat__dot {
          animation: none;
          opacity: 0.55;
        }
      }
    `,
  ],
})
export class StrctChatThread {
  /** The assistant is composing: shows the typing indicator after the last message. */
  readonly busy = input(false, { transform: booleanAttribute });
  /** The thread's accessible name. */
  readonly label = input('Conversation');
  /** What the typing indicator says to assistive tech. */
  readonly typingLabel = input('Assistant is typing');
  /** Keep the latest message in view — unless the reader scrolled up. */
  readonly autoScroll = input(true, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** False once the reader scrolls away from the end; true again at the end. */
  private readonly atEnd = signal(true);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.scrollToEnd();
      // A new message, or a streaming one growing, changes the list's height —
      // and nothing else tells the thread that. Following `busy` alone left the
      // reader looking at the message before last.
      if (typeof ResizeObserver === 'undefined') return;
      const list = this.host.nativeElement.querySelector('.strct-chat__list');
      if (!list) return;
      const ro = new ResizeObserver(() => {
        if (this.autoScroll() && this.atEnd()) this.scrollToEnd();
      });
      ro.observe(list);
      this.destroyRef.onDestroy(() => ro.disconnect());
    });
    effect(() => {
      this.busy();
      if (this.autoScroll() && this.atEnd()) queueMicrotask(() => this.scrollToEnd());
    });
  }

  protected onScroll(): void {
    const el = this.host.nativeElement;
    this.atEnd.set(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
  }

  /** Jump to the newest message. */
  scrollToEnd(): void {
    const el = this.host.nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}

/**
 * One message in a {@link StrctChatThread}: an `article` labelled by its
 * author, with the author's avatar, its content, and any attachment card.
 */
@Component({
  selector: 'strct-chat-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctAvatar],
  template: `
    @if (author() !== 'system') {
      <strct-avatar
        class="strct-msg__avatar"
        size="sm"
        [name]="displayName()"
        [icon]="avatarIcon()"
        [tone]="author() === 'user' ? 'neutral' : 'accent-soft'"
      />
    }
    <div class="strct-msg__body">
      @if (author() !== 'system' && (name() || time())) {
        <div class="strct-msg__meta">
          @if (name()) {
            <span class="strct-msg__name">{{ name() }}</span>
          }
          @if (time()) {
            <time class="strct-msg__time" [attr.datetime]="isoTime()">{{ shortTime() }}</time>
          }
        </div>
      }
      <div class="strct-msg__bubble">
        <ng-content />
        @if (streaming()) {
          <span class="strct-msg__caret" aria-hidden="true"></span>
        }
      </div>
      <ng-content select="[strctChatAttachment]" />
    </div>
  `,
  host: {
    class: 'strct-msg',
    role: 'article',
    '[attr.data-author]': 'author()',
    '[attr.aria-label]': 'displayName()',
    // A streaming reply is announced when it finishes, not token by token.
    '[attr.aria-busy]': 'streaming() ? "true" : null',
  },
  styles: [
    `
      .strct-msg {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
        min-width: 0;
      }
      .strct-msg[data-author='user'] {
        flex-direction: row-reverse;
      }
      .strct-msg[data-author='system'] {
        justify-content: center;
      }
      .strct-msg__avatar {
        flex: none;
      }
      .strct-msg__body {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        max-width: 80%;
      }
      .strct-msg[data-author='user'] .strct-msg__body {
        align-items: flex-end;
      }
      .strct-msg__meta {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font-size: var(--text-sm);
        color: var(--t3);
      }
      .strct-msg__name {
        font-weight: 600;
      }
      /* Surfaces from tokens: no blur, no gradient — a consumer may add them. */
      .strct-msg__bubble {
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
        background: var(--bg-2);
        color: var(--t1);
        font-size: 13px;
        line-height: 1.5;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .strct-msg[data-author='user'] .strct-msg__bubble {
        background: var(--acc-s);
        border-color: var(--acc30);
      }
      .strct-msg[data-author='system'] .strct-msg__bubble {
        border: 0;
        background: none;
        color: var(--t3);
        font-size: var(--text-sm);
        text-align: center;
      }
      /* The caret that follows a streaming reply. */
      .strct-msg__caret {
        display: inline-block;
        width: 2px;
        height: 1em;
        margin-inline-start: 2px;
        vertical-align: text-bottom;
        background: var(--acc);
        animation: strct-chat-caret 1s steps(2, start) infinite;
      }
      @keyframes strct-chat-caret {
        to {
          opacity: 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-msg__caret {
          animation: none;
        }
      }
      .strct-chat__attachment {
        display: block;
        margin-block-start: 4px;
      }
    `,
  ],
})
export class StrctChatMessage {
  /** Who wrote it. */
  readonly author = input<StrctChatAuthor>('assistant');
  /** The author's name, shown above the bubble. */
  readonly name = input('');
  /** An icon avatar instead of initials — an assistant is an icon. */
  readonly avatarIcon = input('');
  /** The reply is still arriving: a caret follows the content. */
  readonly streaming = input(false, { transform: booleanAttribute });
  /** When it was sent. */
  readonly time = input<Date | null>(null);
  /** How the time reads (localisable). */
  readonly timeFormat = input<(d: Date) => string>((d) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  );

  /** Default names per author, overridable with `name` (and localisable). */
  readonly authorNames = input<Record<StrctChatAuthor, string>>({
    user: 'You',
    assistant: 'Assistant',
    system: 'System',
  });

  protected readonly displayName = computed(() => this.name() || this.authorNames()[this.author()]);
  protected readonly shortTime = computed(() => {
    const t = this.time();
    return t ? this.timeFormat()(t) : '';
  });
  protected readonly isoTime = computed(() => this.time()?.toISOString() ?? null);
}

/**
 * The box the user writes in: it grows with the text up to `maxRows`, sends on
 * Enter and breaks a line on Shift+Enter — and never sends mid-composition, so
 * an IME's Enter commits the candidate instead of the message.
 */
@Component({
  selector: 'strct-chat-composer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <label class="strct-composer__label" [attr.for]="inputId">{{ label() }}</label>
    <div class="strct-composer__box">
      <textarea
        class="strct-composer__input"
        [id]="inputId"
        rows="1"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="value()"
        [style.max-height.px]="maxRows() * 20"
        (input)="onInput($event)"
        (compositionstart)="composing.set(true)"
        (compositionend)="composing.set(false)"
        (keydown.enter)="onEnter($event)"
      ></textarea>
      <button
        type="button"
        class="strct-composer__send"
        [attr.aria-label]="sendLabel()"
        [disabled]="disabled() || !value().trim()"
        (click)="submit()"
      >
        <strct-icon strictName="arrowUp" [size]="15" [strokeWidth]="1.8" />
      </button>
    </div>
  `,
  host: { class: 'strct-composer' },
  styles: [
    `
      .strct-composer {
        display: block;
      }
      .strct-composer__label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      /* One box around the field and its button: the field gives up its own. */
      .strct-composer__box {
        display: flex;
        align-items: flex-end;
        gap: 4px;
        padding: 4px 4px 4px var(--space-3);
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
        background: var(--bg-2);
        transition:
          border-color 0.14s ease,
          box-shadow 0.14s ease;
      }
      .strct-composer__box:focus-within {
        border-color: var(--acc50);
        box-shadow: 0 0 0 3px var(--acc18);
        background: var(--bg-1);
      }
      .strct-composer__input {
        flex: 1;
        min-width: 0;
        border: 0;
        background: none;
        resize: none;
        padding: 6px 0;
        font-family: var(--font);
        font-size: 13px;
        line-height: 20px;
        color: var(--t1);
        overflow-y: auto;
      }
      .strct-composer__input:focus {
        outline: none;
      }
      .strct-composer__input::placeholder {
        color: var(--t3);
      }
      .strct-composer__send {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: 28px;
        height: 28px;
        border: 0;
        border-radius: var(--radius-md);
        background: var(--acc);
        color: var(--inv);
        cursor: pointer;
      }
      .strct-composer__send:disabled {
        opacity: var(--disabled-opacity);
        cursor: not-allowed;
      }
      .strct-composer__send:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 2px;
      }
    `,
  ],
})
export class StrctChatComposer {
  /** The draft (two-way). */
  readonly value = model('');
  /** Placeholder text. */
  readonly placeholder = input('');
  /** The field's accessible name (visually hidden). */
  readonly label = input('Message');
  /** Disabled while the assistant is busy, say. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** How tall the box grows before it scrolls. */
  readonly maxRows = input(8);
  /** The send button's accessible name. */
  readonly sendLabel = input('Send');
  /** The user sent the draft. */
  readonly send = output<string>();

  protected readonly inputId = `strct-composer-${++composerCounter}`;
  /** True while an IME is composing — Enter must commit, not send. */
  protected readonly composing = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.value.set(el.value);
    this.grow(el);
  }

  /** Grow with the text: reset first, so deleting a line shrinks it again. */
  private grow(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  protected onEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.shiftKey || this.composing() || e.isComposing) return;
    e.preventDefault();
    this.submit();
  }

  submit(): void {
    const text = this.value().trim();
    if (!text || this.disabled()) return;
    this.send.emit(text);
    this.value.set('');
    const el = this.host.nativeElement.querySelector<HTMLTextAreaElement>('textarea');
    if (el) {
      el.value = '';
      this.grow(el);
      el.focus();
    }
  }
}

let composerCounter = 0;
