import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Event, NavigationEnd, Router, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import {
  StrctShell,
  StrctHeader,
  StrctHeaderAction,
  StrctFooter,
  StrctShellService,
} from './layout';
import { StrctVerticalNav } from './nav';

describe('StrctShell', () => {
  it('applies the strct-shell host class', () => {
    const fixture = TestBed.createComponent(StrctShell);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-shell');
  });
});

describe('StrctHeader', () => {
  it('applies the strct-header host class', () => {
    TestBed.configureTestingModule({ providers: [StrctShellService] });
    const fixture = TestBed.createComponent(StrctHeader);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-header');
  });

  // FR-52-02 / FR-53-05 — which product you are in, and a header that fits a
  // phone without an app overriding the library's own selector.
  it('draws an accent line without taking any height, and only when asked', () => {
    TestBed.configureTestingModule({ providers: [StrctShellService] });
    const fixture = TestBed.createComponent(StrctHeader);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).not.toContain('strct-header--accent');
    expect(host.style.getPropertyValue('--strct-header-accent')).toBe('');

    fixture.componentRef.setInput('accent', 'var(--prod-acc)');
    fixture.detectChanges();
    expect(host.classList).toContain('strct-header--accent');
    expect(host.style.getPropertyValue('--strct-header-accent')).toBe('var(--prod-acc)');

    // An inset shadow, so nothing under the header moves.
    const css = [...document.querySelectorAll('style')]
      .map((style) => style.textContent ?? '')
      .join('')
      .replace(/\s+/g, ' ');
    expect(css).toContain(
      '.strct-header--accent { box-shadow: inset 0 -3px 0 var(--strct-header-accent',
    );
    // The gap and padding are tokens, and a phone gets a tighter default.
    expect(css).toMatch(/\.strct-header \{[^}]*gap: var\(--strct-header-gap, 14px\)/);
    expect(css).toMatch(
      /@media \(max-width: 600px\) \{ \.strct-header \{ gap: var\(--strct-header-gap, 4px\)/,
    );
  });

  it('reflects mobileNavOpen via aria-expanded and aria-controls on the drawer toggle', () => {
    TestBed.configureTestingModule({ providers: [StrctShellService] });
    const shell = TestBed.inject(StrctShellService);
    const fixture = TestBed.createComponent(StrctHeader);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector(
      '.strct-header__drawer-toggle',
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBeNull();

    shell.mobileNavOpen.set(true);
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe(shell.navId);
  });

  it('labels the drawer toggle, localizable via drawerToggleAriaLabel', () => {
    TestBed.configureTestingModule({ providers: [StrctShellService] });
    const fixture = TestBed.createComponent(StrctHeader);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector(
      '.strct-header__drawer-toggle',
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-label')).toBe('Toggle navigation');

    fixture.componentRef.setInput('drawerToggleAriaLabel', 'Navigation umschalten');
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-label')).toBe('Navigation umschalten');
  });
});

describe('StrctFooter', () => {
  it('applies the strct-footer host class', () => {
    const fixture = TestBed.createComponent(StrctFooter);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-footer');
  });
});

describe('StrctVerticalNav', () => {
  it('applies the strct-vnav host class', () => {
    TestBed.configureTestingModule({ providers: [StrctShellService] });
    const fixture = TestBed.createComponent(StrctVerticalNav);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-vnav');
  });

  // The backdrop is the shell's (BUG-53-01), not the drawer's.
  it('keeps the backdrop out of the tab order', () => {
    const fixture = TestBed.createComponent(StrctShell);
    fixture.detectChanges();
    const shell = fixture.debugElement.injector.get(StrctShellService);
    shell.mobileNavOpen.set(true);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.strct-vnav__backdrop') as HTMLElement;
    expect(backdrop.getAttribute('tabindex')).toBe('-1');
    expect(backdrop.getAttribute('role')).toBe('button');
  });

  it('closes the mobile nav on Escape', () => {
    TestBed.configureTestingModule({ providers: [StrctShellService] });
    const shell = TestBed.inject(StrctShellService);
    shell.mobileNavOpen.set(true);
    const fixture = TestBed.createComponent(StrctVerticalNav);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(shell.mobileNavOpen()).toBe(false);
  });

  it('sets the host id referenced by the drawer toggle aria-controls', () => {
    TestBed.configureTestingModule({ providers: [StrctShellService] });
    const shell = TestBed.inject(StrctShellService);
    const fixture = TestBed.createComponent(StrctVerticalNav);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.id).toBe(shell.navId);
  });

  // FR-48-37
  describe('skip link', () => {
    it('renders nothing without a target', () => {
      const fixture = TestBed.createComponent(StrctShell);
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).querySelector('.strct-shell__skip')).toBeNull();
    });

    it("is the shell's first element and moves focus to the main region", () => {
      const main = document.createElement('main');
      main.id = 'main-region';
      document.body.appendChild(main);
      try {
        const fixture = TestBed.createComponent(StrctShell);
        fixture.componentRef.setInput('skipLinkTarget', 'main-region');
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const link = el.querySelector('.strct-shell__skip') as HTMLAnchorElement;
        expect(link).toBeTruthy();
        expect(el.firstElementChild).toBe(link);
        expect(link.getAttribute('href')).toBe('#main-region');
        expect(link.textContent?.trim()).toBe('Skip to main content');

        link.click();
        // focus, not only scroll — an href alone would leave focus on the link
        expect(main.getAttribute('tabindex')).toBe('-1');
        expect(document.activeElement).toBe(main);
      } finally {
        main.remove();
      }
    });
  });
});

