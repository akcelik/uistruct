import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { StrctInlineEdit } from './inline-edit';

@Component({
  imports: [StrctInlineEdit, ReactiveFormsModule],
  template: `<strct-inline-edit [formControl]="ctrl" [disabled]="disabled()" />`,
})
class HostComponent {
  ctrl = new FormControl('web-01');
  disabled = signal(false);
}

function setup(initial = 'web-01') {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.ctrl = new FormControl(initial);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

const key = (key: string) => new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });

/** Lets the component's deferred (setTimeout) focus land. */
const flushFocus = () => new Promise((r) => setTimeout(r));

/** Click the display value and return the swapped-in input. */
function enterEdit(fixture: ComponentFixture<HostComponent>): HTMLInputElement {
  const el = fixture.nativeElement as HTMLElement;
  el.querySelector<HTMLButtonElement>('.strct-ie__value')!.click();
  fixture.detectChanges();
  return el.querySelector<HTMLInputElement>('.strct-ie__input')!;
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('StrctInlineEdit', () => {
  it('shows the value in display mode with a pencil edit affordance', () => {
    const { el } = setup();
    expect(el.querySelector('.strct-ie__value')!.textContent).toContain('web-01');
    expect(el.querySelector('.strct-ie__input')).toBeNull();
    const edit = el.querySelector<HTMLButtonElement>('.strct-ie__edit')!;
    expect(edit.getAttribute('aria-label')).toBe('Edit');
  });

  it('shows the localizable placeholder (muted) when the value is empty', () => {
    const { el } = setup('');
    const value = el.querySelector('.strct-ie__value')!;
    expect(value.textContent).toContain('Empty');
    expect(value.classList.contains('strct-ie__value--empty')).toBe(true);
  });

  it('enters edit mode on value click and focuses the seeded input', async () => {
    const { fixture, el } = setup();
    const input = enterEdit(fixture);
    expect(input.value).toBe('web-01');
    expect(el.querySelector('.strct-ie__display')).toBeNull();
    await flushFocus();
    expect(document.activeElement).toBe(input);
  });

  it('the pencil button also enters edit mode', () => {
    const { fixture, el } = setup();
    el.querySelector<HTMLButtonElement>('.strct-ie__edit')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.strct-ie__input')).toBeTruthy();
  });

  it('Enter commits the draft to the form control and returns to display mode', async () => {
    const { fixture, host, el } = setup();
    const input = enterEdit(fixture);
    type(input, 'web-02');
    input.dispatchEvent(key('Enter'));
    fixture.detectChanges();
    expect(host.ctrl.value).toBe('web-02');
    expect(el.querySelector('.strct-ie__input')).toBeNull();
    expect(el.querySelector('.strct-ie__value')!.textContent).toContain('web-02');
    await flushFocus();
    expect(document.activeElement).toBe(el.querySelector('.strct-ie__value'));
  });

  it('blur commits too', () => {
    const { fixture, host, el } = setup();
    const input = enterEdit(fixture);
    type(input, 'db-01');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(host.ctrl.value).toBe('db-01');
    expect(el.querySelector('.strct-ie__input')).toBeNull();
  });

  it('Escape cancels, keeps the old value, and stops propagation', () => {
    const { fixture, host, el } = setup();
    const input = enterEdit(fixture);
    type(input, 'discarded');
    const event = key('Escape');
    let bubbled = false;
    el.addEventListener('keydown', () => (bubbled = true));
    input.dispatchEvent(event);
    fixture.detectChanges();
    expect(host.ctrl.value).toBe('web-01');
    expect(el.querySelector('.strct-ie__value')!.textContent).toContain('web-01');
    expect(bubbled).toBe(false); // stopPropagation
  });

  it('blur after Escape does not resurrect the cancelled draft', () => {
    const { fixture, host } = setup();
    const input = enterEdit(fixture);
    type(input, 'discarded');
    input.dispatchEvent(key('Escape'));
    fixture.detectChanges();
    // The input is gone; a stale blur must not commit.
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(host.ctrl.value).toBe('web-01');
  });

  it('writes form-control values into display mode', () => {
    const { fixture, host, el } = setup();
    host.ctrl.setValue('cache-01');
    fixture.detectChanges();
    expect(el.querySelector('.strct-ie__value')!.textContent).toContain('cache-01');
  });

  it('announces the committed value in a live region', async () => {
    const { fixture } = setup();
    const input = enterEdit(fixture);
    type(input, 'web-02');
    input.dispatchEvent(key('Enter'));
    fixture.detectChanges();
    await flushFocus();
    const region = document.querySelector('.strct-announcer[aria-live="polite"]');
    expect(region?.textContent).toBe('Changed to web-02');
  });

  it('disabled: no pencil, no edit mode (static input)', () => {
    const { fixture, host, el } = setup();
    host.disabled.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.strct-ie__edit')).toBeNull();
    el.querySelector<HTMLButtonElement>('.strct-ie__value')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.strct-ie__input')).toBeNull();
  });

  it('disabled via the forms API (setDisabledState) also locks editing', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.ctrl = new FormControl({ value: 'web-01', disabled: true });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-ie__edit')).toBeNull();
    expect(el.querySelector<HTMLButtonElement>('.strct-ie__value')!.disabled).toBe(true);
  });
});
