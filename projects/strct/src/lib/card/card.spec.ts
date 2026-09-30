import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctBadge } from '../badge/badge';
import {
  StrctCard,
  StrctCardHeader,
  StrctCardHeaderLeading,
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

// FR-49-08 / FR-49-09 — the title joins the outline, wraps, and can be led;
// a row of cards puts its actions on one line.
describe('StrctCard — heading level, wrap, leading slot, fill', () => {
  @Component({
    imports: [StrctCard, StrctCardHeader, StrctCardHeaderLeading, StrctCardHeaderMeta, StrctBadge],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
      <strct-card [fill]="fill()">
        <strct-card-header heading="Host Update Manager" [level]="level()" [wrap]="wrap()">
          <span strctCardHeaderLeading class="grip">⠿</span>
          <strct-badge strctCardHeaderMeta status="success">Healthy</strct-badge>
        </strct-card-header>
      </strct-card>
    `,
  })
  class Host {
    level = signal<2 | 3 | 4 | 5 | 6 | null>(null);
    wrap = signal(false);
    fill = signal(false);
  }

  function build() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  it('renders a span by default and the real heading element at a level', () => {
    const { fixture, host, el } = build();
    const title = () => el.querySelector('.strct-card__htitle')!;
    expect(title().tagName).toBe('SPAN');

    for (const level of [2, 3, 4, 5, 6] as const) {
      host.level.set(level);
      fixture.detectChanges();
      expect(title().tagName).toBe('H' + level);
      expect(title().textContent!.trim()).toBe('Host Update Manager');
    }

    host.level.set(null);
    fixture.detectChanges();
    expect(title().tagName).toBe('SPAN');
  });

  it('wrap is opt-in and marks the header', () => {
    const { fixture, host, el } = build();
    const header = el.querySelector('.strct-card__header')!;
    expect(header.classList).not.toContain('strct-card__header--wrap');
    host.wrap.set(true);
    fixture.detectChanges();
    expect(header.classList).toContain('strct-card__header--wrap');
  });

  it('projects a leading slot before the title, and fill marks the card', () => {
    const { fixture, host, el } = build();
    const main = el.querySelector('.strct-card__hmain')!;
    const kids = [...main.children].map((c) => c.className || c.tagName.toLowerCase());
    expect(kids[0]).toContain('grip');
    expect(el.querySelector('.strct-card')!.classList).not.toContain('strct-card--fill');
    host.fill.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.strct-card')!.classList).toContain('strct-card--fill');
  });
});
