import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctWindow, StrctWindowBounds, StrctWindowDock, StrctWindowDockItem } from './window';

@Component({
  imports: [StrctWindow, StrctWindowDock],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <button type="button" class="opener" (click)="open.set(true)">Open console</button>
    <strct-window
      [(open)]="open"
      [(minimized)]="min"
      [(bounds)]="rect"
      heading="APP01"
      [minWidth]="300"
      [minHeight]="200"
    >
      <span strctWindowTitleMeta class="meta">Running</span>
      <p class="content">screen</p>
      <span strctWindowStatus class="status">Connected</span>
    </strct-window>
    <strct-window-dock />
  `,
})
class Host {
  open = signal(false);
  min = signal(false);
  rect = signal<StrctWindowBounds | null>({ x: 100, y: 80, width: 600, height: 400 });
}

@Component({
  imports: [StrctWindow],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<strct-window [open]="true" heading="Console" palette="dark">screen</strct-window>`,
})
class DarkHost {}

function build() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el, host: fixture.componentInstance };
}
const frame = (el: HTMLElement) => el.querySelector('.strct-window__frame') as HTMLElement;
const press = (el: HTMLElement, key: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));

describe('StrctWindow', () => {
  it('is a non-modal dialog that does not block the page', () => {
    const { fixture, el, host } = build();
    expect(frame(el)).toBeNull();
    host.open.set(true);
    fixture.detectChanges();
    const f = frame(el);
    expect(f.getAttribute('role')).toBe('dialog');
    expect(f.getAttribute('aria-modal')).toBe('false');
    expect(f.getAttribute('aria-labelledby')).toBe(
      el.querySelector('.strct-window__heading')?.id ?? '',
    );
    // no backdrop element at all — the page underneath stays usable
    expect(el.querySelector('.strct-modal__backdrop')).toBeNull();
  });

  it('places itself from bounds and moves with Alt+arrows', () => {
    const { fixture, el, host } = build();
    host.open.set(true);
    fixture.detectChanges();
    expect(frame(el).style.left).toBe('100px');
    expect(frame(el).style.width).toBe('600px');

    const title = el.querySelector('.strct-window__title') as HTMLElement;
    press(title, 'ArrowRight', { altKey: true });
    fixture.detectChanges();
    expect(host.rect()?.x).toBe(116);
    press(title, 'ArrowDown', { altKey: true, shiftKey: true });
    fixture.detectChanges();
    expect(host.rect()?.y).toBe(144);
    // without Alt the window stays put
    press(title, 'ArrowRight');
    fixture.detectChanges();
    expect(host.rect()?.x).toBe(116);
  });

  it('resizes from a corner with the keyboard, honouring the minimum', () => {
    const { fixture, el, host } = build();
    host.open.set(true);
    fixture.detectChanges();
    const se = el.querySelector('.strct-window__rz--se') as HTMLElement;
    expect(se.getAttribute('aria-label')).toBe('Resize (se)');
    press(se, 'ArrowRight');
    fixture.detectChanges();
    expect(host.rect()?.width).toBe(616);
    press(se, 'ArrowUp', { shiftKey: true });
    fixture.detectChanges();
    expect(host.rect()?.height).toBe(336);

    // the north-west corner moves the origin, so the opposite corner stays put
    const nw = el.querySelector('.strct-window__rz--nw') as HTMLElement;
    const before = host.rect()!;
    press(nw, 'ArrowRight');
    fixture.detectChanges();
    expect(host.rect()?.width).toBe(before.width - 16);
    expect(host.rect()?.x).toBe(before.x + 16);
  });

  it('minimises to the dock, restores from it, and closes', () => {
    const { fixture, el, host } = build();
    host.open.set(true);
    fixture.detectChanges();
    (el.querySelector('.strct-window__btn') as HTMLElement).click(); // minimize
    fixture.detectChanges();
    expect(host.min()).toBe(true);
    expect(frame(el)).toBeNull();

    const chip = el.querySelector('.strct-windock__open') as HTMLElement;
    expect(chip.textContent?.trim()).toBe('APP01');
    chip.click();
    fixture.detectChanges();
    expect(host.min()).toBe(false);
    expect(frame(el)).toBeTruthy();

    const close = el.querySelector('.strct-window__btn--close') as HTMLElement;
    close.click();
    fixture.detectChanges();
    expect(host.open()).toBe(false);
    expect(el.querySelector('.strct-windock__open')).toBeNull();
  });

  it('returns focus to the opener when it closes', () => {
    const { fixture, el, host } = build();
    const opener = el.querySelector('.opener') as HTMLElement;
    document.body.appendChild(el);
    opener.focus();
    opener.click();
    fixture.detectChanges();
    (el.querySelector('.strct-window__btn--close') as HTMLElement).click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(opener);
    expect(host.open()).toBe(false);
  });

  it('Escape minimises rather than closing — a window is not dismissed', () => {
    const { fixture, el, host } = build();
    host.open.set(true);
    fixture.detectChanges();
    press(frame(el), 'Escape');
    fixture.detectChanges();
    expect(host.min()).toBe(true);
    expect(host.open()).toBe(true);
  });

  it('projects its title meta, content and status', () => {
    const { fixture, el, host } = build();
    host.open.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.strct-window__meta .meta')?.textContent).toBe('Running');
    expect(el.querySelector('.strct-window__body .content')?.textContent).toBe('screen');
    expect(el.querySelector('.strct-window__status .status')?.textContent).toBe('Connected');
  });

  it('forces a scheme inside when asked, and inherits otherwise', () => {
    const { fixture, el, host } = build();
    host.open.set(true);
    fixture.detectChanges();
    expect(frame(el).getAttribute('data-theme')).toBeNull();
    expect(frame(el).getAttribute('data-palette')).toBeNull();

    const dark = TestBed.createComponent(DarkHost);
    dark.detectChanges();
    const darkFrame = (dark.nativeElement as HTMLElement).querySelector(
      '.strct-window__frame',
    ) as HTMLElement;
    expect(darkFrame.getAttribute('data-theme')).toBe('dark');
    // the palette in force outside is carried over, so only the scheme swaps
    expect(darkFrame.getAttribute('data-palette')).toBe(
      document.documentElement.getAttribute('data-palette') ?? 'arctic',
    );
  });
});

