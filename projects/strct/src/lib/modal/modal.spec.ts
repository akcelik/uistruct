import { Component, ChangeDetectionStrategy, OnDestroy, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctModal, StrctModalContent } from './modal';
import { resetStrctDevWarnings } from '../util/dev-warn';

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
  changeDetection: ChangeDetectionStrategy.Eager,
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

describe('StrctModal — body scroll lock', () => {
  it('locks body scroll while open and restores it after close', () => {
    const fixture = TestBed.createComponent(StrctModal);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('');
  });

  it('keeps the lock until the last of two stacked modals closes', () => {
    const first = TestBed.createComponent(StrctModal);
    first.componentRef.setInput('open', true);
    first.detectChanges();
    const second = TestBed.createComponent(StrctModal);
    second.componentRef.setInput('open', true);
    second.detectChanges();

    first.componentRef.setInput('open', false);
    first.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');

    second.componentRef.setInput('open', false);
    second.detectChanges();
    expect(document.body.style.overflow).toBe('');
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

describe('StrctModal — stacked Escape', () => {
  @Component({
    imports: [StrctModal],
    template: `
      <strct-modal [(open)]="firstOpen" dismissible>first</strct-modal>
      <strct-modal [(open)]="secondOpen" dismissible>second</strct-modal>
    `,
  })
  class StackedHostComponent {
    firstOpen = true;
    secondOpen = true;
  }

  function escape() {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }

  it('Escape closes only the topmost modal, then the next one', () => {
    const fixture = TestBed.createComponent(StackedHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    escape();
    fixture.detectChanges();
    expect(host.firstOpen).toBe(true);
    expect(host.secondOpen).toBe(false);

    escape();
    fixture.detectChanges();
    expect(host.firstOpen).toBe(false);
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

describe('StrctModal lazy content (strctModalContent)', () => {
  let created = 0;
  let destroyed = 0;

  @Component({ selector: 'app-expensive', template: 'expensive' })
  class Expensive implements OnDestroy {
    constructor() {
      created++;
    }
    ngOnDestroy(): void {
      destroyed++;
    }
  }

  @Component({
    imports: [StrctModal, StrctModalContent, Expensive],
    template: `
      <strct-modal [open]="open()" title="Lazy">
        <ng-template strctModalContent><app-expensive /></ng-template>
      </strct-modal>
      <strct-modal [open]="false" title="Eager"><app-expensive /></strct-modal>
    `,
  })
  class LazyHost {
    readonly open = signal(false);
  }

  beforeEach(() => {
    created = 0;
    destroyed = 0;
  });

  it('builds nothing while closed, builds on open, destroys on close', () => {
    const fixture = TestBed.createComponent(LazyHost);
    fixture.detectChanges();
    // Only the plainly projected copy exists: Angular instantiates projected
    // content with the parent even though that modal is closed.
    expect(created).toBe(1);

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    expect(created).toBe(2);
    expect(document.body.textContent).toContain('expensive');

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    expect(destroyed).toBe(1);
  });
});

describe('StrctModal chromeless + size diagnostic', () => {
  beforeEach(() => resetStrctDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  function render(size: string, chromeless: boolean) {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fixture = TestBed.createComponent(StrctModal);
    fixture.componentRef.setInput('size', size);
    fixture.componentRef.setInput('chromeless', chromeless);
    fixture.detectChanges();
    return warn.mock.calls.map((c) => String(c[0]));
  }

  it('says that size is ignored and where the real width lever is', () => {
    const [msg, ...rest] = render('xl', true);
    expect(rest).toEqual([]);
    expect(msg).toContain('[strct-modal] size="xl" has no effect with chromeless');
    expect(msg).toContain('set --strct-wiz-content-min on the strct-modal or an ancestor');
  });

  it('is quiet for the default size, and for size without chromeless', () => {
    expect(render('sm', true)).toEqual([]);
    expect(render('xl', false)).toEqual([]);
  });
});
