import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctCellStatus, StrctValidationState } from './validation';

@Component({
  imports: [StrctCellStatus],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<strct-cell-status [state]="state" />`,
})
class HostComponent {
  state: StrctValidationState = { status: 'idle' };
}

function setup(state: StrctValidationState) {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.state = state;
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('strct-cell-status') as HTMLElement;
}

describe('StrctCellStatus', () => {
  it('renders nothing for idle', () => {
    const host = setup({ status: 'idle' });
    expect(host.querySelector('.strct-vstate')).toBeNull();
  });

  it('renders a spinner while checking', () => {
    const host = setup({ status: 'checking', message: 'Checking…' });
    expect(host.querySelector('.strct-vstate--checking strct-spinner')).toBeTruthy();
    expect(host.querySelector('.strct-vstate__msg')?.textContent).toContain('Checking…');
  });

  it('labels the checking spinner with a localizable default', () => {
    const fixture = TestBed.createComponent(StrctCellStatus);
    fixture.componentRef.setInput('state', { status: 'checking' });
    fixture.detectChanges();
    const spinner = (fixture.nativeElement as HTMLElement).querySelector('strct-spinner')!;
    expect(spinner.getAttribute('aria-label')).toBe('Loading');

    fixture.componentRef.setInput('loadingLabel', 'Prüfung läuft');
    fixture.detectChanges();
    expect(spinner.getAttribute('aria-label')).toBe('Prüfung läuft');
  });

  it('renders an icon + message for ok / warning / error', () => {
    expect(setup({ status: 'ok' }).querySelector('.strct-vstate--ok strct-icon')).toBeTruthy();
    expect(
      setup({ status: 'warning' }).querySelector('.strct-vstate--warning strct-icon'),
    ).toBeTruthy();
    const err = setup({ status: 'error', message: 'unreachable' });
    expect(err.querySelector('.strct-vstate--error strct-icon')).toBeTruthy();
    expect(err.querySelector('.strct-vstate__msg')?.getAttribute('aria-live')).toBe('polite');
  });
});

// FR-59-02: a line that states a fact — an accent or info tone, an icon of its
// own, and no live region, because nothing changed.
describe('StrctCellStatus — a phrase, not a verdict', () => {
  const make = (inputs: Record<string, unknown>) => {
    const fixture = TestBed.createComponent(StrctCellStatus);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('carries the accent and info tones', () => {
    expect(
      make({ state: { status: 'accent', message: 'an update is available' } }).querySelector(
        '.strct-vstate--accent',
      ),
    ).toBeTruthy();
    expect(
      make({ state: { status: 'info', message: 'read 2 minutes ago' } }).querySelector(
        '.strct-vstate--info',
      ),
    ).toBeTruthy();
  });

  it('takes an icon of its own over the one the status carries', () => {
    const el = make({
      state: { status: 'accent', message: 'an update is available' },
      icon: 'arrowUp',
    });
    expect(el.querySelector('strct-icon')).toBeTruthy();
    const withStatusIcon = make({ state: { status: 'ok', message: 'reachable' } });
    expect(withStatusIcon.querySelector('strct-icon')).toBeTruthy();
  });

  it('announces a verdict, and says a standing fact quietly', () => {
    const verdict = make({ state: { status: 'error', message: 'unreachable' } });
    expect(verdict.querySelector('.strct-vstate__msg')!.getAttribute('aria-live')).toBe('polite');

    const fact = make({
      state: { status: 'accent', message: 'an update is available' },
      announce: false,
    });
    expect(fact.querySelector('.strct-vstate__msg')!.getAttribute('aria-live')).toBeNull();
    expect(fact.querySelector('.strct-vstate__msg')!.textContent).toContain(
      'an update is available',
    );
  });
});
