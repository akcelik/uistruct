import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { StrctSegmented, StrctSegmentedOption } from './segmented';

@Component({
  imports: [StrctSegmented, FormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<strct-segmented [options]="options" [(ngModel)]="value" />`,
})
class HostComponent {
  options: StrctSegmentedOption[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'failed', label: 'Failed', disabled: true },
  ];
  value: unknown = 'all';
}

async function setup(patch: Partial<HostComponent> = {}) {
  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const host = fixture.nativeElement.querySelector('strct-segmented') as HTMLElement;
  const buttons = [...host.querySelectorAll('button')] as HTMLButtonElement[];
  return { fixture, host, buttons };
}

describe('StrctSegmented', () => {
  it('renders a radiogroup with one radio button per option', async () => {
    const { host, buttons } = await setup();
    expect(host.getAttribute('role')).toBe('radiogroup');
    expect(buttons.length).toBe(3);
    expect(buttons.every((b) => b.getAttribute('role') === 'radio')).toBe(true);
  });

  it('reflects the bound value as the selected/checked segment', async () => {
    const { buttons } = await setup({ value: 'active' });
    expect(buttons[1].getAttribute('aria-checked')).toBe('true');
    expect(buttons[1].classList).toContain('strct-seg__opt--selected');
    expect(buttons[0].getAttribute('aria-checked')).toBe('false');
  });

  it('writes back to the model on click', async () => {
    const { fixture, buttons } = await setup({ value: 'all' });
    buttons[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value).toBe('active');
  });

  it('places the roving tabindex on the selected segment only', async () => {
    const { buttons } = await setup({ value: 'active' });
    expect(buttons[1].getAttribute('tabindex')).toBe('0');
    expect(buttons[0].getAttribute('tabindex')).toBe('-1');
  });

  it('moves selection with arrow keys, skipping disabled options', async () => {
    const { fixture, host } = await setup({ value: 'active' });
    // active -> next enabled wraps past the disabled "failed" back to "all".
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value).toBe('all');
  });

  it('mirrors horizontal arrows under RTL', async () => {
    const { fixture, host } = await setup({
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C' },
      ],
      value: 'b',
    });
    host.style.direction = 'rtl';
    // RTL: ArrowLeft moves forward, ArrowRight moves backward.
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value).toBe('c');

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value).toBe('b');
  });

  it('does not select a disabled option on click', async () => {
    const { fixture, buttons } = await setup({ value: 'all' });
    buttons[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe('all');
  });

  it('merges the static disabled input with the CVA disabled state', () => {
    const fixture = TestBed.createComponent(StrctSegmented);
    fixture.componentRef.setInput('options', [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;

    expect(cmp.isDisabled()).toBe(true);
    expect(host.classList).toContain('strct-seg--disabled');
    expect(host.querySelectorAll('button[disabled]').length).toBe(2);

    // Static disable stays even if the form re-enables.
    cmp.setDisabledState(false);
    expect(cmp.isDisabled()).toBe(true);

    // A static input change must not clobber the forms-driven disabled state.
    cmp.setDisabledState(true);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(cmp.isDisabled()).toBe(true);
    expect(host.classList).toContain('strct-seg--disabled');
  });
});
