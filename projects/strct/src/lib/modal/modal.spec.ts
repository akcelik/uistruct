import { Component } from '@angular/core';
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

@Component({
  imports: [StrctModal],
  template: `
    <strct-modal [(open)]="open" [dismissible]="dismissible">
      <input class="field" />
    </strct-modal>
  `,
})
class HostComponent {
  open = true;
  dismissible = true;
}

describe('StrctModal — backdrop close guard', () => {
  function setup(dismissible = true) {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.dismissible = dismissible;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      overlay: el.querySelector('.strct-modal__overlay') as HTMLElement,
      field: el.querySelector('input.field') as HTMLElement,
    };
  }

  it('does NOT close a dismissible modal when Space bubbles from a field', () => {
    const { fixture, host, field } = setup(true);
    field.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    fixture.detectChanges();
    expect(host.open).toBe(true);
  });

  it('does NOT close a dismissible modal when Enter bubbles from a field', () => {
    const { fixture, host, field } = setup(true);
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(host.open).toBe(true);
  });

  it('closes a dismissible modal on a real backdrop click', () => {
    const { fixture, host, overlay } = setup(true);
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(host.open).toBe(false);
  });

  it('closes a dismissible modal on Space while the backdrop itself is focused', () => {
    const { fixture, host, overlay } = setup(true);
    overlay.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    fixture.detectChanges();
    expect(host.open).toBe(false);
  });

  it('never closes a non-dismissible modal on backdrop click', () => {
    const { fixture, host, overlay } = setup(false);
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(host.open).toBe(true);
  });
});
