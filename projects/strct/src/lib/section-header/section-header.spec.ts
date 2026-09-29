import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  StrctSectionHeader,
  StrctSectionHeaderActions,
  StrctSectionHeaderMeta,
} from './section-header';

describe('StrctSectionHeader (FR-48-13)', () => {
  function make(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(StrctSectionHeader);
    fixture.componentRef.setInput('heading', 'Proxy');
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders a real heading at the given level, defaulting to h2', () => {
    expect(make({}).querySelector('h2')!.textContent!.trim()).toBe('Proxy');
    expect(make({ level: 3 }).querySelector('h3')).toBeTruthy();
    expect(make({ level: 6 }).querySelector('h6')).toBeTruthy();
    // Not a div with a role, and never role="separator" (that is a divider).
    expect(make({ level: 4 }).querySelector('[role]')).toBeNull();
  });

  it('keeps the level independent of the look', () => {
    const el = make({ level: 3, appearance: 'overline' });
    const heading = el.querySelector('h3')!;
    expect(heading).toBeTruthy();
    expect(el.classList).toContain('strct-sech--overline');
    // The outline is the level; the uppercase treatment is only a class.
    expect(heading.tagName).toBe('H3');
  });

  it('renders the description as a paragraph, and nothing when empty', () => {
    expect(
      make({ description: 'How the appliance reaches the internet.' }).querySelector('p')!
        .textContent,
    ).toContain('How the appliance');
    expect(make({}).querySelector('p')).toBeNull();
  });

  @Component({
    imports: [StrctSectionHeader, StrctSectionHeaderMeta, StrctSectionHeaderActions],
    template: `
      <strct-section-header heading="Proxy" [level]="3">
        <span strctSectionHeaderMeta class="meta">Tested</span>
        <button strctSectionHeaderActions class="act">Edit…</button>
      </strct-section-header>
    `,
  })
  class SlotHost {}

  it('places meta on the heading row and actions at its end', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-sech__meta .meta')).toBeTruthy();
    expect(el.querySelector('.strct-sech__actions .act')).toBeTruthy();
    // Both live in the heading row, so they sit on the heading's line.
    expect(el.querySelector('.strct-sech__row .strct-sech__meta')).toBeTruthy();
    expect(el.querySelector('.strct-sech__row .strct-sech__actions')).toBeTruthy();
  });
});
