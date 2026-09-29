import { TestBed } from '@angular/core/testing';
import {
  StrctCard,
  StrctCardHeader,
  StrctCardBlock,
  StrctCardFooter,
  StrctCardHeaderMeta,
  StrctCardHeaderNote,
  StrctCardHeaderActions,
} from './card';
import { StrctStatus } from '../status';

describe('StrctCard', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctCard);
    fixture.detectChanges();

    expect(fixture.nativeElement).toBeTruthy();
  });
});

import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  imports: [StrctCard, StrctCardHeader, StrctCardBlock, StrctCardFooter],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-card
      [status]="status"
      [interactive]="interactive"
      [selected]="selected"
      [loading]="loading"
      [collapsible]="collapsible"
      [(collapsed)]="collapsed"
    >
      <strct-card-header icon="host">Title</strct-card-header>
      <strct-card-block>Body</strct-card-block>
      <strct-card-footer>Foot</strct-card-footer>
    </strct-card>
  `,
})
class RichHost {
  status: StrctStatus = 'neutral';
  interactive = false;
  selected = false;
  loading = false;
  collapsible = false;
  collapsed = false;
}

describe('StrctCard — rich options', () => {
  function setup(patch: Partial<RichHost> = {}) {
    const fixture = TestBed.createComponent(RichHost);
    Object.assign(fixture.componentInstance, patch);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('strct-card') as HTMLElement;
    return { fixture, host: fixture.componentInstance, card };
  }

  it('applies status / interactive / selected host classes', () => {
    const { card } = setup({ status: 'warning', interactive: true, selected: true });
    expect(card.classList).toContain('strct-card--warning');
    expect(card.classList).toContain('strct-card--interactive');
    expect(card.classList).toContain('strct-card--selected');
  });

  it('marks loading cards busy for assistive tech', () => {
    const { card } = setup({ loading: true });
    expect(card.getAttribute('aria-busy')).toBe('true');
    expect(card.classList).toContain('strct-card--loading');
  });

  it('renders a header icon when given', () => {
    const { card } = setup();
    expect(card.querySelector('.strct-card__hicon')).toBeTruthy();
  });

  it('collapsible: shows a labeled chevron that toggles the two-way collapsed state', () => {
    const { fixture, host, card } = setup({ collapsible: true });
    const btn = card.querySelector('.strct-card__collapse') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    btn.click();
    fixture.detectChanges();
    expect(host.collapsed).toBe(true);
    expect(card.classList).toContain('strct-card--collapsed');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows no chevron on a plain (non-collapsible) card', () => {
    const { card } = setup();
    expect(card.querySelector('.strct-card__collapse')).toBeNull();
  });
});

describe('StrctCardHeader', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctCardHeader);
    fixture.detectChanges();

    expect(fixture.nativeElement).toBeTruthy();
  });
});

describe('StrctCardBlock', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctCardBlock);
    fixture.detectChanges();

    expect(fixture.nativeElement).toBeTruthy();
  });
});

describe('StrctCardFooter', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctCardFooter);
    fixture.detectChanges();

    expect(fixture.nativeElement).toBeTruthy();
  });
});

describe('StrctCardHeader — heading, meta, note, actions (FR-48-14)', () => {
  @Component({
    imports: [
      StrctCard,
      StrctCardHeader,
      StrctCardHeaderMeta,
      StrctCardHeaderNote,
      StrctCardHeaderActions,
    ],
    template: `
      <strct-card>
        <strct-card-header icon="storage" heading="Capacity" appearance="overline">
          <span strctCardHeaderMeta class="meta">92% used</span>
          <span strctCardHeaderNote class="note">read 2 min ago</span>
          <button strctCardHeaderActions class="act">Rename…</button>
        </strct-card-header>
      </strct-card>
    `,
  })
  class SlotHost {}

  it('orders icon · heading · meta, then the note and actions at the end', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const main = el.querySelector('.strct-card__hmain')!;
    const end = el.querySelector('.strct-card__hend')!;
    expect(main.querySelector('.strct-card__hicon')).toBeTruthy();
    expect(main.querySelector('.strct-card__htitle')!.textContent!.trim()).toBe('Capacity');
    expect(main.querySelector('.meta')).toBeTruthy();
    expect(end.querySelector('.note')).toBeTruthy();
    expect(end.querySelector('.act')).toBeTruthy();
    expect(el.querySelector('.strct-card__header')!.classList).toContain(
      'strct-card__header--overline',
    );
  });

  @Component({
    imports: [StrctCard, StrctCardHeader],
    template: `<strct-card
      ><strct-card-header><span class="legacy">Hosts</span></strct-card-header></strct-card
    >`,
  })
  class LegacyHost {}

  it('a header that only projects content renders as before', () => {
    const fixture = TestBed.createComponent(LegacyHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-card__hmain .legacy')).toBeTruthy();
    expect(el.querySelector('.strct-card__htitle')).toBeNull();
    expect(el.querySelector('.strct-card__header')!.classList).not.toContain(
      'strct-card__header--overline',
    );
  });
});
