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
});
