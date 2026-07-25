import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { StrctOption } from '../combobox/combobox';
import { StrctSelect } from './select';

const OPTIONS: StrctOption[] = [
  { value: 'eu', label: 'Europe' },
  { value: 'us', label: 'Americas' },
  { value: 'apac', label: 'Asia Pacific' },
  { value: 'mars', label: 'Mars', disabled: true },
];

@Component({
  imports: [StrctSelect, FormsModule],
  template: `<strct-select
    [options]="options()"
    [ngModel]="region()"
    (ngModelChange)="region.set($event)"
    placeholder="Pick a region"
  />`,
})
class HostComponent {
  options = signal<StrctOption[]>(OPTIONS);
  region = signal<string | null>(null);
}

async function setup(value: string | null = null) {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.region.set(value);
  fixture.detectChanges();
  await fixture.whenStable(); // let ngModel write the value
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const btn = el.querySelector<HTMLElement>('.strct-sel__btn')!;
  const key = (k: string) =>
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const opts = () => [...el.querySelectorAll<HTMLElement>('.strct-sel__opt')];
  const highlighted = () => el.querySelector<HTMLElement>('.strct-sel__opt--highlight');
  return { fixture, host: fixture.componentInstance, el, btn, key, opts, highlighted };
}

describe('StrctSelect', () => {
  it('renders a combobox button showing the placeholder, then the picked label', async () => {
    const { fixture, host, el, btn, opts } = await setup();
    expect(btn.getAttribute('role')).toBe('combobox');
    expect(btn.getAttribute('aria-haspopup')).toBe('listbox');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.textContent).toContain('Pick a region');
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('[role="listbox"]')).toBeTruthy();
    opts()[1].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(host.region()).toBe('us');
    expect(el.querySelector('[role="listbox"]')).toBeNull();
    expect(btn.textContent).toContain('Americas');
  });

  it('marks the selected option with aria-selected and a leading check', async () => {
    const { fixture, btn, opts } = await setup('us');
    btn.click();
    fixture.detectChanges();
    const [eu, us] = opts();
    expect(us.getAttribute('aria-selected')).toBe('true');
    expect(us.querySelector('.strct-sel__check svg')).toBeTruthy();
    expect(eu.getAttribute('aria-selected')).toBe('false');
    expect(eu.querySelector('.strct-sel__check svg')).toBeNull(); // aligned empty slot
    expect(eu.querySelector('.strct-sel__check')).toBeTruthy();
  });

  it('opening highlights the selected option and wires aria-activedescendant', async () => {
    const { fixture, btn, key, highlighted } = await setup('apac');
    key('ArrowDown');
    fixture.detectChanges();
    expect(highlighted()?.textContent).toContain('Asia Pacific');
    expect(btn.getAttribute('aria-activedescendant')).toBe(highlighted()!.id);
  });

  it('arrows move skipping disabled options and wrap; Enter commits', async () => {
    const { fixture, host, el, key, highlighted } = await setup('eu');
    key('ArrowDown'); // opens on Europe
    fixture.detectChanges();
    key('ArrowDown');
    fixture.detectChanges();
    expect(highlighted()?.textContent).toContain('Americas');
    key('ArrowDown');
    fixture.detectChanges();
    expect(highlighted()?.textContent).toContain('Asia Pacific');
    key('ArrowDown'); // Mars is disabled — wraps to Europe
    fixture.detectChanges();
    expect(highlighted()?.textContent).toContain('Europe');
    key('End'); // End lands on Mars → walks back to Asia Pacific
    fixture.detectChanges();
    expect(highlighted()?.textContent).toContain('Asia Pacific');
    key('Enter');
    fixture.detectChanges();
    expect(host.region()).toBe('apac');
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

  it('typeahead jumps to the label matching the typed prefix', async () => {
    const { fixture, host, key, highlighted } = await setup();
    key('ArrowDown');
    fixture.detectChanges();
    key('a');
    fixture.detectChanges();
    expect(highlighted()?.textContent).toContain('Americas');
    key('s');
    fixture.detectChanges();
    expect(highlighted()?.textContent).toContain('Asia Pacific');
    key('Enter');
    fixture.detectChanges();
    expect(host.region()).toBe('apac');
  });

  it('Escape closes without committing; outside click closes too', async () => {
    const { fixture, host, el, key } = await setup('eu');
    key('ArrowDown');
    fixture.detectChanges();
    key('ArrowDown');
    fixture.detectChanges();
    key('Escape');
    fixture.detectChanges();
    expect(el.querySelector('[role="listbox"]')).toBeNull();
    expect(host.region()).toBe('eu'); // unchanged

    key('ArrowDown');
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

  it('a disabled option cannot be picked', async () => {
    const { fixture, host, btn, opts } = await setup();
    btn.click();
    fixture.detectChanges();
    const mars = opts()[3];
    expect(mars.getAttribute('aria-disabled')).toBe('true');
    mars.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(host.region()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="listbox"]')).toBeTruthy();
  });

  it('disabled control does not open', async () => {
    @Component({
      imports: [StrctSelect],
      template: `<strct-select [options]="options" disabled />`,
    })
    class DisabledHost {
      options = OPTIONS;
    }
    const fixture = TestBed.createComponent(DisabledHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector<HTMLButtonElement>('.strct-sel__btn')!;
    expect(btn.disabled).toBe(true);
    btn.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

  it('carries the strctField marker so strct-field links label and aria', () => {
    const fixture = TestBed.createComponent(StrctSelect);
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('.strct-sel__btn')!;
    expect(btn.hasAttribute('strctfield')).toBe(true);
    expect(btn.classList).toContain('strct-control');
  });

  it('shows the empty text when there are no options', async () => {
    const { fixture, host, btn, el } = await setup();
    host.options.set([]);
    fixture.detectChanges();
    btn.click();
    fixture.detectChanges();
    expect(el.querySelector('.strct-sel__empty')?.textContent).toContain('No options');
  });

  it('compareWith matches object values that are not reference-equal', () => {
    const fixture = TestBed.createComponent(StrctSelect);
    fixture.componentRef.setInput('options', [
      { value: { id: 1 }, label: 'One' },
      { value: { id: 2 }, label: 'Two' },
    ]);
    fixture.componentRef.setInput(
      'compareWith',
      (a: unknown, b: unknown) =>
        (a as { id: number } | null)?.id === (b as { id: number } | null)?.id,
    );
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    cmp.writeValue({ id: 2 }); // a fresh object, never one of the option values
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-sel__value')!.textContent).toContain('Two');
    cmp.openList();
    fixture.detectChanges();
    const two = [...el.querySelectorAll<HTMLElement>('.strct-sel__opt')][1];
    expect(two.getAttribute('aria-selected')).toBe('true');
    expect(two.querySelector('.strct-sel__check svg')).toBeTruthy();
    expect(el.querySelector('.strct-sel__opt--highlight')?.textContent).toContain('Two');
  });
});
