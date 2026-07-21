import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  Injectable,
  OnDestroy,
  ViewEncapsulation,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { StrctKbd } from '../kbd/kbd';

/** A registered application hotkey. */
export interface StrctHotkey {
  /** Combo like `'ctrl+k'`, `'meta+shift+p'`, `'?'` — `mod` = Ctrl/⌘. */
  combo: string;
  /** Human description shown in the help overlay. */
  description: string;
  /** Help-overlay group heading. */
  group?: string;
  handler: (event: KeyboardEvent) => void;
}

function normalize(combo: string): string {
  return combo
    .toLowerCase()
    .split('+')
    .map((p) => p.trim())
    .sort()
    .join('+');
}

function comboOf(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('ctrl');
  if (event.metaKey) parts.push('meta');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey && event.key.length > 1) parts.push('shift');
  parts.push(event.key.toLowerCase());
  return parts.sort().join('+');
}

/** `mod` matches Ctrl (and ⌘ on mac keyboards) — expand to both. */
function expand(combo: string): string[] {
  const n = combo.toLowerCase();
  if (!n.includes('mod')) return [normalize(n)];
  return [normalize(n.replace('mod', 'ctrl')), normalize(n.replace('mod', 'meta'))];
}

/**
 * Application hotkeys, centrally registered so they are discoverable — the
 * Blueprint pattern:
 *
 *   private hotkeys = inject(StrctHotkeysService);
 *   ngOnInit() { this.dispose = this.hotkeys.register(
 *     { combo: 'mod+k', description: 'Open command palette', group: 'Global',
 *       handler: () => this.palette.open() }); }
 *
 * Combos: `'a'`, `'?'`, `'ctrl+k'`, `'meta+shift+p'`, `'mod+k'` (mod = Ctrl/⌘).
 * Plain-key combos are suppressed while typing in inputs / textareas /
 * contenteditable; modifier combos always fire. Pair with
 * `<strct-hotkeys-help/>` for the ⌘/ ("?") cheatsheet overlay.
 */
@Injectable({ providedIn: 'root' })
export class StrctHotkeysService implements OnDestroy {
  private readonly registry = signal<StrctHotkey[]>([]);
  /** All registered hotkeys (for the help overlay). */
  readonly hotkeys = this.registry.asReadonly();

  private readonly listener = (event: KeyboardEvent) => this.onKeydown(event);

  constructor() {
    document.addEventListener('keydown', this.listener);
  }

  /** Register a hotkey; the returned function unregisters it. */
  register(hotkey: StrctHotkey): () => void {
    this.registry.update((list) => [...list, hotkey]);
    return () => this.registry.update((list) => list.filter((h) => h !== hotkey));
  }

  private onKeydown(event: KeyboardEvent): void {
    const combo = comboOf(event);
    const typing = isTyping(event);
    for (const hk of this.registry()) {
      if (!expand(hk.combo).includes(combo)) continue;
      // While typing, only modifier combos may fire.
      if (typing && !(event.ctrlKey || event.metaKey || event.altKey)) continue;
      event.preventDefault();
      hk.handler(event);
      return;
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.listener);
  }
}

function isTyping(event: KeyboardEvent): boolean {
  const el = event.target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  );
}

/**
 * The hotkey cheatsheet overlay. Mount once near the app root; it registers
 * `?` itself and lists everything in the service, grouped:
 *
 *   <strct-hotkeys-help />
 */
@Component({
  selector: 'strct-hotkeys-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctKbd],
  template: `
    @if (open()) {
      <div class="strct-hkh__backdrop" (click)="open.set(false)"></div>
      <div class="strct-hkh" role="dialog" [attr.aria-label]="title()">
        <div class="strct-hkh__head">
          <span class="strct-hkh__title">{{ title() }}</span>
          <strct-kbd>?</strct-kbd>
        </div>
        @for (group of grouped(); track group.name) {
          <div class="strct-hkh__group">
            <div class="strct-hkh__groupname">{{ group.name }}</div>
            @for (hk of group.keys; track hk.combo + hk.description) {
              <div class="strct-hkh__row">
                <span class="strct-hkh__desc">{{ hk.description }}</span>
                <span class="strct-hkh__keys">
                  @for (part of parts(hk.combo); track $index) {
                    <strct-kbd>{{ part }}</strct-kbd>
                  }
                </span>
              </div>
            }
          </div>
        } @empty {
          <p class="strct-hkh__empty">{{ emptyText() }}</p>
        }
      </div>
    }
  `,
  styles: [
    `
      .strct-hkh__backdrop {
        position: fixed;
        inset: 0;
        z-index: 400;
        background: rgba(0, 0, 0, 0.45);
      }
      .strct-hkh {
        position: fixed;
        z-index: 401;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(420px, calc(100vw - 32px));
        max-height: min(70vh, 520px);
        overflow: auto;
        padding: 16px 18px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 10px;
        box-shadow: var(--shh);
      }
      .strct-hkh__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .strct-hkh__title {
        font-size: 13.5px;
        font-weight: 650;
        color: var(--t1);
      }
      .strct-hkh__group {
        margin-bottom: 12px;
      }
      .strct-hkh__groupname {
        font-size: 10.5px;
        font-weight: 600;
        letter-spacing: 0.7px;
        text-transform: uppercase;
        color: var(--t3);
        margin-bottom: 5px;
      }
      .strct-hkh__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 4px 0;
      }
      .strct-hkh__desc {
        font-size: 12.5px;
        color: var(--t1);
      }
      .strct-hkh__keys {
        display: inline-flex;
        gap: 4px;
      }
      .strct-hkh__empty {
        font-size: 12.5px;
        color: var(--t3);
      }
    `,
  ],
})
export class StrctHotkeysHelp {
  private readonly service = inject(StrctHotkeysService);
  /** Overlay visibility (two-way; `?` toggles it too). */
  readonly open = model(false);
  /** Localizable strings. */
  readonly title = input('Keyboard shortcuts');
  readonly emptyText = input('No shortcuts registered.');

  protected readonly grouped = computed(() => {
    const groups = new Map<string, StrctHotkey[]>();
    for (const hk of this.service.hotkeys()) {
      const name = hk.group ?? 'General';
      const list = groups.get(name);
      if (list) list.push(hk);
      else groups.set(name, [hk]);
    }
    return [...groups.entries()].map(([name, keys]) => ({ name, keys }));
  });

  constructor() {
    const dispose = this.service.register({
      combo: '?',
      description: 'Show this help',
      group: 'General',
      handler: () => this.open.update((v) => !v),
    });
    inject(DestroyRef).onDestroy(dispose);
  }

  // Escape is handled locally — registering it in the service would swallow
  // every Escape in the app (the service preventDefaults on match).
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.open.set(false);
  }

  protected parts(combo: string): string[] {
    return combo.split('+').map((p) => {
      const map: Record<string, string> = {
        mod: '⌘/Ctrl',
        meta: '⌘',
        ctrl: 'Ctrl',
        alt: 'Alt',
        shift: 'Shift',
        escape: 'Esc',
      };
      return map[p.trim().toLowerCase()] ?? p.trim().toUpperCase();
    });
  }
}
