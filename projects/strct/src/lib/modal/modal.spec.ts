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

  it('has no phantom button on the backdrop and ignores keyboard events there', () => {
    const { fixture, host, overlay } = setup(true);
    // The backdrop is pointer-only: no role/tabindex (it was an unnamed, keyboard-
    // unreachable "button" for AT); keyboard dismissal goes through Escape.
    expect(overlay.getAttribute('role')).toBeNull();
    expect(overlay.getAttribute('tabindex')).toBeNull();
    overlay.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    fixture.detectChanges();
    expect(host.open).toBe(true);
  });

  it('never closes a non-dismissible modal on backdrop click', () => {
    const { fixture, host, overlay } = setup(false);
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(host.open).toBe(true);
  });
});

describe('StrctModal — styling hooks', () => {
  it('appends panelClass / backdropClass and defaults to no extra classes', () => {
    const fixture = TestBed.createComponent(StrctModal);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-modal__overlay')!.classList.length).toBe(1);

    fixture.componentRef.setInput('panelClass', 'app-glass');
    fixture.componentRef.setInput('backdropClass', 'app-scrim');
    fixture.detectChanges();
    expect(el.querySelector('.strct-modal__dialog')!.classList).toContain('app-glass');
    expect(el.querySelector('.strct-modal__overlay')!.classList).toContain('app-scrim');
  });

  it('variant="glass" applies the frosted preset classes', () => {
    const fixture = TestBed.createComponent(StrctModal);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('variant', 'glass');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-modal__overlay')!.classList).toContain(
      'strct-modal__overlay--glass',
    );
    expect(el.querySelector('.strct-modal__dialog')!.classList).toContain(
      'strct-modal__dialog--glass',
    );
  });
});

describe('StrctModal — draggable', () => {
  function drag(el: HTMLElement, from: [number, number], to: [number, number]) {
    el.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: from[0], clientY: from[1], bubbles: true }),
    );
    el.dispatchEvent(
      new MouseEvent('pointermove', { clientX: to[0], clientY: to[1], bubbles: true }),
    );
    el.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
  }

  function setup(draggable = true) {
    const fixture = TestBed.createComponent(StrctModal);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('draggable', draggable);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      head: el.querySelector('.strct-modal__head') as HTMLElement,
      dialog: el.querySelector('.strct-modal__dialog') as HTMLElement,
    };
  }

  it('drags the dialog by its header and re-centers on reopen', () => {
    const { fixture, head, dialog } = setup(true);
    expect(head.classList).toContain('strct-modal__head--drag');

    drag(head, [100, 100], [140, 130]);
    fixture.detectChanges();
    expect(dialog.style.transform).toBe('translate(40px, 30px)');

    // Close + reopen → centered again.
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const reopened = (fixture.nativeElement as HTMLElement).querySelector(
      '.strct-modal__dialog',
    ) as HTMLElement;
    expect(reopened.style.transform).toBe('');
  });

  it('does not start a drag from the close button', () => {
    const { fixture, el, dialog } = setup(true);
    const close = el.querySelector('.strct-modal__close') as HTMLElement;
    drag(close, [10, 10], [60, 60]);
    fixture.detectChanges();
    expect(dialog.style.transform).toBe('');
  });

  it('is inert without draggable', () => {
    const { fixture, head, dialog } = setup(false);
    expect(head.classList).not.toContain('strct-modal__head--drag');
    drag(head, [100, 100], [160, 160]);
    fixture.detectChanges();
    expect(dialog.style.transform).toBe('');
  });
});

describe('StrctModal chromeless (wizard-hosting mode)', () => {
  @Component({
    imports: [StrctModal],
    template: `<strct-modal [open]="true" chromeless title="Create virtual machine">
      <div class="hosted">wizard here</div>
      <ng-container strctModalFooter><button>ignored</button></ng-container>
    </strct-modal>`,
  })
  class ChromelessHost {}

  it('suppresses head, body padding and footer; title still names the dialog', () => {
    const fixture = TestBed.createComponent(ChromelessHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const dialog = el.querySelector('.strct-modal__dialog')!;
    expect(dialog.classList).toContain('strct-modal__dialog--chromeless');
    expect(el.querySelector('.strct-modal__head')).toBeNull();
    expect(el.querySelector('.strct-modal__foot')).toBeNull();
    expect(el.querySelector('.hosted')).toBeTruthy();
    // The head (and its labelled title) is gone — aria-label carries the name.
    expect(dialog.getAttribute('aria-label')).toBe('Create virtual machine');
    expect(dialog.getAttribute('aria-labelledby')).toBeNull();
  });
});
