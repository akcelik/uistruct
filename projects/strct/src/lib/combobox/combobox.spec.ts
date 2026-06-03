import { TestBed } from '@angular/core/testing';
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
