import { TestBed } from '@angular/core/testing';
import { StrctCard, StrctCardHeader, StrctCardBlock, StrctCardFooter } from './card';

describe('StrctCard', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctCard);
    fixture.detectChanges();

    expect(fixture.nativeElement).toBeTruthy();
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
