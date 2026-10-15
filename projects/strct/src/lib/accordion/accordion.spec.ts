import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctAccordion, StrctAccordionPanel, StrctAccordionPanelMeta } from './accordion';

describe('StrctAccordion', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctAccordion);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-accordion');
  });
});

describe('StrctAccordionPanel', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctAccordionPanel);
    fixture.componentRef.setInput('heading', 'Test');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-acc');
  });

  it('reflects the expanded input', () => {
    const fixture = TestBed.createComponent(StrctAccordionPanel);
    fixture.componentRef.setInput('heading', 'Test');
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.strct-acc__body')).toBeTruthy();
  });

  it('wires the APG header/body association', () => {
    const fixture = TestBed.createComponent(StrctAccordionPanel);
    fixture.componentRef.setInput('heading', 'Test');
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const head = host.querySelector<HTMLButtonElement>('.strct-acc__head')!;
    const body = host.querySelector<HTMLElement>('.strct-acc__body')!;
    expect(head.getAttribute('aria-controls')).toBe(body.id);
    expect(body.getAttribute('role')).toBe('region');
    expect(body.getAttribute('aria-labelledby')).toBe(head.id);
  });

  it('generates unique ids per panel', () => {
    const a = TestBed.createComponent(StrctAccordionPanel);
    a.componentRef.setInput('heading', 'A');
    const b = TestBed.createComponent(StrctAccordionPanel);
    b.componentRef.setInput('heading', 'B');
    a.detectChanges();
    b.detectChanges();

    const headA = a.nativeElement.querySelector('.strct-acc__head') as HTMLElement;
    const headB = b.nativeElement.querySelector('.strct-acc__head') as HTMLElement;
    expect(headA.id).not.toBe(headB.id);
  });

  it('renders a quiet fold without the box (FR-48-38)', () => {
    const fixture = TestBed.createComponent(StrctAccordionPanel);
    fixture.componentRef.setInput('heading', 'How backup works');
    fixture.componentRef.setInput('appearance', 'quiet');
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList).toContain('strct-acc--quiet');
    // the semantics a raw <details> never had are unchanged
    const head = el.querySelector('.strct-acc__head') as HTMLElement;
    const body = el.querySelector('.strct-acc__body') as HTMLElement;
    expect(head.tagName).toBe('BUTTON');
    expect(head.getAttribute('aria-expanded')).toBe('true');
    expect(body.getAttribute('role')).toBe('region');
    expect(body.getAttribute('aria-labelledby')).toBe(head.id);
  });
});

// FR-55-01 — a result in the panel's header, and the tone that says it twice.
describe('StrctAccordionPanel — a header that carries the result', () => {
  @Component({
    imports: [StrctAccordionPanel, StrctAccordionPanelMeta],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
      <strct-accordion-panel heading="Cluster time" status="critical">
        <span strctAccordionPanelMeta class="result">Failed</span>
        <p>Two hosts are 4 minutes apart.</p>
      </strct-accordion-panel>
      <strct-accordion-panel heading="Datastore space">
        <p>Fine.</p>
      </strct-accordion-panel>
    `,
  })
  class Host {}

  function build() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('keeps the meta out of the button and in its description', () => {
    const { el } = build();
    const panel = el.querySelector('strct-accordion-panel')!;
    const button = panel.querySelector('button')!;
    const meta = panel.querySelector('.result')!;

    // The button is called by its heading alone — not "Cluster time Failed".
    expect(button.textContent!.trim()).toBe('Cluster time');
    expect(button.contains(meta)).toBe(false);
    // …and the result is read after it.
    expect(button.getAttribute('aria-describedby')).toBe(
      panel.querySelector('.strct-acc__meta')!.id,
    );
  });

  it('wears the result as a tone rail, and says nothing when there is none', () => {
    const { el } = build();
    const [failed, fine] = [...el.querySelectorAll('strct-accordion-panel')];
    expect(failed.classList).toContain('strct-acc--critical');
    expect(fine.classList.toString()).not.toContain('strct-acc--');
    // A panel with nothing beside its title describes nothing.
    expect(fine.querySelector('button')!.getAttribute('aria-describedby')).toBeNull();
  });

  it('still opens and closes from the header button', () => {
    const { fixture, el } = build();
    const panel = el.querySelector('strct-accordion-panel')!;
    const button = panel.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(panel.querySelector('[role="region"]')).toBeTruthy();
  });
});
