import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctDropdown, StrctDropdownItem } from './dropdown';

@Component({
  imports: [StrctDropdown, StrctDropdownItem],
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
  return { fixture, el, trigger };
}

describe('StrctDropdown', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctDropdown);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-dd');
  });

  it('menu mode: aria-haspopup=menu, role=menu, inner click closes', () => {
    const { fixture, el, trigger } = setup(false);
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const menu = el.querySelector<HTMLElement>('[role="menu"]')!;
    expect(menu).toBeTruthy();
    menu.querySelector<HTMLElement>('strct-dropdown-item')!.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="menu"]')).toBeNull();
  });

  it('popover mode: labeled dialog whose inner clicks do NOT close it', () => {
    const { fixture, el, trigger } = setup(true);
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
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
