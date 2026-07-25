import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctMenuPanel, StrctMenuService } from './menu';

describe('StrctMenuPanel', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctMenuPanel);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-menu-host');
  });
});

describe('StrctMenuPanel — submenu clamping', () => {
  it('lifts a submenu fly-out that would overflow the viewport bottom', async () => {
    const fixture = TestBed.createComponent(StrctMenuPanel);
    fixture.componentRef.setInput('items', [{ label: 'Parent', children: [{ label: 'Child' }] }]);
    fixture.detectChanges();

    // Pretend the fly-out ends up 300px below the viewport bottom.
    const real = Element.prototype.getBoundingClientRect;
    const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      if (this.classList.contains('strct-menu__subpanel')) {
        return {
          x: 0,
          y: 100,
          width: 180,
          height: 200,
          top: 100,
          right: 180,
          bottom: window.innerHeight + 300,
          left: 0,
          toJSON: () => ({}),
        } as DOMRect;
      }
      return real.call(this);
    });
    try {
      const menu = fixture.nativeElement.querySelector('.strct-menu') as HTMLElement;
      menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable(); // let the submenu's afterNextRender clamp run
      fixture.detectChanges();

      const sub = fixture.nativeElement.querySelector('.strct-menu__subpanel') as HTMLElement;
      expect(sub).toBeTruthy();
      // shift = min(300 + 6, 100 - 6) = 94 → top lifts from -5px to -99px.
      expect(sub.style.top).toBe('-99px');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('StrctMenuService — focus lifecycle', () => {
  function openMenu(items = [{ label: 'One' }]) {
    const trigger = document.createElement('button');
    trigger.className = 'strct-test-trigger';
    document.body.appendChild(trigger);
    trigger.focus();

    const service = TestBed.inject(StrctMenuService);
    service.open({ x: 10, y: 10, items });
    TestBed.inject(ApplicationRef).tick();
    return { trigger, service };
  }

  function menuEl(): HTMLElement | null {
    return document.body.querySelector('strct-menu-panel .strct-menu');
  }

  afterEach(() => {
    TestBed.inject(StrctMenuService).close();
    document.body.querySelectorAll('.strct-test-trigger').forEach((el) => el.remove());
  });

  it('restores focus to the trigger on close', () => {
    const { trigger, service } = openMenu();
    expect(menuEl()).toBeTruthy();

    service.close();
    expect(document.activeElement).toBe(trigger);
  });

  it('Escape closes the menu and restores focus to the trigger', () => {
    const { trigger } = openMenu();
    menuEl()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(menuEl()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('selecting an item closes the menu and restores focus to the trigger', () => {
    const { trigger } = openMenu([{ label: 'One' }]);
    const item = menuEl()!.querySelector('.strct-menu__item') as HTMLElement;
    item.click();

    expect(menuEl()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('Tab closes the menu without preventing the default focus move', () => {
    const { trigger } = openMenu();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    menuEl()!.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(menuEl()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
