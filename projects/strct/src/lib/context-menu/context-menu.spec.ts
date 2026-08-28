import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { StrctDropdownDivider, StrctDropdownItem } from '../dropdown/dropdown';
import { StrctContextMenu } from './context-menu';
import { StrctContextMenuTrigger } from './menu';

@Component({
  template: `<div [strctContextMenu]="[]">Trigger</div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [StrctContextMenuTrigger],
})
class TestHost {}

@Component({
  template: `
    <button type="button" class="before">Before</button>
    <strct-context-menu>
      <div>Right-click here</div>
      <ng-container strctContextMenuItems>
        <strct-dropdown-item (click)="picked.set('open')">Open</strct-dropdown-item>
        <strct-dropdown-divider />
        <strct-dropdown-item disabled>Disabled</strct-dropdown-item>
        <strct-dropdown-item critical (click)="picked.set('delete')">Delete</strct-dropdown-item>
      </ng-container>
    </strct-context-menu>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [StrctContextMenu, StrctDropdownItem, StrctDropdownDivider],
})
class CtxHost {
  readonly picked = signal<string | null>(null);
}

describe('StrctContextMenuTrigger', () => {
  it('exists as a directive', () => {
    TestBed.configureTestingModule({
      imports: [TestHost],
    });
    const fixture: ComponentFixture<TestHost> = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const div = fixture.nativeElement.querySelector('div');
    expect(div).toBeTruthy();
  });
});

describe('StrctContextMenu', () => {
  let fixture: ComponentFixture<CtxHost>;

  function menu(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.strct-ctx__menu');
  }

  function items(): HTMLElement[] {
    return Array.from(menu()?.querySelectorAll<HTMLElement>('.strct-dd__item') ?? []);
  }

  /** Right-click the trigger area and let the deferred clamp/focus run. */
  async function openMenu(clientX = 100, clientY = 50): Promise<MouseEvent> {
    const trigger = fixture.nativeElement.querySelector('.strct-ctx__trigger') as HTMLElement;
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
    });
    trigger.dispatchEvent(event);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    return event;
  }

  function keydown(el: HTMLElement, key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CtxHost] });
    fixture = TestBed.createComponent(CtxHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
  });

  it('opens at the cursor and prevents the native context menu', async () => {
    const event = await openMenu(100, 50);

    expect(event.defaultPrevented).toBe(true);
    expect(menu()).toBeTruthy();
    expect(menu()!.style.left).toBe('100px');
    expect(menu()!.style.top).toBe('50px');
  });

  it('moves focus to the first item on open', async () => {
    await openMenu();

    expect(document.activeElement).toBe(items()[0]);
  });

  it('roams items with arrows, skipping dividers and disabled items', async () => {
    await openMenu();
    const nav = items().filter((el) => el.getAttribute('aria-disabled') !== 'true');
    expect(nav.length).toBe(2); // divider and the disabled item are skipped

    keydown(menu()!, 'ArrowDown');
    expect(document.activeElement).toBe(nav[1]);

    keydown(menu()!, 'ArrowDown'); // wraps around
    expect(document.activeElement).toBe(nav[0]);

    keydown(menu()!, 'ArrowUp'); // wraps the other way
    expect(document.activeElement).toBe(nav[1]);
  });

  it('jumps to the first/last item with Home/End', async () => {
    await openMenu();
    const nav = items().filter((el) => el.getAttribute('aria-disabled') !== 'true');

    keydown(menu()!, 'End');
    expect(document.activeElement).toBe(nav[1]);

    keydown(menu()!, 'Home');
    expect(document.activeElement).toBe(nav[0]);
  });

  it('Enter picks the active item and closes', async () => {
    await openMenu();
    keydown(menu()!, 'ArrowDown');
    keydown(document.activeElement as HTMLElement, 'Enter');
    fixture.detectChanges();

    expect(fixture.componentInstance.picked()).toBe('delete');
    expect(menu()).toBeNull();
  });

  it('clicking an item runs its handler and closes', async () => {
    await openMenu();
    items()[0].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.picked()).toBe('open');
    expect(menu()).toBeNull();
  });

  it('ignores clicks on menu padding and on dividers', async () => {
    await openMenu();

    menu()!.dispatchEvent(new MouseEvent('click', { bubbles: true })); // padding
    fixture.detectChanges();
    expect(menu()).toBeTruthy();

    const divider = menu()!.querySelector('.strct-dd__divider') as HTMLElement;
    divider.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(menu()).toBeTruthy();
  });

  it('closes on a click outside the menu', async () => {
    await openMenu();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(menu()).toBeNull();
  });

  it('Escape stops propagation, closes, and returns focus to the trigger', async () => {
    const before = fixture.nativeElement.querySelector('.before') as HTMLElement;
    before.focus();
    await openMenu();
    expect(document.activeElement).not.toBe(before);

    const event = keydown(document.activeElement as HTMLElement, 'Escape');
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(before);
  });

  it('clamps to the measured menu box instead of a guessed size', async () => {
    const wSpy = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200);
    const hSpy = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100);
    try {
      await openMenu(window.innerWidth - 50, window.innerHeight - 20);

      expect(menu()!.style.left).toBe(`${window.innerWidth - 200 - 6}px`);
      expect(menu()!.style.top).toBe(`${window.innerHeight - 100 - 6}px`);
    } finally {
      wSpy.mockRestore();
      hSpy.mockRestore();
    }
  });
});
