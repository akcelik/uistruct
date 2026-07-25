import { TestBed } from '@angular/core/testing';
import { StrctTreeSelect } from './tree-select';
import { StrctTreeNodeData } from '../tree/tree';

const NODES = (): StrctTreeNodeData[] => [
  {
    id: 'root',
    label: 'Root',
    children: [
      { id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] },
      { id: 'b', label: 'B' },
    ],
  },
];

function setup(patch: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(StrctTreeSelect);
  for (const [k, v] of Object.entries(patch)) fixture.componentRef.setInput(k, v);
  fixture.componentRef.setInput('nodes', NODES());
  fixture.detectChanges();
  const cmp = fixture.componentInstance;
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, cmp, el };
}

function openPanel(fixture: ReturnType<typeof TestBed.createComponent<StrctTreeSelect>>) {
  const el = fixture.nativeElement as HTMLElement;
  el.querySelector<HTMLButtonElement>('.strct-tsel__trigger')!.click();
  fixture.detectChanges();
  return el;
}

/** Click the row of the node with the given data-node-id. */
function clickNode(el: HTMLElement, id: string) {
  el.querySelector(`[data-node-id="${id}"]`)!
    .querySelector<HTMLElement>('.strct-tnode__row')!
    .click();
}

describe('StrctTreeSelect', () => {
  it('applies the strct-tsel host class', () => {
    const { el } = setup();
    expect(el.classList).toContain('strct-tsel');
  });

  it('opens the panel from the trigger and renders the tree nodes', () => {
    const { fixture, cmp, el } = setup();
    expect(el.querySelector('.strct-tsel__panel')).toBeNull();
    openPanel(fixture);
    expect(cmp.open()).toBe(true);
    const rows = el.querySelectorAll('.strct-tsel__panel .strct-tnode__row');
    expect(rows.length).toBe(1); // only the root — children are collapsed
    expect(rows[0].textContent).toContain('Root');
  });

  it("expands the selected node's ancestors on open so the pick is visible", () => {
    const { fixture, cmp, el } = setup();
    cmp.writeValue('b');
    openPanel(fixture);
    expect(cmp.expandedIds()).toEqual(['root']);
    const rows = el.querySelectorAll('.strct-tsel__panel .strct-tnode__row');
    expect(rows.length).toBe(3); // root + A + B
    expect(el.querySelector('.strct-tnode__row--active')!.textContent).toContain('B');
  });

  it('picking a node emits its id and shows the label path in the trigger', () => {
    const { fixture, cmp, el } = setup();
    let emitted: string | null = null;
    cmp.registerOnChange((v) => (emitted = v));
    cmp.writeValue('a1');
    openPanel(fixture);
    // "a1" is nested under Root/A — both get expanded on open.
    clickNode(el, 'a1');
    fixture.detectChanges();

    expect(emitted!).toBe('a1');
    expect(cmp.value()).toBe('a1');
    expect(cmp.open()).toBe(false);
    expect(el.querySelector('.strct-tsel__value')!.textContent!.trim()).toBe('Root / A / A1');
  });

  it('clear resets the value and restores the placeholder', () => {
    const { fixture, cmp, el } = setup({ clearable: true });
    let emitted: string | null | undefined;
    cmp.registerOnChange((v) => (emitted = v));
    cmp.writeValue('b');
    fixture.detectChanges();

    const clearBtn = el.querySelector<HTMLButtonElement>('.strct-tsel__clear')!;
    expect(clearBtn.getAttribute('aria-label')).toBe('Clear selection');
    clearBtn.click();
    fixture.detectChanges();

    expect(emitted).toBeNull();
    expect(cmp.value()).toBeNull();
    expect(el.querySelector('.strct-tsel__clear')).toBeNull();
    expect(el.querySelector('.strct-tsel__value')!.textContent!.trim()).toBe('Select…');
  });

  it('uses localizable placeholder / empty / clear labels', () => {
    const { fixture, el } = setup({
      placeholder: 'Wählen…',
      clearable: true,
      clearLabel: 'Auswahl löschen',
      emptyText: 'Keine Einträge',
    });
    const cmp = fixture.componentInstance;
    expect(el.querySelector('.strct-tsel__value')!.textContent!.trim()).toBe('Wählen…');
    cmp.writeValue('b');
    fixture.detectChanges();
    expect(el.querySelector('.strct-tsel__clear')!.getAttribute('aria-label')).toBe(
      'Auswahl löschen',
    );
    fixture.componentRef.setInput('nodes', []);
    cmp.toggle();
    fixture.detectChanges();
    expect(el.querySelector('.strct-tsel__empty')!.textContent!.trim()).toBe('Keine Einträge');
  });

  it('merges the static disabled input with the CVA disabled state', () => {
    const { fixture, cmp, el } = setup({ disabled: true });
    expect(cmp.isDisabled()).toBe(true);
    expect(el.querySelector<HTMLButtonElement>('.strct-tsel__trigger')!.disabled).toBe(true);
    cmp.toggle();
    expect(cmp.open()).toBe(false);

    // A static input change must not clobber the forms-driven disabled state.
    cmp.setDisabledState(true);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(cmp.isDisabled()).toBe(true);
    expect(el.querySelector<HTMLButtonElement>('.strct-tsel__trigger')!.disabled).toBe(true);
  });

  it('accepts a boolean attribute for disabled and clearable', () => {
    const { cmp } = setup({ disabled: '', clearable: '' });
    expect(cmp.isDisabled()).toBe(true);
    expect(cmp.clearable()).toBe(true);
  });

  it('implements CVA: writeValue sets the label, pick reports through onChange', () => {
    const { fixture, cmp, el } = setup();
    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    cmp.writeValue('a1');
    fixture.detectChanges();
    expect(cmp.value()).toBe('a1');
    expect(el.querySelector('.strct-tsel__value')!.textContent!.trim()).toBe('Root / A / A1');

    let emitted: string | null = null;
    let touched = false;
    cmp.registerOnChange((v) => (emitted = v));
    cmp.registerOnTouched(() => (touched = true));
    cmp.pick(NODES()[0]);
    expect(emitted!).toBe('root');
    expect(touched).toBe(true);
  });

  it('closes on Escape without propagating it to a host surface', () => {
    const { fixture, cmp, el } = setup();
    openPanel(fixture);
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    el.querySelector('.strct-tsel__panel')!.dispatchEvent(event);
    fixture.detectChanges();
    expect(cmp.open()).toBe(false);
  });
});
