import { TestBed } from '@angular/core/testing';
import { StrctStack, StrctStackItem } from './stack';

describe('StrctStack', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctStack);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-stack');
  });

  it('renders a real description list', () => {
    const fixture = TestBed.createComponent(StrctStack);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('dl.strct-stack__list'),
    ).toBeTruthy();
  });
});

describe('StrctStackItem', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctStackItem);
    fixture.componentRef.setInput('label', 'Key');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-stack__item');
  });

  it('renders the label as dt and the value as dd', () => {
    const fixture = TestBed.createComponent(StrctStackItem);
    fixture.componentRef.setInput('label', 'Key');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('dt.strct-stack__label')?.textContent).toContain('Key');
    expect(el.querySelector('dd.strct-stack__value')).toBeTruthy();
  });
});
