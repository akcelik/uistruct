import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctDrawer } from './drawer';

describe('StrctDrawer', () => {
  it('renders nothing when closed', () => {
    const f = TestBed.createComponent(StrctDrawer);
    f.detectChanges();

    expect((f.nativeElement as HTMLElement).querySelector('.strct-drawer')).toBeNull();
  });

  it('renders the panel with the side + size modifier classes when open', () => {
    const f = TestBed.createComponent(StrctDrawer);
    f.componentRef.setInput('open', true);
    f.componentRef.setInput('side', 'start');
    f.componentRef.setInput('size', 'lg');
    f.detectChanges();

    const panel = (f.nativeElement as HTMLElement).querySelector('.strct-drawer');
    expect(panel).not.toBeNull();
    expect(panel!.classList).toContain('strct-drawer--start');
    expect(panel!.classList).toContain('strct-drawer--lg');
  });

  it('close() sets open to false and removes the panel', () => {
    const f = TestBed.createComponent(StrctDrawer);
    f.componentRef.setInput('open', true);
    f.detectChanges();

    f.componentInstance.close();
    f.detectChanges();

    expect(f.componentInstance.open()).toBe(false);
    expect((f.nativeElement as HTMLElement).querySelector('.strct-drawer')).toBeNull();
  });
});

@Component({
  imports: [StrctDrawer],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-drawer [(open)]="open" [dismissable]="dismissable" [title]="title">
      <button class="inside">Inside</button>
    </strct-drawer>
  `,
})
class HostComponent {
  open = false;
  dismissable = true;
  title = '';
}

// Bindings are set before the first change detection: mutating a two-way
// bound host property afterwards trips NG0100, so open/close transitions
// after setup are driven through the component (Escape, clicks, close()).
function setup(initial: { open?: boolean; dismissable?: boolean; title?: string } = {}) {
  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, initial);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, host: fixture.componentInstance, el };
}

describe('StrctDrawer — dismissal', () => {
  function escape() {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }

  it('Escape closes a dismissable drawer, not a non-dismissable one', () => {
    const dismissable = setup({ open: true });
    escape();
    dismissable.fixture.detectChanges();
    expect(dismissable.host.open).toBe(false);

    const persistent = setup({ open: true, dismissable: false });
    escape();
    persistent.fixture.detectChanges();
    expect(persistent.host.open).toBe(true);
  });

  it('a backdrop click closes a dismissable drawer', () => {
    const { fixture, host, el } = setup({ open: true });
    el.querySelector<HTMLElement>('.strct-drawer__backdrop')!.click();
    fixture.detectChanges();
    expect(host.open).toBe(false);
  });

  it('marks the backdrop as bare (click-through) when not dismissable', () => {
    const { el } = setup({ open: true, dismissable: false });
    const backdrop = el.querySelector<HTMLElement>('.strct-drawer__backdrop')!;
    expect(backdrop.classList).toContain('strct-drawer__backdrop--bare');
  });
});

describe('StrctDrawer — focus lifecycle', () => {
  it('moves focus into the panel on open and restores it on close', async () => {
    const trigger = document.body.appendChild(document.createElement('button'));
    const fixture = TestBed.createComponent(StrctDrawer);
    fixture.detectChanges();

    trigger.focus();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r)); // focusInitial

    const panel = (fixture.nativeElement as HTMLElement).querySelector('.strct-drawer')!;
    expect(panel.contains(document.activeElement)).toBe(true);

    fixture.componentInstance.close();
    fixture.detectChanges();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('focuses the panel itself when there is nothing tabbable inside', async () => {
    const fixture = TestBed.createComponent(StrctDrawer);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('dismissable', false);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r)); // focusInitial

    const panel = (fixture.nativeElement as HTMLElement).querySelector('.strct-drawer')!;
    expect(document.activeElement).toBe(panel);
  });

  it('keeps Tab inside the panel, wrapping from last to first', async () => {
    const { fixture, el } = setup({ open: true });
    await new Promise((r) => setTimeout(r)); // focusInitial
    fixture.detectChanges();

    const closeBtn = el.querySelector<HTMLElement>('.strct-drawer__close')!;
    const inside = el.querySelector<HTMLElement>('.inside')!;
    inside.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    inside.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(closeBtn);
  });
});

describe('StrctDrawer — body scroll lock', () => {
  it('locks body scroll while open and restores it on close', () => {
    const { fixture, el } = setup({ open: true });
    expect(document.body.style.overflow).toBe('hidden');

    el.querySelector<HTMLElement>('.strct-drawer__close')!.click();
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('');
  });
});

describe('StrctDrawer — localizable labels', () => {
  it('names the dialog from title, else ariaLabel; labels the close button', () => {
    const fixture = TestBed.createComponent(StrctDrawer);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-drawer')!.getAttribute('aria-label')).toBe('Panel');
    expect(el.querySelector('.strct-drawer__close')!.getAttribute('aria-label')).toBe('Close');

    fixture.componentRef.setInput('ariaLabel', 'Inspection panel');
    fixture.componentRef.setInput('closeLabel', 'Dismiss');
    fixture.detectChanges();
    expect(el.querySelector('.strct-drawer')!.getAttribute('aria-label')).toBe('Inspection panel');
    expect(el.querySelector('.strct-drawer__close')!.getAttribute('aria-label')).toBe('Dismiss');

    // A title wins over ariaLabel.
    fixture.componentRef.setInput('title', 'Virtual machine');
    fixture.detectChanges();
    expect(el.querySelector('.strct-drawer')!.getAttribute('aria-label')).toBe('Virtual machine');
  });
});
