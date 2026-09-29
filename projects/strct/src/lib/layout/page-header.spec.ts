import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  StrctPageHeader,
  StrctPageHeaderActions,
  StrctPageHeaderCrumbs,
  StrctPageHeaderTitleMeta,
} from './page-header';

@Component({
  imports: [StrctPageHeader, StrctPageHeaderActions, StrctPageHeaderCrumbs],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-page-header title="hv-02" subtitle="Hypervisor · cluster-01" divider>
      <nav strctPageHeaderCrumbs>Compute / Hosts</nav>
      <button strctPageHeaderActions>Migrate</button>
      <span class="meta">status strip</span>
    </strct-page-header>
  `,
})
class Host {}

describe('StrctPageHeader', () => {
  it('renders h1 title, subtitle, crumbs, actions and projected meta', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1.strct-ph__title')?.textContent).toBe('hv-02');
    expect(el.querySelector('.strct-ph__subtitle')?.textContent).toContain('Hypervisor');
    expect(el.querySelector('.strct-ph__crumbs')?.textContent).toContain('Compute / Hosts');
    expect(el.querySelector('.strct-ph__actions button')?.textContent).toBe('Migrate');
    expect(el.querySelector('.meta')?.textContent).toBe('status strip');
    expect(el.querySelector('.strct-ph')?.classList).toContain('strct-ph--divider');
  });
});

describe('StrctPageHeader — level, size, icon, title meta (FR-48-15)', () => {
  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctPageHeader);
    fixture.componentRef.setInput('title', 'Backup');
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('defaults are unchanged: an h1 with no icon', () => {
    const el = make();
    expect(el.querySelector('h1')!.textContent!.trim()).toBe('Backup');
    expect(el.querySelector('.strct-ph__icon')).toBeNull();
    expect(el.classList).not.toContain('strct-ph--pane');
  });

  it('level picks the element and size picks the look, independently', () => {
    expect(make({ level: 2 }).querySelector('h2')).toBeTruthy();
    expect(make({ level: 3 }).querySelector('h3')).toBeTruthy();
    const pane = make({ level: 2, size: 'pane' });
    expect(pane.querySelector('h2')).toBeTruthy();
    expect(pane.classList).toContain('strct-ph--pane');
    // A pane-sized header can still be the page's h1 if the outline says so.
    expect(make({ size: 'pane' }).querySelector('h1')).toBeTruthy();
  });

  it('renders a leading icon when asked', () => {
    expect(make({ icon: 'host' }).querySelector('.strct-ph__icon')).toBeTruthy();
  });
});

describe('StrctPageHeader — title meta slot', () => {
  @Component({
    imports: [StrctPageHeader, StrctPageHeaderTitleMeta],
    template: `<strct-page-header title="Backup" [level]="2" size="pane">
      <span strctPageHeaderTitleMeta class="state">Enabled</span>
    </strct-page-header>`,
  })
  class MetaHost {}

  it('places the meta beside the title, inside the title row', () => {
    const fixture = TestBed.createComponent(MetaHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-ph__titlerow .strct-ph__titlemeta .state')).toBeTruthy();
  });
});
