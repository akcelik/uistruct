import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctCellStatus, StrctValidationState } from './validation';

@Component({
  imports: [StrctCellStatus],
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
