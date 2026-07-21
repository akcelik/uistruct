import { TestBed } from '@angular/core/testing';
import { StrctAnnouncer } from './announcer';

describe('StrctAnnouncer', () => {
  it('creates one hidden live region per politeness and announces into it', async () => {
    const announcer = TestBed.inject(StrctAnnouncer);
    announcer.announce('12 rows loaded');
    await new Promise((r) => setTimeout(r, 10));
    const region = document.querySelector('.strct-announcer')!;
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent).toBe('12 rows loaded');

    announcer.announce('disk failure', 'assertive');
    await new Promise((r) => setTimeout(r, 10));
    const regions = document.querySelectorAll('.strct-announcer');
    expect(regions.length).toBe(2);
    expect(regions[1].getAttribute('aria-live')).toBe('assertive');
    expect(regions[1].textContent).toBe('disk failure');
  });

  it('re-announces identical consecutive messages (clear-then-set)', async () => {
    const announcer = TestBed.inject(StrctAnnouncer);
    announcer.announce('saved');
    await new Promise((r) => setTimeout(r, 10));
    announcer.announce('saved');
    // Immediately after the second call the region is cleared…
    const region = document.querySelector('.strct-announcer')!;
    expect(region.textContent).toBe('');
    await new Promise((r) => setTimeout(r, 10));
    // …then repopulated, which is what makes SRs speak it again.
    expect(region.textContent).toBe('saved');
  });
});
