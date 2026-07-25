import { TestBed } from '@angular/core/testing';
import { StrctKnob } from './knob';
describe('StrctKnob', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctKnob);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-knob class in its template', () => {
    const fixture = TestBed.createComponent(StrctKnob);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-knob')).toBeTruthy();
  });

  it('implements CVA', () => {
    const fixture = TestBed.createComponent(StrctKnob);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');
  });

  it('binds the label input to aria-label', () => {
    const fixture = TestBed.createComponent(StrctKnob);
    fixture.componentRef.setInput('label', 'Fan');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('.strct-knob');
    expect(el.getAttribute('aria-label')).toBe('Fan');
  });

  it('does not emit NaN when step is 0', () => {
    const fixture = TestBed.createComponent(StrctKnob);
    const cmp = fixture.componentInstance;
    fixture.componentRef.setInput('step', 0);
    fixture.detectChanges();
    const onChange = vi.fn();
    cmp.registerOnChange(onChange);
    const el: HTMLElement = fixture.nativeElement.querySelector('.strct-knob');
    el.dispatchEvent(new MouseEvent('pointerdown', { clientY: 100, bubbles: true }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientY: 25 }));
    window.dispatchEvent(new MouseEvent('pointerup'));
    expect(onChange).toHaveBeenCalled();
    const emitted = onChange.mock.calls[0][0] as number;
    expect(Number.isFinite(emitted)).toBe(true);
    expect(cmp.value()).toBe(emitted);
  });

  it('ends the drag on pointercancel', () => {
    const fixture = TestBed.createComponent(StrctKnob);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    const onTouched = vi.fn();
    cmp.registerOnTouched(onTouched);
    const el: HTMLElement = fixture.nativeElement.querySelector('.strct-knob');
    el.dispatchEvent(new MouseEvent('pointerdown', { clientY: 100, bubbles: true }));
    window.dispatchEvent(new MouseEvent('pointercancel'));
    expect(onTouched).toHaveBeenCalled();
  });

  it('removes window drag listeners when destroyed mid-drag', () => {
    const fixture = TestBed.createComponent(StrctKnob);
    fixture.detectChanges();
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const el: HTMLElement = fixture.nativeElement.querySelector('.strct-knob');
    el.dispatchEvent(new MouseEvent('pointerdown', { clientY: 100, bubbles: true }));
    fixture.destroy();
    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('pointercancel', expect.any(Function));
    removeSpy.mockRestore();
  });
});
