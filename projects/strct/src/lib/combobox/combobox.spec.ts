import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { StrctCombobox, StrctOption } from './combobox';

const OPTIONS: StrctOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'g', label: 'Gamma' },
];

describe('StrctCombobox', () => {
  function make() {
    const fixture = TestBed.createComponent(StrctCombobox);
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.detectChanges();
    return fixture;
  }

  it('filters options by the typed query', () => {
    const fixture = make();
    const cmp = fixture.componentInstance;
    cmp.openList();
    cmp.onType({ target: { value: 'be' } } as unknown as Event);
    fixture.detectChanges();

    const labels = [...fixture.nativeElement.querySelectorAll('.strct-cbx__opt')].map((o) =>
      (o as HTMLElement).textContent!.trim(),
    );
    expect(labels).toEqual(['Beta']);
  });

  it('selects with the keyboard (ArrowDown then Enter)', () => {
    const fixture = make();
    const cmp = fixture.componentInstance;
    let emitted: unknown;
    cmp.registerOnChange((v) => (emitted = v));

    cmp.openList(); // activeIndex -> 0
    cmp.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' })); // -> 1 (Beta)
    cmp.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(emitted).toBe('b');
    expect(cmp.open()).toBe(false);
    expect(cmp.query()).toBe('Beta');
  });
});

