import { TestBed } from '@angular/core/testing';
import { StrctDatetimePicker } from './datetime-picker';

function setup(patch: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(StrctDatetimePicker);
  for (const [k, v] of Object.entries(patch)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  const cmp = fixture.componentInstance;
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, cmp, el };
}

function timeSelects(el: HTMLElement): HTMLSelectElement[] {
  return [...el.querySelectorAll<HTMLSelectElement>('.strct-dtp__time')];
}

function change(select: HTMLSelectElement, value: string) {
  select.value = value;
  select.dispatchEvent(new Event('change'));
}

describe('StrctDatetimePicker', () => {
  it('applies the strct-dtp host class', () => {
    const { el } = setup();
    expect(el.classList).toContain('strct-dtp');
  });

  // NgModel defers writes into the embedded datepicker behind a microtask —
  // flush it before asserting on (or interacting with) the calendar.
  it('CVA round-trip: writeValue splits the ISO value into date and time parts', async () => {
    const { fixture, cmp, el } = setup();
    cmp.writeValue('2026-03-04T14:30');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(cmp.value()).toBe('2026-03-04T14:30');
    expect(cmp.date()).toBe('2026-03-04');
    expect(cmp.hour()).toBe('14');
    expect(cmp.minute()).toBe('30');
    // …and the parts reach the rendered sub-controls.
    expect(el.querySelector<HTMLInputElement>('.strct-dp__input')!.value).toBe('Mar 4, 2026');
    const [hourSel, minSel] = timeSelects(el);
    expect(hourSel.value).toBe('14');
    expect(minSel.value).toBe('30');
  });

  it('writeValue(null) clears the value and keeps the time at 00:00', () => {
    const { fixture, cmp } = setup();
    cmp.writeValue(null);
    fixture.detectChanges();
    expect(cmp.value()).toBe('');
    expect(cmp.date()).toBe('');
    expect(cmp.hour()).toBe('00');
    expect(cmp.minute()).toBe('00');
  });

  it('date + time compose into the ISO value reported through onChange', () => {
    const { fixture, cmp, el } = setup();
    let emitted = '';
    cmp.registerOnChange((v: string) => (emitted = v));
    cmp.writeValue('2026-03-04T14:30');
    fixture.detectChanges();

    const [, minSel] = timeSelects(el);
    change(minSel, '45');
    fixture.detectChanges();
    expect(emitted).toBe('2026-03-04T14:45');

    const [hourSel] = timeSelects(el);
    change(hourSel, '08');
    fixture.detectChanges();
    expect(emitted).toBe('2026-03-04T08:45');
  });

  it('a calendar pick composes with the current time', async () => {
    const { fixture, cmp, el } = setup();
    let emitted = '';
    cmp.registerOnChange((v: string) => (emitted = v));
    cmp.writeValue('2026-03-04T09:15');
    await fixture.whenStable();
    fixture.detectChanges();

    // Open the embedded calendar and click a day.
    el.querySelector<HTMLInputElement>('.strct-dp__input')!.click();
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.strct-dp__day[data-iso="2026-03-10"]')!.click();
    fixture.detectChanges();

    expect(emitted).toBe('2026-03-10T09:15');
    expect(cmp.value()).toBe('2026-03-10T09:15');
  });

  it('minuteStep limits the minute options', () => {
    const { el } = setup({ minuteStep: 15 });
    const [, minSel] = timeSelects(el);
    expect([...minSel.options].map((o) => o.value)).toEqual(['00', '15', '30', '45']);
  });

  it('keeps an off-step written-in minute selectable', () => {
    const { fixture, cmp, el } = setup({ minuteStep: 15 });
    cmp.writeValue('2026-03-04T14:07');
    fixture.detectChanges();
    const [, minSel] = timeSelects(el);
    expect([...minSel.options].map((o) => o.value)).toEqual(['00', '07', '15', '30', '45']);
    expect(minSel.value).toBe('07');
  });

  it('passes localization inputs through to the embedded datepicker', async () => {
    const { fixture, el } = setup({
      monthNames: [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ],
      weekStart: 1,
      prevMonthLabel: 'Mes anterior',
      nextMonthLabel: 'Mes siguiente',
    });
    const cmp = fixture.componentInstance;
    cmp.writeValue('2026-03-15T10:00');
    await fixture.whenStable();
    fixture.detectChanges();
    el.querySelector<HTMLInputElement>('.strct-dp__input')!.click();
    fixture.detectChanges();

    expect(el.querySelector('.strct-dp__title')!.textContent).toContain('Marzo 2026');
    const headers = [...el.querySelectorAll('[role="columnheader"]')];
    expect(headers[0].textContent!.trim()).toBe('Mo');
    const navs = el.querySelectorAll('.strct-dp__nav');
    expect(navs[0].getAttribute('aria-label')).toBe('Mes anterior');
    expect(navs[1].getAttribute('aria-label')).toBe('Mes siguiente');
  });

  it('merges the static disabled input with the CVA disabled state', () => {
    const { fixture, cmp, el } = setup({ disabled: true });
    expect(cmp.isDisabled()).toBe(true);
    expect(el.querySelector<HTMLInputElement>('.strct-dp__input')!.disabled).toBe(true);
    for (const sel of timeSelects(el)) expect(sel.disabled).toBe(true);

    // A static input change must not clobber the forms-driven disabled state.
    cmp.setDisabledState(true);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(cmp.isDisabled()).toBe(true);
    expect(el.querySelector<HTMLInputElement>('.strct-dp__input')!.disabled).toBe(true);
  });

  it('uses localizable labels for the time selects', () => {
    const { el } = setup({ hourLabel: 'Stunde', minuteLabel: 'Minute(n)' });
    const [hourSel, minSel] = timeSelects(el);
    expect(hourSel.getAttribute('aria-label')).toBe('Stunde');
    expect(minSel.getAttribute('aria-label')).toBe('Minute(n)');
  });
});
