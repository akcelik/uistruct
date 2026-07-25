import { TestBed } from '@angular/core/testing';
import { StrctAccordion, StrctAccordionPanel } from './accordion';

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
});
