import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctDropdown, StrctDropdownItem, StrctDropdownTrigger } from './dropdown';

@Component({
  imports: [StrctDropdown, StrctDropdownItem, StrctDropdownTrigger],
  template: `
    <strct-dropdown [popover]="popover()" popoverLabel="Filters">
      <button strctDropdownTrigger>Open</button>
      <input class="inner-control" />
      <strct-dropdown-item>Rename</strct-dropdown-item>
    </strct-dropdown>
  `,
})
class HostComponent {
  popover = signal(false);
}

function setup(popover: boolean) {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.popover.set(popover);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const trigger = el.querySelector<HTMLElement>('.strct-dd__trigger')!;
  const triggerBtn = el.querySelector<HTMLElement>('[strctDropdownTrigger]')!;
  return { fixture, el, trigger, triggerBtn };
}

describe('StrctDropdown', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctDropdown);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-dd');
  });

  it('menu mode: aria-haspopup=menu on the real button, role=menu, inner click closes', () => {
    const { fixture, el, trigger, triggerBtn } = setup(false);
    expect(triggerBtn.getAttribute('aria-haspopup')).toBe('menu');
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
    // The wrapper stays inert — interactives must not nest (axe).
    expect(trigger.getAttribute('role')).toBeNull();
    expect(trigger.getAttribute('tabindex')).toBeNull();
    trigger.click();
    fixture.detectChanges();
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');
    const menu = el.querySelector<HTMLElement>('[role="menu"]')!;
    expect(menu).toBeTruthy();
    menu.querySelector<HTMLElement>('strct-dropdown-item')!.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="menu"]')).toBeNull();
  });

  it('popover mode: labeled dialog whose inner clicks do NOT close it', () => {
    const { fixture, el, trigger, triggerBtn } = setup(true);
    expect(triggerBtn.getAttribute('aria-haspopup')).toBe('dialog');
    trigger.click();
    fixture.detectChanges();
    const dialog = el.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-label')).toBe('Filters');
    expect(el.querySelector('[role="menu"]')).toBeNull();
    // The FR's bug: choosing a value inside the panel must not close it.
    dialog.querySelector<HTMLElement>('.inner-control')!.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('strips the static popover attribute so native HTML Popover UA styles never apply', () => {
    @Component({
      imports: [StrctDropdown],
      template: `<strct-dropdown popover><button strctDropdownTrigger>o</button></strct-dropdown>`,
    })
    class StaticHost {}
    const fixture = TestBed.createComponent(StaticHost);
    fixture.detectChanges();
    const host = (fixture.nativeElement as HTMLElement).querySelector('strct-dropdown')!;
    // The UA would style [popover] hosts (Canvas bg + medium border) — the
    // attribute must be gone while the input stays truthy.
    expect(host.hasAttribute('popover')).toBe(false);
    host.querySelector<HTMLElement>('.strct-dd__trigger')!.click();
    fixture.detectChanges();
    expect(host.querySelector('[role="dialog"]')).toBeTruthy(); // input still true
  });

  it('popover mode: outside click and Escape still close', () => {
    const { fixture, el, trigger } = setup(true);
    trigger.click();
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="dialog"]')).toBeNull();

    trigger.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="dialog"]')).toBeTruthy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });
});