// BUG-49-08 — closeOnOutside was declared and never read.
@Component({
  imports: [StrctWindow],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <button type="button" class="elsewhere">elsewhere</button>
    <strct-window [(open)]="open" [(minimized)]="min" heading="APP01" [closeOnOutside]="mode()">
      <p class="content">screen</p>
    </strct-window>
  `,
})
class OutsideHost {
  open = signal(true);
  min = signal(false);
  mode = signal<'none' | 'minimize'>('minimize');
}

describe('StrctWindow — closeOnOutside', () => {
  async function build() {
    const fixture = TestBed.createComponent(OutsideHost);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    fixture.detectChanges();
    await fixture.whenStable();
    // the listener is attached on a timeout, so the opening click cannot close it
    await new Promise((r) => setTimeout(r));
    return { fixture, el, host: fixture.componentInstance };
  }

  it('minimises on a click beside the window, and not on one inside it', async () => {
    const { fixture, el, host } = await build();
    el.querySelector('.content')?.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(host.min()).toBe(false);

    (el.querySelector('.elsewhere') as HTMLElement).dispatchEvent(
      new Event('pointerdown', { bubbles: true }),
    );
    fixture.detectChanges();
    expect(host.min()).toBe(true);
    expect(host.open()).toBe(true);
    el.remove();
  });

  it('leaves the window alone when it is "none"', async () => {
    const { fixture, el, host } = await build();
    host.mode.set('none');
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r));
    (el.querySelector('.elsewhere') as HTMLElement).dispatchEvent(
      new Event('pointerdown', { bubbles: true }),
    );
    fixture.detectChanges();
    expect(host.min()).toBe(false);
    el.remove();
  });
});

// FR-49-06 — the rest of what a console window needs.
@Component({
  imports: [StrctWindow, StrctWindowDock, StrctWindowDockItem],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-window
      [(open)]="open"
      [(minimized)]="min"
      [(bounds)]="bounds"
      heading="APP01"
      [icon]="icon()"
      [titleDblclick]="dbl()"
      [labels]="labels"
      (titleDblclicked)="dblCount = dblCount + 1"
    >
      <p>screen</p>
    </strct-window>
    <strct-window-dock [restoreMode]="restoreMode()" (restoreRequest)="asked = asked + 1">
      <ng-template strctWindowDockItem let-w>
        <span class="chip-custom">{{ w.heading() }} · live</span>
      </ng-template>
    </strct-window-dock>
  `,
})
class ConsoleHost {
  open = signal(true);
  min = signal(false);
  bounds = signal({ x: 40, y: 40, width: 400, height: 300 });
  icon = signal('');
  dbl = signal<'maximize' | 'none'>('maximize');
  restoreMode = signal<'dock' | 'request'>('dock');
  labels = { minimizeHint: 'stays connected', closeHint: 'ends the session' };
  dblCount = 0;
  asked = 0;
}

