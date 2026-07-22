import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctTimeRange, StrctTimeRangePicker } from './time-range';

@Component({
  imports: [StrctTimeRangePicker],
  template: `<strct-time-range [(range)]="range" (applied)="applications = applications + 1" />`,
})
class HostComponent {
  range = signal<StrctTimeRange | null>(null);
  applications = 0;
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const openPanel = () => {
    el.querySelector<HTMLElement>('.strct-dd__trigger')!.click();
    fixture.detectChanges();
  };
  return { fixture, host: fixture.componentInstance, el, openPanel };
}

describe('StrctTimeRangePicker', () => {
  it('size forwards to the trigger button (sm toolbars line up)', () => {
    const fixture = TestBed.createComponent(StrctTimeRangePicker);
    fixture.detectChanges();
    const btn = () => (fixture.nativeElement as HTMLElement).querySelector('.strct-tr__trigger')!;
    expect(btn().classList).not.toContain('strct-btn--sm');
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    expect(btn().classList).toContain('strct-btn--sm');
  });

  it('shows the placeholder until a range is picked', () => {
    const { el } = setup();
    expect(el.querySelector('.strct-tr__label')?.textContent?.trim()).toBe('Select time range');
  });

  it('opens a labeled dialog popover with quick ranges and an absolute editor', () => {
    const { el, openPanel } = setup();
    openPanel();
    const dialog = el.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-label')).toBe('Time range');
    expect(el.querySelectorAll('.strct-tr__preset').length).toBe(6);
    expect(el.querySelectorAll('input[type="datetime-local"]').length).toBe(2);
  });

  it('picking a preset resolves it against now, stamps presetId and closes', () => {
    const { fixture, host, el, openPanel } = setup();
    openPanel();
    const preset = [...el.querySelectorAll<HTMLButtonElement>('.strct-tr__preset')].find((b) =>
      b.textContent!.includes('Last 1 hour'),
    )!;
    preset.click();
    fixture.detectChanges();
    const r = host.range()!;
    expect(r.presetId).toBe('1h');
    expect(r.to.getTime() - r.from.getTime()).toBe(3_600_000);
    expect(Math.abs(Date.now() - r.to.getTime())).toBeLessThan(5000);
    expect(host.applications).toBe(1);
    expect(el.querySelector('[role="dialog"]')).toBeNull(); // closed
    expect(el.querySelector('.strct-tr__label')?.textContent).toContain('Last 1 hour');
  });

  it('applies a valid absolute range and rejects from >= to', () => {
    const { fixture, host, el, openPanel } = setup();
    openPanel();
    const [from, to] = [...el.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')];
    const type = (input: HTMLInputElement, value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    type(from, '2026-07-20T10:00');
    type(to, '2026-07-20T08:00'); // invalid: from after to
    expect(el.querySelector('.strct-tr__error')).toBeTruthy();
    type(to, '2026-07-20T12:00');
    expect(el.querySelector('.strct-tr__error')).toBeNull();
    [...el.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent!.trim() === 'Apply')!
      .click();
    fixture.detectChanges();
    const r = host.range()!;
    expect(r.presetId).toBeUndefined();
    expect(r.to.getTime() - r.from.getTime()).toBe(2 * 3_600_000);
    expect(el.querySelector('[role="dialog"]')).toBeNull(); // closed on apply
    expect(el.querySelector('.strct-tr__label')?.textContent).toContain('→');
  });
});
