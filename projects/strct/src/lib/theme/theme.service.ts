import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';

/** Available color palettes. */
export type StrctPalette = 'arctic' | 'ember' | 'sage';
/** Light or dark mode. */
export type StrctMode = 'dark' | 'light';

/** Metadata for a color palette. */
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

    // Palette: stored choice, else whatever the host declared, else default.
    this.applyPalette(
      storedPalette ?? (root.getAttribute('data-palette') as StrctPalette | null) ?? 'arctic',
    );

    // Mode: an explicit stored choice always wins. Otherwise follow the operating
    // system's light/dark preference — and keep following it live — so a user
    // working at night / in a dim room is never forced onto a bright screen. The
    // initial resolution is NOT persisted, so it stays OS-driven until the user
    // makes a deliberate choice via setMode/toggleMode.
    if (storedMode) {
      this.applyMode(storedMode);
    } else {
      // OS preference wins over a host-declared default; the attribute is only a
      // fallback for environments without matchMedia (SSR).
      this.applyMode(
        this.systemMode() ?? (root.getAttribute('data-theme') as StrctMode | null) ?? 'dark',
      );
      this.watchSystemMode();
    }
  }

  setPalette(palette: StrctPalette): void {
    this.applyPalette(palette);
    this.write(PALETTE_KEY, palette);
  }

  setMode(mode: StrctMode): void {
    this.applyMode(mode);
    this.write(MODE_KEY, mode);
  }

  private applyPalette(palette: StrctPalette): void {
    this._palette.set(palette);
    this.doc.documentElement.setAttribute('data-palette', palette);
  }

  private applyMode(mode: StrctMode): void {
    this._mode.set(mode);
    this.doc.documentElement.setAttribute('data-theme', mode);
  }

  /** The OS-level light/dark preference, or null when matchMedia is unavailable. */
  private systemMode(): StrctMode | null {
    try {
      const view = this.doc.defaultView;
      if (!view?.matchMedia) return null;
      return view.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return null;
    }
  }

  /** Track OS theme changes until the user makes an explicit choice. */
  private watchSystemMode(): void {
    try {
      const mq = this.doc.defaultView?.matchMedia('(prefers-color-scheme: dark)');
      mq?.addEventListener('change', (e: MediaQueryListEvent) => {
        if (this.read(MODE_KEY)) return; // user has since chosen — stop following
        this.applyMode(e.matches ? 'dark' : 'light');
      });
    } catch {
      // matchMedia unavailable (SSR) — stay on the resolved default.
    }
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
