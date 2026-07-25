import { TestBed } from '@angular/core/testing';
import { StrctDatepicker } from './datepicker';

describe('StrctDatepicker', () => {
  it('applies the strct-dp host class', () => {
    const fixture = TestBed.createComponent(StrctDatepicker);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-dp');
  });

  it('implements CVA and invokes registerOnChange callback on pick', () => {
    const fixture = TestBed.createComponent(StrctDatepicker);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted = '';
    cmp.registerOnChange((v: string) => (emitted = v));
    cmp.pick('2024-06-04');
    expect(emitted).toBe('2024-06-04');
  });

  it('merges the static disabled input with the CVA disabled state', () => {
    const fixture = TestBed.createComponent(StrctDatepicker);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

    expect(cmp.isDisabled()).toBe(true);
    expect(el.querySelector<HTMLInputElement>('.strct-dp__input')!.disabled).toBe(true);
    cmp.toggle();
    expect(cmp.open()).toBe(false);

    // A static input change must not clobber the forms-driven disabled state.
    cmp.setDisabledState(true);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(cmp.isDisabled()).toBe(true);
    expect(el.querySelector<HTMLInputElement>('.strct-dp__input')!.disabled).toBe(true);
  });

  it('accepts a boolean attribute for disabled', () => {
    const fixture = TestBed.createComponent(StrctDatepicker);
    fixture.componentRef.setInput('disabled', '');
    fixture.detectChanges();
    expect(fixture.componentInstance.isDisabled()).toBe(true);
  });

  // APG date-picker dialog: ARIA grid semantics + full keyboard grid
  function openAt(iso: string) {
    const fixture = TestBed.createComponent(StrctDatepicker);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    cmp.writeValue(iso);
    cmp.toggle();
    fixture.detectChanges();
    return { fixture, cmp, el: fixture.nativeElement as HTMLElement };
  }
  const key = (k: string, shift = false) =>
    new KeyboardEvent('keydown', { key: k, shiftKey: shift });

  it('renders an ARIA grid: rows, columnheaders, labeled gridcells, roving tabindex', () => {
    const { el } = openAt('2026-03-15');
    const grid = el.querySelector('[role="grid"]')!;
    expect(grid).toBeTruthy();
    expect(grid.querySelectorAll('[role="row"]').length).toBe(7); // dow header + 6 weeks
    expect(grid.querySelectorAll('[role="columnheader"]').length).toBe(7);
    const cells = grid.querySelectorAll('[role="gridcell"]');
    expect(cells.length).toBe(42);
    // exactly one cell is tabbable (the keyboard cursor), and it is the value
    const tabbable = [...cells].filter((c) => c.getAttribute('tabindex') === '0');
    expect(tabbable.length).toBe(1);
    expect(tabbable[0].getAttribute('data-iso')).toBe('2026-03-15');
    expect(tabbable[0].getAttribute('aria-selected')).toBe('true');
    expect(tabbable[0].getAttribute('aria-label')).toContain('March 15, 2026');
  });

  it('Home/End jump to the week edges; Shift+PageUp/PageDown move a year', () => {
    const { cmp } = openAt('2026-03-18'); // a Wednesday
    cmp.onKeydown(key('Home'));
    expect(cmp.focusedIso()).toBe('2026-03-15'); // Sunday
    cmp.onKeydown(key('End'));
    expect(cmp.focusedIso()).toBe('2026-03-21'); // Saturday
    cmp.onKeydown(key('PageUp', true));
    expect(cmp.focusedIso()).toBe('2025-03-21'); // previous year
    cmp.onKeydown(key('PageDown', true));
    expect(cmp.focusedIso()).toBe('2026-03-21');
    cmp.onKeydown(key('PageUp'));
    expect(cmp.focusedIso()).toBe('2026-02-21'); // previous month
  });

  it('arrows walk days/weeks and Enter picks the focused day', () => {
    const { cmp } = openAt('2026-03-18');
    cmp.onKeydown(key('ArrowRight'));
    cmp.onKeydown(key('ArrowDown'));
    expect(cmp.focusedIso()).toBe('2026-03-26');
    let emitted = '';
    cmp.registerOnChange((v: string) => (emitted = v));
    cmp.onKeydown(key('Enter'));
    expect(emitted).toBe('2026-03-26');
    expect(cmp.open()).toBe(false);
  });

  it('renders custom monthNames and honors weekStart in the grid', () => {
    const fixture = TestBed.createComponent(StrctDatepicker);
    fixture.componentRef.setInput('monthNames', [
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
    ]);
    fixture.componentRef.setInput('weekStart', 1); // Monday
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    cmp.writeValue('2026-03-15');
    cmp.toggle();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.strct-dp__title')!.textContent).toContain('Marzo 2026');
    const headers = [...el.querySelectorAll('[role="columnheader"]')];
    expect(headers[0].textContent!.trim()).toBe('Mo');
    expect(headers[6].textContent!.trim()).toBe('Su');
    // March 1, 2026 is a Sunday: with weekStart=1 the grid leads with the
    // previous Monday instead of March 1 itself.
    const cells = el.querySelectorAll('[role="gridcell"]');
    expect(cells[0].getAttribute('data-iso')).toBe('2026-02-23');
    expect(cells[41].getAttribute('data-iso')).toBe('2026-04-05');
  });

  it('keeps the Sunday-first grid by default', () => {
    const { el } = openAt('2026-03-15');
    const headers = [...el.querySelectorAll('[role="columnheader"]')];
    expect(headers[0].textContent!.trim()).toBe('Su');
    expect(el.querySelector('[role="gridcell"]')!.getAttribute('data-iso')).toBe('2026-03-01');
  });

  it('uses localizable prev/next month labels', () => {
    const fixture = TestBed.createComponent(StrctDatepicker);
    fixture.componentRef.setInput('prevMonthLabel', 'Mes anterior');
    fixture.componentRef.setInput('nextMonthLabel', 'Mes siguiente');
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    cmp.toggle();
    fixture.detectChanges();
    const navs = (fixture.nativeElement as HTMLElement).querySelectorAll('.strct-dp__nav');
    expect(navs[0].getAttribute('aria-label')).toBe('Mes anterior');
    expect(navs[1].getAttribute('aria-label')).toBe('Mes siguiente');
  });

  it('Home/End respect weekStart', () => {
    const fixture = TestBed.createComponent(StrctDatepicker);
    fixture.componentRef.setInput('weekStart', 1); // Monday
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    cmp.writeValue('2026-03-18'); // a Wednesday
    cmp.toggle();
    fixture.detectChanges();
    cmp.onKeydown(key('Home'));
    expect(cmp.focusedIso()).toBe('2026-03-16'); // Monday
    cmp.onKeydown(key('End'));
    expect(cmp.focusedIso()).toBe('2026-03-22'); // Sunday
  });
});
