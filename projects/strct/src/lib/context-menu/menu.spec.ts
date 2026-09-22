import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctMenuItem, StrctMenuPanel, StrctMenuService } from './menu';

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

describe('StrctMenuPanel — item hint (FR-42-01)', () => {
  const REASON = 'VM must be powered off to clone.';

  function make(items: StrctMenuItem[]) {
    const fixture = TestBed.createComponent(StrctMenuPanel);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const buttons = () => [...el.querySelectorAll<HTMLButtonElement>('.strct-menu__item')];
    const byLabel = (label: string) =>
      buttons().find((b) => b.querySelector('.strct-menu__label')?.textContent?.trim() === label)!;
    const describedBy = (b: HTMLElement) =>
      el.querySelector(`#${b.getAttribute('aria-describedby')}`)?.textContent;
    const key = (k: string) => {
      el.querySelector('.strct-menu')!.dispatchEvent(
        new KeyboardEvent('keydown', { key: k, bubbles: true }),
      );
      fixture.detectChanges();
    };
    return { fixture, el, buttons, byLabel, describedBy, key };
  }

  it('keeps the label the name and carries the reason as tooltip + description', () => {
    const { byLabel, describedBy } = make([{ label: 'Clone', disabled: true, hint: REASON }]);
    const clone = byLabel('Clone');
    expect(clone.querySelector('.strct-menu__label')!.textContent!.trim()).toBe('Clone');
    expect(clone.getAttribute('title')).toBe(REASON);
    expect(describedBy(clone)).toBe(REASON);
    expect(clone.getAttribute('aria-disabled')).toBe('true');
    // Not natively disabled: that would refuse focus (and, in some browsers,
    // the pointer — and with it the tooltip).
    expect(clone.disabled).toBe(false);
  });

  it('works on an enabled entry too', () => {
    const { byLabel, describedBy } = make([
      { label: 'Snapshot', hint: 'Quiesces the guest first.' },
    ]);
    const b = byLabel('Snapshot');
    expect(b.getAttribute('title')).toBe('Quiesces the guest first.');
    expect(describedBy(b)).toBe('Quiesces the guest first.');
    expect(b.hasAttribute('aria-disabled')).toBe(false);
  });

  it('no hint → no title / aria-describedby attribute at all, not empty ones', () => {
    const { byLabel } = make([{ label: 'Open' }, { label: 'Off', disabled: true }]);
    for (const b of [byLabel('Open'), byLabel('Off')]) {
      expect(b.hasAttribute('title')).toBe(false);
      expect(b.hasAttribute('aria-describedby')).toBe(false);
    }
  });

  it('the hint is never rendered inline, so it cannot widen the menu', () => {
    const { el } = make([{ label: 'Clone', disabled: true, hint: REASON }]);
    const hintEl = el.querySelector<HTMLElement>('[id$="-hint-0"]')!;
    expect(hintEl.hidden).toBe(true);
    expect(el.querySelector('.strct-menu__item')!.textContent).not.toContain(REASON);
  });

  it('keyboard reaches a hinted disabled entry, skips an unhinted one, never activates either', () => {
    const { fixture, byLabel, key } = make([
      { label: 'Open' },
      { label: 'Drain', disabled: true },
      { label: 'Clone', disabled: true, hint: REASON },
      { label: 'Delete' },
    ]);
    const picked: StrctMenuItem[] = [];
    fixture.componentInstance.select.subscribe((i) => picked.push(i));
    expect(document.activeElement).toBe(byLabel('Open'));
    key('ArrowDown');
    expect(document.activeElement).toBe(byLabel('Clone')); // Drain skipped
    key('Enter');
    key(' ');
    byLabel('Clone').click();
    expect(picked).toEqual([]);
    key('ArrowDown');
    expect(document.activeElement).toBe(byLabel('Delete'));
  });

  it('opens on the first entry that can act, not a hinted disabled one', () => {
    const { byLabel } = make([{ label: 'Clone', disabled: true, hint: REASON }, { label: 'Open' }]);
    expect(document.activeElement).toBe(byLabel('Open'));
  });

  it('a disabled parent does not open its submenu, by hover or ArrowRight', () => {
    const { el, fixture, key } = make([
      { label: 'Move to', disabled: true, hint: 'No other cluster.', children: [{ label: 'x' }] },
    ]);
    el.querySelector('.strct-menu__wrap')!.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    key('ArrowRight');
    expect(el.querySelector('.strct-menu__subpanel')).toBeNull();
  });

  it('works inside a submenu panel', () => {
    const { el, fixture, key } = make([
      {
        label: 'Power',
        children: [{ label: 'Reset', disabled: true, hint: 'Guest is suspended.' }],
      },
    ]);
    key('ArrowRight');
    const sub = el.querySelector('.strct-menu__subpanel') as HTMLElement;
    const reset = sub.querySelector<HTMLButtonElement>('.strct-menu__item')!;
    expect(reset.getAttribute('title')).toBe('Guest is suspended.');
    expect(sub.querySelector(`#${reset.getAttribute('aria-describedby')}`)?.textContent).toBe(
      'Guest is suspended.',
    );
    // The parent entry's hint (none here) does not leak onto the child, and a
    // hint on the parent would sit on the parent BUTTON, not the wrapper that
    // also holds this panel.
    expect(el.querySelector('.strct-menu__wrap')!.hasAttribute('title')).toBe(false);
    fixture.detectChanges();
  });

  it('two panels never share a hint id', () => {
    const a = make([{ label: 'A', hint: 'x' }]);
    const b = make([{ label: 'A', hint: 'x' }]);
    expect(a.byLabel('A').getAttribute('aria-describedby')).not.toBe(
      b.byLabel('A').getAttribute('aria-describedby'),
    );
  });
});
