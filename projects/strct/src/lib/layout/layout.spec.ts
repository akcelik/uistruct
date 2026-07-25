import { TestBed } from '@angular/core/testing';
import { StrctShell, StrctHeader, StrctFooter, StrctShellService } from './layout';
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

  it('keeps the backdrop out of the tab order', () => {
    TestBed.configureTestingModule({ providers: [StrctShellService] });
    const shell = TestBed.inject(StrctShellService);
    shell.mobileNavOpen.set(true);
    const fixture = TestBed.createComponent(StrctVerticalNav);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.strct-vnav__backdrop') as HTMLElement;
    expect(backdrop.getAttribute('tabindex')).toBe('-1');
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
});
