import { TestBed } from '@angular/core/testing';
import { StrctColorPicker } from './color-picker';

describe('StrctColorPicker', () => {
  it('applies the strct-cp host class', () => {
    const fixture = TestBed.createComponent(StrctColorPicker);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-cp');
  });

  it('implements CVA and invokes registerOnChange callback on pick', () => {
    const fixture = TestBed.createComponent(StrctColorPicker);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted = '';
    cmp.registerOnChange((v: string) => (emitted = v));
    cmp.pick('#ff0000');
    expect(emitted).toBe('#ff0000');
  });

  it('merges the static disabled input with the CVA disabled state', () => {
    const fixture = TestBed.createComponent(StrctColorPicker);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;
    const trigger = el.querySelector<HTMLButtonElement>('.strct-cp__trigger')!;

    expect(cmp.isDisabled()).toBe(true);
    expect(trigger.disabled).toBe(true);
    cmp.toggle();
    expect(cmp.open()).toBe(false);

    // A static input change must not clobber the forms-driven disabled state.
    cmp.setDisabledState(true);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(cmp.isDisabled()).toBe(true);
    expect(trigger.disabled).toBe(true);
  });

  it('accepts a boolean attribute for disabled', () => {
    const fixture = TestBed.createComponent(StrctColorPicker);
    fixture.componentRef.setInput('disabled', '');
    fixture.detectChanges();
    expect(fixture.componentInstance.isDisabled()).toBe(true);
  });

  it('returns focus to the trigger on pick and on Escape', () => {
    const fixture = TestBed.createComponent(StrctColorPicker);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const trigger = el.querySelector<HTMLButtonElement>('.strct-cp__trigger')!;

    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.strct-cp__chip')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.strct-cp__panel')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    fixture.detectChanges();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(el.querySelector('.strct-cp__panel')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
