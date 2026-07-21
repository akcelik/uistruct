import { Injectable, OnDestroy } from '@angular/core';

/**
 * Screen-reader announcements for state changes that have no visible text —
 * "12 rows loaded", "Snapshot created" (Material's LiveAnnouncer, strct-sized):
 *
 *   private announcer = inject(StrctAnnouncer);
 *   this.announcer.announce('12 rows loaded');
 *
 * Maintains one visually-hidden live region per politeness level; repeated
 * identical messages are re-announced (the region is cleared first).
 */
@Injectable({ providedIn: 'root' })
export class StrctAnnouncer implements OnDestroy {
  private regions = new Map<'polite' | 'assertive', HTMLElement>();
  private clearTimer: ReturnType<typeof setTimeout> | undefined;

  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    const region = this.regionFor(politeness);
    // Clear first so identical consecutive messages still fire.
    region.textContent = '';
    setTimeout(() => (region.textContent = message));
    clearTimeout(this.clearTimer);
    // Stale announcements should not linger for the next SR user to stumble on.
    this.clearTimer = setTimeout(() => (region.textContent = ''), 10_000);
  }

  private regionFor(politeness: 'polite' | 'assertive'): HTMLElement {
    let region = this.regions.get(politeness);
    if (!region) {
      region = document.createElement('div');
      region.setAttribute('aria-live', politeness);
      region.setAttribute('aria-atomic', 'true');
      region.className = 'strct-announcer';
      region.style.cssText =
        'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;';
      document.body.appendChild(region);
      this.regions.set(politeness, region);
    }
    return region;
  }

  ngOnDestroy(): void {
    clearTimeout(this.clearTimer);
    for (const region of this.regions.values()) region.remove();
    this.regions.clear();
  }
}