// BUG-53-01 — the drawer's backdrop was a fixed child of the transformed
// drawer, so it covered the drawer and took every tap meant for the rail.
describe('StrctShell — the mobile nav backdrop', () => {
  @Component({
    imports: [StrctShell, StrctVerticalNav],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
      <strct-shell>
        <strct-vertical-nav><button class="entry" type="button">Hosts</button></strct-vertical-nav>
      </strct-shell>
    `,
  })
  class Host {}

  it('is drawn by the shell, outside the drawer, and closes it', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const shellEl = el.querySelector('strct-shell')!;
    const nav = el.querySelector('strct-vertical-nav')!;
    const service = fixture.debugElement
      .query((d) => d.name === 'strct-shell')
      .injector.get(StrctShellService);

    expect(el.querySelector('.strct-vnav__backdrop')).toBeNull();

    service.mobileNavOpen.set(true);
    fixture.detectChanges();
    const backdrop = el.querySelector('.strct-vnav__backdrop')!;
    expect(backdrop).toBeTruthy();
    // The shell draws it; the drawer does not contain it.
    expect(backdrop.parentElement).toBe(shellEl);
    expect(nav.contains(backdrop)).toBe(false);

    (backdrop as HTMLElement).click();
    fixture.detectChanges();
    expect(service.mobileNavOpen()).toBe(false);
    expect(el.querySelector('.strct-vnav__backdrop')).toBeNull();
  });
});

// FR-53-04 / 06 / 07 — the shell on a phone: the drawer that closes when a
// choice in it navigates, the header's overflow menu, and a drawer you can
// reach, leave and close.
describe('StrctShell — the drawer and the header on a phone', () => {
  function media(narrow: boolean) {
    const listeners = new Set<() => void>();
    const mql = {
      matches: narrow,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    };
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mql),
    );
    return {
      set(value: boolean) {
        mql.matches = value;
        listeners.forEach((fn) => fn());
      },
    };
  }

  afterEach(() => vi.unstubAllGlobals());

  it('closes the drawer when a navigation completes, unless told not to', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(StrctShell);
    fixture.detectChanges();
    const shell = fixture.debugElement.injector.get(StrctShellService);
    const router = TestBed.inject(Router);

    shell.mobileNavOpen.set(true);
    (router.events as Subject<Event>).next(new NavigationEnd(1, '/a', '/a'));
    expect(shell.mobileNavOpen()).toBe(false);

    fixture.componentRef.setInput('closeNavOnNavigate', false);
    fixture.detectChanges();
    shell.mobileNavOpen.set(true);
    (router.events as Subject<Event>).next(new NavigationEnd(2, '/b', '/b'));
    expect(shell.mobileNavOpen()).toBe(true);

    // The manual route, for an app that drives it itself.
    shell.closeNav();
    expect(shell.mobileNavOpen()).toBe(false);
  });

  it('moves the phone actions into a More menu, and keeps the ones that must stay', () => {
    const screen = media(false);

    @Component({
      imports: [StrctHeader, StrctHeaderAction],
      changeDetection: ChangeDetectionStrategy.Eager,
      template: `
        <strct-header>
          <ng-container *strctHeaderAction="{ label: 'Create', icon: 'plus', run: create }">
            <button class="act-create">Create</button>
          </ng-container>
          <ng-container *strctHeaderAction="{ label: 'Search', icon: 'search', run: search }">
            <button class="act-search">Search</button>
          </ng-container>
          <ng-container *strctHeaderAction="{ label: 'Alarms', overflow: 'never' }">
            <button class="act-alarms">Alarms</button>
          </ng-container>
        </strct-header>
      `,
    })
    class Host {
      ran: string[] = [];
      create = () => this.ran.push('create');
      search = () => this.ran.push('search');
    }

    TestBed.configureTestingModule({ providers: [StrctShellService] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    // Wide: every action is in the header, and there is no More trigger.
    expect(el.querySelectorAll('.act-create, .act-search, .act-alarms').length).toBe(3);
    expect(el.querySelector('.strct-header__more')).toBeNull();

    screen.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.act-create')).toBeNull();
    expect(el.querySelector('.act-search')).toBeNull();
    expect(el.querySelector('.act-alarms')).toBeTruthy(); // overflow: never
    el.querySelector<HTMLElement>('.strct-header__more')!.click();
    fixture.detectChanges();

    const rows = [...el.querySelectorAll<HTMLElement>('strct-dropdown-item')];
    expect(rows.map((r) => r.textContent!.trim())).toEqual(['Create', 'Search']);
    rows[1].click();
    expect(fixture.componentInstance.ran).toEqual(['search']);
  });

  it('caps the drawer’s width, moves focus into it and hands it back', async () => {
    media(true); // the drawer breakpoint

    @Component({
      imports: [StrctShell, StrctHeader, StrctVerticalNav],
      changeDetection: ChangeDetectionStrategy.Eager,
      template: `
        <strct-shell>
          <strct-header />
          <strct-vertical-nav closeButton drawerMaxWidth="300px">
            <button class="first-entry">Hosts</button>
            <button class="last-entry">VMs</button>
          </strct-vertical-nav>
        </strct-shell>
      `,
    })
    class Host {}

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const shell = fixture.debugElement.children[0].injector.get(StrctShellService);
    const nav = el.querySelector<HTMLElement>('strct-vertical-nav')!;
    const toggle = el.querySelector<HTMLElement>('.strct-header__drawer-toggle')!;

    expect(nav.style.getPropertyValue('--strct-vnav-drawer-max')).toBe('300px');
    expect(nav.querySelector('.strct-vnav__close')).toBeTruthy();
    expect(nav.getAttribute('aria-modal')).toBeNull(); // closed: not a dialog

    toggle.focus();
    shell.mobileNavOpen.set(true);
    fixture.detectChanges();
    expect(nav.getAttribute('aria-modal')).toBe('true');
    expect(nav.getAttribute('role')).toBe('dialog');

    // Focus lands on the first thing inside, after the drawer has painted.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    expect(document.activeElement).toBe(nav.querySelector('.strct-vnav__close'));

    // Tab from the last entry cycles back inside rather than leaving.
    const last = nav.querySelector<HTMLElement>('.last-entry')!;
    last.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);

    // The close control closes it, and focus goes back to what opened it.
    nav.querySelector<HTMLElement>('.strct-vnav__close')!.click();
    fixture.detectChanges();
    expect(shell.mobileNavOpen()).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });
});
