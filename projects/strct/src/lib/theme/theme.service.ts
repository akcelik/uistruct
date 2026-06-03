import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';

export type StrctPalette = 'arctic' | 'ember' | 'sage';
export type StrctMode = 'dark' | 'light';

export interface StrctPaletteInfo {
  id: StrctPalette;
  /** Human label, shown in switchers. */
  label: string;
  /** Swatch color used by the palette dot. */
  swatch: string;
}

/** All palettes the token system ships with, in display order. */
export const STRCT_PALETTES: readonly StrctPaletteInfo[] = [
  { id: 'arctic', label: 'Arctic Steel', swatch: '#5a7ea3' },
  { id: 'ember', label: 'Warm Ember', swatch: '#96724e' },
  { id: 'sage', label: 'Forest Sage', swatch: '#4e8a68' },
];

const PALETTE_KEY = 'strct-palette';
const MODE_KEY = 'strct-theme';

/**
 * Owns the active palette + light/dark mode. Writes `data-palette` and
 * `data-theme` onto the document root (which the token layer keys off) and
 * persists the choice to localStorage. Inject it anywhere and read the signals
 * or call the setters.
 */
@Injectable({ providedIn: 'root' })
export class StrctThemeService {
  private readonly doc = inject(DOCUMENT);

  private readonly _palette = signal<StrctPalette>('arctic');
  private readonly _mode = signal<StrctMode>('dark');

  readonly palette = this._palette.asReadonly();
  readonly mode = this._mode.asReadonly();
  readonly palettes = STRCT_PALETTES;
  readonly isDark = computed(() => this._mode() === 'dark');

  constructor() {
    const root = this.doc.documentElement;
    const storedPalette = this.read(PALETTE_KEY) as StrctPalette | null;
    const storedMode = this.read(MODE_KEY) as StrctMode | null;

    // Fall back to whatever the host page already declared, then to defaults.
    const palette =
      storedPalette ?? (root.getAttribute('data-palette') as StrctPalette | null) ?? 'arctic';
    const mode = storedMode ?? (root.getAttribute('data-theme') as StrctMode | null) ?? 'dark';

    this.setPalette(palette);
    this.setMode(mode);
  }

  setPalette(palette: StrctPalette): void {
    this._palette.set(palette);
    this.doc.documentElement.setAttribute('data-palette', palette);
    this.write(PALETTE_KEY, palette);
  }

  setMode(mode: StrctMode): void {
    this._mode.set(mode);
    this.doc.documentElement.setAttribute('data-theme', mode);
    this.write(MODE_KEY, mode);
  }

  toggleMode(): void {
    this.setMode(this._mode() === 'dark' ? 'light' : 'dark');
  }

  private read(key: string): string | null {
    try {
      return this.doc.defaultView?.localStorage.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      this.doc.defaultView?.localStorage.setItem(key, value);
    } catch {
      // Storage unavailable (private mode / SSR) — choice is session-only.
    }
  }
}
