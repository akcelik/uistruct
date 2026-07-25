import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctChips } from './chips';
describe('StrctChips', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctChips);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-chips class in its template', () => {
    const fixture = TestBed.createComponent(StrctChips);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-chips')).toBeTruthy();
  });

  it('implements CVA', () => {
    const fixture = TestBed.createComponent(StrctChips);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');
  });

  it('removes only the clicked duplicate', () => {
    const fixture = TestBed.createComponent(StrctChips);
    const cmp = fixture.componentInstance;
    cmp.writeValue(['a', 'b', 'a']);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      '.strct-tag__remove',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(3);
    buttons[0].click();
    fixture.detectChanges();
    expect(cmp.value()).toEqual(['b', 'a']);
  });

  it('propagates the disabled state to the tag remove buttons', () => {
    const fixture = TestBed.createComponent(StrctChips);
    const cmp = fixture.componentInstance;
    cmp.writeValue(['a', 'b']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.strct-tag__remove').length).toBe(2);

    cmp.setDisabledState(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.strct-tag__remove').length).toBe(0);
  });

  it('parses allowDuplicates="false" as false (booleanAttribute)', () => {
    @Component({
      imports: [StrctChips],
      template: `<strct-chips allowDuplicates="false" />`,
    })
    class HostComponent {
      @ViewChild(StrctChips) chips!: StrctChips;
    }

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const cmp = fixture.componentInstance.chips;
    cmp.writeValue(['a']);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.strct-chips__input') as HTMLInputElement;
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(cmp.value()).toEqual(['a']);
  });
});