describe('StrctCombobox extensions (v1.21)', () => {
  const RICH: StrctOption[] = [
    { value: 'a', label: 'Alpha', group: 'Greek' },
    { value: 'b', label: 'Beta', group: 'Greek' },
    { value: 'g', label: 'Gamma', group: 'Greek', disabled: true },
    { value: 'x', label: 'Xray', group: 'NATO' },
    { value: 'z', label: 'Zulu', group: 'NATO' },
  ];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctCombobox);
    fixture.componentRef.setInput('options', RICH);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, cmp, el };
  }

  it('renders group headers interleaved with their options', () => {
    const { fixture, cmp, el } = make();
    cmp.openList();
    fixture.detectChanges();
    const rows = [...el.querySelectorAll('.strct-cbx__group, .strct-cbx__opt')].map((r) =>
      r.classList.contains('strct-cbx__group')
        ? `#${r.textContent!.trim()}`
        : r.textContent!.trim(),
    );
    expect(rows).toEqual(['#Greek', 'Alpha', 'Beta', 'Gamma', '#NATO', 'Xray', 'Zulu']);
  });

  it('marks the selected option with an aligned ✓ lead slot', () => {
    const { fixture, cmp, el } = make();
    cmp.writeValue('b');
    cmp.openList();
    fixture.detectChanges();
    const beta = [...el.querySelectorAll<HTMLElement>('.strct-cbx__opt')][1];
    expect(beta.getAttribute('aria-selected')).toBe('true');
    expect(beta.querySelector('.strct-cbx__check svg')).toBeTruthy();
    const alpha = el.querySelector<HTMLElement>('.strct-cbx__opt')!;
    expect(alpha.querySelector('.strct-cbx__check svg')).toBeNull();
    expect(alpha.querySelector('.strct-cbx__check')).toBeTruthy(); // aligned empty slot
  });

  it('opening highlights the selected option', () => {
    const { fixture, cmp, el } = make();
    cmp.writeValue('x');
    cmp.openList();
    fixture.detectChanges();
    expect(el.querySelector('.strct-cbx__opt--highlight')?.textContent).toContain('Xray');
  });

  it('emphasises the typed match inside labels', () => {
    const { fixture, cmp, el } = make();
    cmp.openList();
    cmp.onType({ target: { value: 'am' } } as unknown as Event);
    fixture.detectChanges();
    const opt = el.querySelector<HTMLElement>('.strct-cbx__opt')!; // Gamma
    expect(opt.querySelector('.strct-cbx__match')?.textContent).toBe('am');
  });

  it('arrows skip disabled options; Enter on a disabled option is inert; Home/End jump', () => {
    const { fixture, cmp } = make();
    let emitted: unknown = 'none';
    cmp.registerOnChange((v) => (emitted = v));
    cmp.openList(); // Alpha
    cmp.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' })); // Beta
    cmp.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' })); // skips Gamma -> Xray
    expect(cmp.activeIndex()).toBe(3);
    cmp.onKeydown(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(cmp.activeIndex()).toBe(0);
    cmp.onKeydown(new KeyboardEvent('keydown', { key: 'End' }));
    expect(cmp.activeIndex()).toBe(4);
    cmp.activeIndex.set(2); // Gamma (disabled) — Enter must not commit
    cmp.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted).toBe('none');
    expect(cmp.open()).toBe(true);
    fixture.detectChanges();
  });

  it('clearable: the × resets the value and emits null', () => {
    const { fixture, cmp, el } = make({ clearable: true });
    let emitted: unknown = 'none';
    cmp.registerOnChange((v) => (emitted = v));
    cmp.writeValue('a');
    fixture.detectChanges();
    const x = el.querySelector<HTMLElement>('.strct-cbx__clear')!;
    expect(x).toBeTruthy();
    x.click();
    fixture.detectChanges();
    expect(emitted).toBeNull();
    expect(cmp.query()).toBe('');
    expect(el.querySelector('.strct-cbx__clear')).toBeNull(); // hidden without a value
  });

  it('multiple: picking toggles membership, keeps the list open and renders chips', () => {
    const { fixture, cmp, el } = make({ multiple: true });
    let emitted: unknown;
    cmp.registerOnChange((v) => (emitted = v));
    cmp.openList();
    cmp.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' })); // Alpha
    expect(emitted).toEqual(['a']);
    expect(cmp.open()).toBe(true); // stays open
    cmp.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    cmp.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' })); // Beta
    expect(emitted).toEqual(['a', 'b']);
    fixture.detectChanges();
    const chips = [...el.querySelectorAll<HTMLElement>('.strct-cbx__chip')];
    expect(chips.map((c) => c.textContent!.trim())).toEqual(['Alpha', 'Beta']);
    cmp.activeIndex.set(0);
    cmp.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' })); // Alpha again → off
    expect(emitted).toEqual(['b']);
  });

  it('multiple: Backspace on an empty query removes the last chip; chip × removes too', () => {
    const { fixture, cmp, el } = make({ multiple: true });
    let emitted: unknown;
    cmp.registerOnChange((v) => (emitted = v));
    cmp.writeValue(['a', 'x']);
    fixture.detectChanges();
    cmp.onKeydown(new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(emitted).toEqual(['a']);
    fixture.detectChanges();
    el.querySelector<HTMLElement>('.strct-cbx__chip-x')!.click();
    fixture.detectChanges();
    expect(emitted).toEqual([]);
    expect(el.querySelectorAll('.strct-cbx__chip').length).toBe(0);
  });

  it('multiple: aria-multiselectable is set and the field wears the control skin', () => {
    const { fixture, cmp, el } = make({ multiple: true });
    cmp.openList();
    fixture.detectChanges();
    expect(el.querySelector('[role="listbox"]')!.getAttribute('aria-multiselectable')).toBe('true');
    expect(el.querySelector('.strct-cbx__field')!.classList).toContain('strct-control');
  });

  it('works end-to-end with ngModel in multiple mode', async () => {
    @Component({
      imports: [StrctCombobox, FormsModule],
      template: `<strct-combobox
        [options]="options"
        multiple
        [ngModel]="picks()"
        (ngModelChange)="picks.set($event)"
      />`,
    })
    class MultiHost {
      options = RICH;
      picks = signal<unknown[]>(['z']);
    }
    const fixture = TestBed.createComponent(MultiHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect([...el.querySelectorAll('.strct-cbx__chip')].map((c) => c.textContent!.trim())).toEqual([
      'Zulu',
    ]);
    el.querySelector<HTMLInputElement>('.strct-cbx__input')!.focus();
    fixture.detectChanges();
    [...el.querySelectorAll<HTMLElement>('.strct-cbx__opt')][0].dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.picks()).toEqual(['z', 'a']);
  });

  it('shows the localizable empty text when the filter matches nothing', () => {
    const { fixture, cmp, el } = make({ emptyText: 'Sonuç yok' });
    cmp.openList();
    cmp.onType({ target: { value: 'qqq' } } as unknown as Event);
    fixture.detectChanges();
    expect(el.querySelector('.strct-cbx__empty')?.textContent).toContain('Sonuç yok');
  });
});
