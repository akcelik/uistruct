import { TestBed } from '@angular/core/testing';
import { StrctCard, StrctCardHeader, StrctCardBlock, StrctCardFooter } from './card';
import { StrctStatus } from '../status';

describe('StrctCard', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctCard);
    fixture.detectChanges();

    expect(fixture.nativeElement).toBeTruthy();
  });
});

import { Component } from '@angular/core';

@Component({
  imports: [StrctCard, StrctCardHeader, StrctCardBlock, StrctCardFooter],
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