describe('StrctWindow — labels, icon, clamping, double-click and the dock', () => {
  function build() {
    const fixture = TestBed.createComponent(ConsoleHost);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, host: fixture.componentInstance };
  }
  const buttons = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>('.strct-window__btn')];

  it('gives each control a tooltip of its own, without touching its name', () => {
    const { el } = build();
    const [minimize, maximize, close] = buttons(el);
    expect(minimize.getAttribute('aria-label')).toBe('Minimize');
    expect(minimize.getAttribute('title')).toBe('stays connected');
    // A control with no hint shows none rather than repeating its name.
    expect(maximize.getAttribute('title')).toBeNull();
    expect(close.getAttribute('title')).toBe('ends the session');
  });

  it('takes a leading icon', () => {
    const { fixture, el, host } = build();
    expect(el.querySelector('.strct-window__icon')).toBeNull();
    host.icon.set('monitor');
    fixture.detectChanges();
    const icon = el.querySelector('.strct-window__icon')!;
    expect(icon).toBeTruthy();
    // It leads the heading.
    expect(icon.nextElementSibling!.className).toContain('strct-window__heading');
  });

  it('keeps the title bar reachable when the window is moved off the edge', () => {
    const { fixture, host } = build();
    const title = (fixture.nativeElement as HTMLElement).querySelector(
      '.strct-window__title',
    ) as HTMLElement;
    // Alt+arrows move it; walk it hard into the top-left.
    for (let i = 0; i < 40; i++) {
      title.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowUp',
          altKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );
      title.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowLeft',
          altKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );
    }
    fixture.detectChanges();
    const r = host.bounds();
    expect(r.y).toBeGreaterThanOrEqual(0);
    // Part of the bar stays on screen: x may be negative, never past the window.
    expect(r.x + r.width).toBeGreaterThanOrEqual(48);
  });

  it('lets the consumer own the double-click', () => {
    const { fixture, el, host } = build();
    const title = el.querySelector('.strct-window__title') as HTMLElement;
    title.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    expect(host.dblCount).toBe(1);
    expect(el.querySelector('.strct-window__frame--max')).toBeTruthy();

    // "none": the event still arrives, the window does not change.
    host.dbl.set('none');
    fixture.detectChanges();
    title.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    expect(host.dblCount).toBe(2);
    expect(el.querySelector('.strct-window__frame--max')).toBeTruthy();
  });

  it('draws the dock chip from the template and can hand the restore back', () => {
    const { fixture, el, host } = build();
    host.min.set(true);
    fixture.detectChanges();
    const chip = el.querySelector('.strct-windock__open') as HTMLElement;
    expect(chip.textContent!.trim()).toBe('APP01 · live');

    // request: the dock asks and leaves the window where it is.
    host.restoreMode.set('request');
    fixture.detectChanges();
    chip.click();
    fixture.detectChanges();
    expect(host.asked).toBe(1);
    expect(host.min()).toBe(true);

    // dock: it asks and restores.
    host.restoreMode.set('dock');
    fixture.detectChanges();
    (el.querySelector('.strct-windock__open') as HTMLElement).click();
    fixture.detectChanges();
    expect(host.asked).toBe(2);
    expect(host.min()).toBe(false);
  });
});
