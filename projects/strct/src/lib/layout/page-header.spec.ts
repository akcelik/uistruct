import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctPageHeader, StrctPageHeaderActions, StrctPageHeaderCrumbs } from './page-header';

@Component({
  imports: [StrctPageHeader, StrctPageHeaderActions, StrctPageHeaderCrumbs],
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
