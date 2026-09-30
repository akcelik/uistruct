import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctAlert, StrctAlertActions } from './alert';

describe('StrctAlert', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctAlert);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-alert');
  });

  it('applies type modifier classes', () => {
    const fixture = TestBed.createComponent(StrctAlert);

    fixture.componentRef.setInput('type', 'success');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-alert--success');

    fixture.componentRef.setInput('type', 'warning');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-alert--warning');

    fixture.componentRef.setInput('type', 'critical');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-alert--critical');
  });

  it('uses role="status" normally and role="alert" for critical', () => {
    const fixture = TestBed.createComponent(StrctAlert);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).getAttribute('role')).toBe('status');

    fixture.componentRef.setInput('type', 'critical');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).getAttribute('role')).toBe('alert');
  });

  // FR-48-22
  it('takes an icon override and keeps the derived one otherwise', () => {
    const fixture = TestBed.createComponent(StrctAlert);
    fixture.componentRef.setInput('type', 'info');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const icon = () => el.querySelector('.strct-alert__icon');
    expect(icon()).toBeTruthy();
    fixture.componentRef.setInput('icon', 'lock');
    fixture.detectChanges();
    // the override reaches strct-icon's name input
    expect(el.querySelector('strct-icon')).toBeTruthy();
    expect(fixture.componentInstance.icon()).toBe('lock');
  });

  it('keeps the layout in an inner row, so a host display cannot break it', () => {
    const fixture = TestBed.createComponent(StrctAlert);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const row = el.querySelector('.strct-alert__row') as HTMLElement;
    expect(row).toBeTruthy();
    // icon, body (and the close button) are siblings inside the row
    expect(row.querySelector('.strct-alert__icon')).toBeTruthy();
    expect(row.querySelector('.strct-alert__body')).toBeTruthy();
  });
});

// FR-49-11 — a warning that carries its own fix.
describe('StrctAlert — actions slot', () => {
  @Component({
    imports: [StrctAlert, StrctAlertActions],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
      <strct-alert type="warning" [closable]="closable()">
        3 VMs differ from the policy
        <button strctAlertActions type="button" class="fix" (click)="fixed = fixed + 1">
          Remediate
        </button>
      </strct-alert>
    `,
  })
  class Host {
    closable = signal(false);
    fixed = 0;
  }

  it('puts the actions at the row’s end, after the body, and leaves the close button last', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const row = el.querySelector('.strct-alert__row')!;
    const actions = el.querySelector('.strct-alert__actions')!;
    expect(actions.querySelector('.fix')).toBeTruthy();
    // The body keeps the projected text, not the button.
    expect(el.querySelector('.strct-alert__body')!.textContent!.trim()).toBe(
      '3 VMs differ from the policy',
    );
    // DOM order: actions are declared first (so the selector wins) and CSS
    // order puts them after the body — the classes carry that contract.
    expect([...row.children].map((c) => c.tagName.toLowerCase())).toEqual([
      'strct-icon',
      'span',
      'div',
    ]);
    expect([...row.children][1].className).toContain('strct-alert__actions');
    expect(getComputedStyle([...row.children][1]).order).not.toBe(
      getComputedStyle([...row.children][2]).order,
    );

    (el.querySelector('.fix') as HTMLButtonElement).click();
    expect(fixture.componentInstance.fixed).toBe(1);

    fixture.componentInstance.closable.set(true);
    fixture.detectChanges();
    expect([...row.children].at(-1)!.className).toContain('strct-alert__close');
  });

  it('draws nothing when no action is projected', () => {
    @Component({ imports: [StrctAlert], template: `<strct-alert>Plain</strct-alert>` })
    class Bare {}
    const fixture = TestBed.createComponent(Bare);
    fixture.detectChanges();
    const actions = (fixture.nativeElement as HTMLElement).querySelector('.strct-alert__actions')!;
    expect(actions.children.length).toBe(0);
    expect(actions.textContent!.trim()).toBe('');
  });
});
