import { TestBed } from '@angular/core/testing';
import { StrctStack, StrctStackItem } from './stack';

describe('StrctStack', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctStack);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-stack');
  });
});

describe('StrctStackItem', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctStackItem);
    fixture.componentRef.setInput('label', 'Key');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-stack__item');
  });
});
