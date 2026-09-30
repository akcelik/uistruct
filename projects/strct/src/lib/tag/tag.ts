import {
  afterNextRender,
  ElementRef,
  inject,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import { strctCheckHostInputs } from '../util/host-check';
import { StrctIcon } from '../icon/icon';

/** Content rendered before the tag's text — a status dot, an icon. */
@Directive({ selector: '[strctTagLeading]' })
export class StrctTagLeading {}

/** Tag color variants. */
export type StrctTagStatus = 'neutral' | 'accent' | 'success' | 'warning' | 'critical';

/**
 * Compact, optionally removable chip.
 *   <strct-tag status="accent" removable (removed)="drop()">Frontend</strct-tag>
 */
@Component({
  selector: 'strct-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <span
      class="strct-tag__text"
      [attr.role]="interactive() ? 'button' : null"
      [attr.tabindex]="interactive() && !disabled() ? 0 : null"
      (click)="onActivate()"
      (keydown.enter)="onActivate()"
      (keydown.space)="$event.preventDefault(); onActivate()"
    >
      <!-- Declared before the catch-all so the selector wins; it renders first
           either way. -->
      <ng-content select="[strctTagLeading]" />
      <ng-content />
    </span>
    @if (removable() && !disabled()) {
      <button
        type="button"
        class="strct-tag__remove"
        [attr.aria-label]="removeLabel()"
        (click)="removed.emit()"
      >
        <strct-icon name="close" [size]="11" [strokeWidth]="1.6" />
      </button>
    }
  `,
  host: {
    class: 'strct-tag',
    '[class.strct-tag--interactive]': 'interactive() && !disabled()',
    '[class.strct-tag--pill]': "shape() === 'pill'",
    '[class.strct-tag--mono]': 'mono()',
    '[class.strct-tag--accent]': "status() === 'accent'",
    '[class.strct-tag--success]': "status() === 'success'",
    '[class.strct-tag--warning]': "status() === 'warning'",
    '[class.strct-tag--critical]': "status() === 'critical'",
  },
  styles: [
    `
      .strct-tag {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding-block: 3px;
        padding-inline: 9px 4px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        color: var(--t1);
        background: var(--bg-3);
        border: 1px solid var(--b2);
      }
      .strct-tag:not(:has(.strct-tag__remove)) {
        padding-inline-end: 9px;
      }
      .strct-tag--accent {
        color: var(--acc);
        border-color: var(--acc30);
        background: var(--acc-s);
      }
      .strct-tag--success {
        color: var(--success);
        border-color: var(--success);
        background: transparent;
      }
      .strct-tag--warning {
        color: var(--warning);
        border-color: var(--warning);
        background: transparent;
      }
      .strct-tag--critical {
        color: var(--critical);
        border-color: var(--critical);
        background: transparent;
      }
      .strct-tag__text {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      /* A tag is also the control for the thing it names: the body opens it,
         the × removes it — two targets, two tab stops. The body is a span with
         role="button" rather than a <button>, because a template can project
         the same content into only one place, so branching the markup on
         interactive would drop it in the other branch — the shape
         strct-list-item and strct-tree rows use. */
      .strct-tag--interactive .strct-tag__text {
        cursor: pointer;
        border-radius: 3px;
      }
      .strct-tag--interactive:hover {
        border-color: var(--b3);
        background: var(--bg-2);
      }
      .strct-tag--interactive.strct-tag--accent:hover {
        border-color: var(--acc);
      }
      .strct-tag__text:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 2px;
      }
      .strct-tag--pill {
        border-radius: var(--radius-full, 999px);
        padding-inline: 10px 5px;
      }
      .strct-tag--pill:not(:has(.strct-tag__remove)) {
        padding-inline-end: 10px;
      }
      .strct-tag--pill .strct-tag__remove {
        border-radius: 999px;
      }
      .strct-tag--mono {
        font-family: var(--mono);
      }
      .strct-tag__remove {
        display: inline-flex;
        padding: 2px;
        border: 0;
        border-radius: 3px;
        background: transparent;
        color: currentColor;
        opacity: 0.65;
        cursor: pointer;
      }
      .strct-tag__remove:hover,
      .strct-tag__remove:focus-visible {
        opacity: 1;
        background: var(--dn);
      }
    `,
  ],
})
export class StrctTag {
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Dev-only: writing this component the way a sibling is written must not
    // fail silently. Guarded inline, so production drops the call — and with it
    // the whole diagnostics module.
    afterNextRender(() => {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const el = this.hostEl.nativeElement;
        strctCheckHostInputs(el, 'strct-tag', {
          status: 'neutral, accent, success, warning, critical',
          shape: 'default, pill',
        });
      }
    });
  }
  /** Visual status color. */
  readonly status = input<StrctTagStatus>('neutral');
  /** Show a remove button. */
  readonly removable = input(false, { transform: booleanAttribute });
  /** Hide the remove button (e.g. when the parent control is disabled). */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible label for the remove button. */
  readonly removeLabel = input('Remove');
  /**
   * The body becomes a control: pointer, hover, focus ring, and `activated` on
   * click / Enter / Space. The × stays a separate tab stop, so "open it" and
   * "remove it" are two targets.
   */
  readonly interactive = input(false, { transform: booleanAttribute });
  /** `'pill'` rounds the tag fully — a chip for a thing, not a label on one. */
  readonly shape = input<'default' | 'pill'>('default');
  /** Monospace text, for names that are identifiers. */
  readonly mono = input(false, { transform: booleanAttribute });
  /** Emitted when the user clicks the remove button. */
  readonly removed = output<void>();
  /** Emitted when an `interactive` tag's body is activated. */
  readonly activated = output<void>();

  protected onActivate(): void {
    if (this.interactive() && !this.disabled()) this.activated.emit();
  }
}
