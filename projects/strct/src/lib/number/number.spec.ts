import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StrctNumber } from './number';

type Fixture = ComponentFixture<StrctNumber>;

function create(setup?: (fixture: Fixture) => void): Fixture {
  const fixture = TestBed.createComponent(StrctNumber);
  if (setup) setup(fixture);
  fixture.detectChanges();
  return fixture;
}

function inputEl(fixture: Fixture): HTMLInputElement {
  return fixture.nativeElement.querySelector('.strct-num__input');
}

function buttons(fixture: Fixture): HTMLButtonElement[] {
  return [...fixture.nativeElement.querySelectorAll('.strct-num__btn')];
}

function type(fixture: Fixture, raw: string): void {
  const el = inputEl(fixture);
  el.value = raw;
  el.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function key(fixture: Fixture, keyName: string): void {
  inputEl(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: keyName }));
  fixture.detectChanges();
}

describe('StrctNumber', () => {
  it('renders the field and both step buttons', () => {
    const fixture = create();
    expect(inputEl(fixture)).toBeTruthy();
    expect(buttons(fixture).length).toBe(2);
  });

  it('round-trips a value through the CVA (writeValue → field, step → onChange)', () => {
    const fixture = create();
    const cmp = fixture.componentInstance;
    const onChange = vi.fn();
    cmp.registerOnChange(onChange);

    cmp.writeValue(5);
    fixture.detectChanges();
    expect(inputEl(fixture).value).toBe('5');
    expect(cmp.value()).toBe(5);

    buttons(fixture)[1].click(); // +
    fixture.detectChanges();
    expect(onChange).toHaveBeenCalledWith(6);
    expect(inputEl(fixture).value).toBe('6');

    buttons(fixture)[0].click(); // −
    fixture.detectChanges();
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('allows free typing and emits parsed numbers; empty emits null', () => {
    const fixture = create();
    const onChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);

    type(fixture, '12.5');
    expect(onChange).toHaveBeenLastCalledWith(12.5);

    // An intermediate state that doesn't parse keeps the text, holds the value.
    type(fixture, '-');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(inputEl(fixture).value).toBe('-');

    type(fixture, '');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('clamps to min/max on blur', () => {
    const fixture = create((f) => {
      f.componentRef.setInput('min', 0);
      f.componentRef.setInput('max', 10);
    });
    const onChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);

    type(fixture, '42');
    inputEl(fixture).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(onChange).toHaveBeenLastCalledWith(10);
    expect(inputEl(fixture).value).toBe('10');

    type(fixture, '-7');
    inputEl(fixture).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(inputEl(fixture).value).toBe('0');
  });

  it('restores the last committed value when blurred with unparseable text', () => {
    const fixture = create();
    fixture.componentInstance.writeValue(3);
    fixture.detectChanges();

    type(fixture, 'abc');
    inputEl(fixture).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(inputEl(fixture).value).toBe('3');
  });

  it('steps by the step input via the buttons and clamps them immediately', () => {
    const fixture = create((f) => {
      f.componentRef.setInput('step', 2);
      f.componentRef.setInput('max', 5);
    });
    const onChange = vi.fn();
    const cmp = fixture.componentInstance;
    cmp.registerOnChange(onChange);
    cmp.writeValue(0);
    fixture.detectChanges();

    buttons(fixture)[1].click(); // + → 2
    buttons(fixture)[1].click(); // + → 4
    buttons(fixture)[1].click(); // + → clamped to 5
    fixture.detectChanges();
    expect(onChange).toHaveBeenLastCalledWith(5);
    expect(inputEl(fixture).value).toBe('5');
    expect(buttons(fixture)[1].disabled).toBe(true); // at max
  });

  it('steps from min (or 0) when the field is empty', () => {
    const fixture = create((f) => f.componentRef.setInput('min', 10));
    const onChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);

    buttons(fixture)[1].click(); // + on empty → min
    fixture.detectChanges();
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('supports keyboard: Arrow ±step, Page ±10×step, Home/End to min/max', () => {
    const fixture = create((f) => {
      f.componentRef.setInput('min', 0);
      f.componentRef.setInput('max', 100);
      f.componentRef.setInput('step', 2);
    });
    const cmp = fixture.componentInstance;
    cmp.writeValue(50);
    fixture.detectChanges();

    key(fixture, 'ArrowUp');
    expect(cmp.value()).toBe(52);
    key(fixture, 'ArrowDown');
    expect(cmp.value()).toBe(50);
    key(fixture, 'PageUp');
    expect(cmp.value()).toBe(70);
    key(fixture, 'PageDown');
    expect(cmp.value()).toBe(50);
    key(fixture, 'End');
    expect(cmp.value()).toBe(100);
    key(fixture, 'Home');
    expect(cmp.value()).toBe(0);
    expect(inputEl(fixture).value).toBe('0');
  });

  it('merges the static disabled input with setDisabledState (OR)', () => {
    const fixture = create();
    const cmp = fixture.componentInstance;

    cmp.setDisabledState(true);
    fixture.detectChanges();
    expect(cmp.isDisabled()).toBe(true);
    expect(inputEl(fixture).disabled).toBe(true);
    expect(buttons(fixture)[0].disabled).toBe(true);

    // Releasing the form disable still honours the static input.
    cmp.setDisabledState(false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(cmp.isDisabled()).toBe(true);
    expect(inputEl(fixture).disabled).toBe(true);
  });

  it('ignores steps while disabled', () => {
    const fixture = create();
    const cmp = fixture.componentInstance;
    cmp.writeValue(1);
    cmp.setDisabledState(true);
    fixture.detectChanges();

    key(fixture, 'ArrowUp');
    expect(cmp.value()).toBe(1);
  });

  it('marks the control touched on blur and on button steps', () => {
    const fixture = create();
    const cmp = fixture.componentInstance;
    const onTouched = vi.fn();
    cmp.registerOnTouched(onTouched);

    buttons(fixture)[1].click();
    expect(onTouched).toHaveBeenCalledTimes(1);

    inputEl(fixture).dispatchEvent(new Event('blur'));
    expect(onTouched).toHaveBeenCalledTimes(2);
  });

  it('exposes spinbutton semantics with localizable button labels', () => {
    const fixture = create((f) => {
      f.componentRef.setInput('min', 0);
      f.componentRef.setInput('max', 10);
      f.componentRef.setInput('incrementLabel', 'Increase');
      f.componentRef.setInput('decrementLabel', 'Decrease');
    });
    fixture.componentInstance.writeValue(4);
    fixture.detectChanges();

    const el = inputEl(fixture);
    expect(el.getAttribute('role')).toBe('spinbutton');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('10');
    expect(el.getAttribute('aria-valuenow')).toBe('4');
    expect(buttons(fixture)[0].getAttribute('aria-label')).toBe('Decrease');
    expect(buttons(fixture)[1].getAttribute('aria-label')).toBe('Increase');
  });
});
