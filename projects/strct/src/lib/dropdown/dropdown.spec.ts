import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctSubmenu } from '../context-menu/submenu';
import {
  StrctDropdown,
  StrctDropdownDivider,
  StrctDropdownItem,
  StrctDropdownTrigger,
} from './dropdown';

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

describe('StrctDropdown select ergonomics (v1.19)', () => {
  @Component({
    imports: [StrctDropdown, StrctDropdownItem, StrctDropdownDivider, StrctDropdownTrigger],
    template: `
      <button id="outside">out</button>
      <strct-dropdown>
        <button strctDropdownTrigger>Choose</button>
        <strct-dropdown-item [selected]="pick === 'a'" (click)="pick = 'a'"
          >Alpha</strct-dropdown-item
        >
        <strct-dropdown-divider />
        <strct-dropdown-item [selected]="pick === 'b'" (click)="pick = 'b'"
          >Beta</strct-dropdown-item
        >
        <strct-dropdown-item disabled>Gamma</strct-dropdown-item>
      </strct-dropdown>
    `,
  })
  class SelectHost {
    pick = 'a';
  }

  async function setup() {
    const fixture = TestBed.createComponent(SelectHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const trigger = el.querySelector<HTMLElement>('.strct-dd__trigger')!;
    const openMenu = async () => {
      trigger.click();
      fixture.detectChanges();
      await new Promise((r) => setTimeout(r)); // focusInitialItem
      fixture.detectChanges();
    };
    return { fixture, host: fixture.componentInstance, el, trigger, openMenu };
  }
  const items = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>('strct-dropdown-item')];

  it('a click on menu padding or a divider does NOT close; an item click does', async () => {
    const { fixture, el, openMenu } = await setup();
    await openMenu();
    const menu = el.querySelector<HTMLElement>('[role="menu"]')!;
    menu.click(); // padding
    fixture.detectChanges();
    expect(el.querySelector('[role="menu"]')).toBeTruthy();
    el.querySelector<HTMLElement>('strct-dropdown-divider')!.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="menu"]')).toBeTruthy();
    items(el)[1].click();
    fixture.detectChanges();
    expect(el.querySelector('[role="menu"]')).toBeNull();
  });

  it('a disabled item click does not close the menu', async () => {
    const { fixture, el, openMenu } = await setup();
    await openMenu();
    const gamma = items(el)[2];
    // pointer-events:none in real browsers; simulate the bubbled event anyway.
    gamma.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('[role="menu"]')).toBeTruthy();
  });

  it('selected renders menuitemradio + aria-checked + a leading check', async () => {
    const { el, openMenu } = await setup();
    await openMenu();
    const [alpha, beta] = items(el);
    expect(alpha.getAttribute('role')).toBe('menuitemradio');
    expect(alpha.getAttribute('aria-checked')).toBe('true');
    expect(alpha.querySelector('.strct-dd__check svg')).toBeTruthy();
    expect(beta.getAttribute('aria-checked')).toBe('false');
    expect(beta.querySelector('.strct-dd__check svg')).toBeNull(); // aligned empty slot
    expect(beta.querySelector('.strct-dd__check')).toBeTruthy();
  });

  it('an unbound item stays a plain menuitem without aria-checked', () => {
    const fixture = TestBed.createComponent(StrctDropdownItem);
    fixture.componentRef.setInput('critical', false);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('role')).toBe('menuitem');
    expect(host.getAttribute('aria-checked')).toBeNull();
    expect(host.querySelector('.strct-dd__check')).toBeNull();
  });

  it('opening focuses the SELECTED item; arrows rove skipping disabled; Enter picks', async () => {
    const { fixture, host, el, openMenu } = await setup();
    await openMenu();
    const [alpha, beta] = items(el);
    expect(document.activeElement).toBe(alpha); // selected item gets initial focus
    alpha.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(beta);
    beta.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(alpha); // gamma disabled — wraps past it
    alpha.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(beta);
    beta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(host.pick).toBe('b');
    expect(el.querySelector('[role="menu"]')).toBeNull();
  });

  it('Escape closes and restores focus to the trigger button', async () => {
    const { fixture, el, openMenu } = await setup();
    const btn = el.querySelector<HTMLElement>('[strctDropdownTrigger]')!;
    btn.focus();
    await openMenu();
    expect(document.activeElement).not.toBe(btn); // focus moved into the menu
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(btn);
  });

  it('ArrowDown on the trigger opens the menu (APG)', async () => {
    const { fixture, el } = await setup();
    const btn = el.querySelector<HTMLElement>('[strctDropdownTrigger]')!;
    btn.focus();
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('[role="menu"]')).toBeTruthy();
  });
});

describe('StrctDropdown with a nested StrctSubmenu', () => {
  @Component({
    imports: [StrctDropdown, StrctDropdownItem, StrctDropdownTrigger, StrctSubmenu],
    template: `
      <strct-dropdown>
        <button strctDropdownTrigger>Choose</button>
        <strct-dropdown-item>Alpha</strct-dropdown-item>
        <strct-submenu label="More">
          <strct-dropdown-item>Sub A</strct-dropdown-item>
        </strct-submenu>
        <strct-dropdown-item>Beta</strct-dropdown-item>
      </strct-dropdown>
    `,
  })
  class SubmenuHost {}

  async function setup() {
    const fixture = TestBed.createComponent(SubmenuHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLElement>('.strct-dd__trigger')!.click();
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r)); // focusInitialItem
    fixture.detectChanges();
    const submenuTrigger = el.querySelector<HTMLElement>('.strct-submenu__trigger')!;
    const key = (target: HTMLElement, key: string) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    return { fixture, el, submenuTrigger, key };
  }

  it('arrow roving reaches the submenu trigger between plain items', async () => {
    const { el, submenuTrigger, key } = await setup();
    const [alpha, beta] = [...el.querySelectorAll<HTMLElement>('strct-dropdown-item')];
    expect(document.activeElement).toBe(alpha);
    key(alpha, 'ArrowDown');
    expect(document.activeElement).toBe(submenuTrigger);
    key(submenuTrigger, 'ArrowDown');
    expect(document.activeElement).toBe(beta);
  });

  it('→ on the roved trigger opens the fly-out and focuses its first item', async () => {
    const { fixture, el, submenuTrigger, key } = await setup();
    key(submenuTrigger, 'ArrowRight');
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r)); // focus moves after render
    fixture.detectChanges();
    expect(el.querySelector('.strct-submenu__panel')).toBeTruthy();
    expect(document.activeElement).toBe(
      el.querySelector('.strct-submenu__panel strct-dropdown-item'),
    );
  });
});
