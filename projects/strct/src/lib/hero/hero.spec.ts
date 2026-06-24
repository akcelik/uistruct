import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StrctStatus } from '../status';
import { StrctHero } from './hero';

@Component({
  imports: [StrctHero],
  template: `
    <strct-hero [status]="status" [icon]="icon" heading="All systems healthy">
      Everything is responding.
      <div strctHeroMeta>meta</div>
      <div strctHeroActions>actions</div>
    </strct-hero>
  `,
})
class HostComponent {
  status: StrctStatus = 'success';
  icon = '';
}

function setup(patch: Partial<HostComponent> = {}) {
  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  const host = fixture.nativeElement.querySelector('strct-hero') as HTMLElement;
  const hero = fixture.debugElement.query(By.directive(StrctHero)).componentInstance as StrctHero;
  return { host, hero };
}

/** Reads the resolved (possibly defaulted) icon name off the component. */
function iconOf(hero: StrctHero): string {
  return (hero as unknown as { resolvedIcon: () => string }).resolvedIcon();
}

describe('StrctHero', () => {
  it('applies the base and status host classes', () => {
    const { host } = setup({ status: 'success' });
    expect(host.classList).toContain('strct-hero');
    expect(host.classList).toContain('strct-hero--success');
  });

  it('exposes the heading as the accessible name via aria-labelledby', () => {
    const { host } = setup();
    const labelledby = host.getAttribute('aria-labelledby');
    expect(labelledby).toBeTruthy();
    const heading = host.querySelector(`#${labelledby}`);
    expect(heading?.textContent).toContain('All systems healthy');
  });

  it('uses role="status" normally and role="alert" for critical', () => {
    expect(setup({ status: 'success' }).host.getAttribute('role')).toBe('status');
    expect(setup({ status: 'critical' }).host.getAttribute('role')).toBe('alert');
  });

  it('derives a default icon per status when none is given', () => {
    expect(iconOf(setup({ status: 'warning', icon: '' }).hero)).toBe('warning');
    expect(iconOf(setup({ status: 'success', icon: '' }).hero)).toBe('success');
    expect(iconOf(setup({ status: 'accent', icon: '' }).hero)).toBe('info');
  });

  it('prefers an explicit icon over the per-status default', () => {
    expect(iconOf(setup({ status: 'success', icon: 'shield' }).hero)).toBe('shield');
  });
});
