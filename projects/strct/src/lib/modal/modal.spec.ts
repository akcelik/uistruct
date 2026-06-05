import { TestBed } from '@angular/core/testing';
import { StrctModal } from './modal';

describe('StrctModal', () => {
  it('reflects the open input binding', () => {
    const fixture = TestBed.createComponent(StrctModal);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.strct-modal__overlay')).toBeTruthy();
  });

  it('does not render the overlay when open is false', () => {
    const fixture = TestBed.createComponent(StrctModal);
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.strct-modal__overlay')).toBeFalsy();
  });
});
