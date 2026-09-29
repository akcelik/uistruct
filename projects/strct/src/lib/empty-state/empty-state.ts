import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctSpinner } from '../spinner/spinner';

/** Preset zero/permission/error states with a sensible icon + tone. */
export type StrctEmptyVariant = 'empty' | 'denied' | 'error' | 'notfound' | 'loading';

const VARIANTS: Record<StrctEmptyVariant, { icon: string; tone: string }> = {
  empty: { icon: 'folder', tone: 'neutral' },
  loading: { icon: '', tone: 'neutral' },
  denied: { icon: 'lock', tone: 'warning' },
  error: { icon: 'warning', tone: 'critical' },
  notfound: { icon: 'search', tone: 'neutral' },
};

/**
 * A centered empty / permission / error state — an icon, a title, an optional
 * description and a slot for call-to-action buttons. Project actions as children.
 *
 *   <strct-empty-state variant="denied" title="Insufficient privileges"
 *                     description="You don't have access to this cluster.">
 *     <button strct-button variant="primary">Request access</button>
 *   </strct-empty-state>
 */
@Component({
  selector: 'strct-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctSpinner],
  template: `
    <span class="strct-empty__icon strct-empty__icon--{{ toneClass() }}">
      @if (variant() === 'loading') {
        <strct-spinner [size]="size() === 'sm' ? 'sm' : 'md'" [label]="title()" />
      } @else {
        <strct-icon
          [name]="resolvedIcon()"
          [size]="size() === 'sm' ? 16 : 26"
          [strokeWidth]="1.4"
        />
      }
    </span>
    <h3 class="strct-empty__title">{{ title() }}</h3>
    @if (description()) {
      <p class="strct-empty__desc">{{ description() }}</p>
    }
    <div class="strct-empty__actions"><ng-content /></div>
  `,
  host: {
    class: 'strct-empty',
    '[class.strct-empty--sm]': "size() === 'sm'",
    '[attr.aria-busy]': "variant() === 'loading' ? 'true' : null",
  },
  styles: [
    `
      .strct-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 10px;
        padding: 40px 24px;
      }
      .strct-empty__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 14px;
        margin-bottom: 2px;
      }
      .strct-empty__icon--neutral {
        background: var(--bg-3);
        color: var(--t2);
      }
      .strct-empty__icon--warning {
        background: var(--warning-bg);
        color: var(--warning);
      }
      .strct-empty__icon--critical {
        background: var(--critical-bg);
        color: var(--critical);
      }
      .strct-empty__icon--accent {
        background: var(--acc-m);
        color: var(--acc);
      }
      .strct-empty__title {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-empty__desc {
        margin: 0;
        max-width: 360px;
        font-size: 13px;
        line-height: 1.5;
        color: var(--t3);
      }
      .strct-empty__actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
      }
      .strct-empty__actions:empty {
        display: none;
      }
    `,
  ],
})
export class StrctEmptyState {
  /** Preset that supplies a default icon + tone. */
  readonly variant = input<StrctEmptyVariant>('empty');
  /** Override the preset icon. */
  readonly icon = input('');
  /** Override the preset tone (neutral / warning / critical / accent). */
  readonly tone = input<string>('');
  readonly title = input.required<string>();
  /**
   * `sm` is the inline row a 240px frame wants: a 16px icon with the title and
   * description on one line. A page-sized empty state stays `md`.
   */
  readonly size = input<'md' | 'sm'>('md');
  readonly description = input('');

  protected readonly resolvedIcon = computed(() => this.icon() || VARIANTS[this.variant()].icon);
  protected readonly toneClass = computed(() => this.tone() || VARIANTS[this.variant()].tone);
}
