import { TestBed } from '@angular/core/testing';
import { StrctSearchbox } from './searchbox';

describe('StrctSearchbox', () => {
  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctSearchbox);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, cmp: fixture.componentInstance };
  }

  it('renders a searchbox input with icon, placeholder and hint chip', () => {
    const { el } = make({ placeholder: 'Search hosts', hint: '⌘K' });
    const input = el.querySelector<HTMLInputElement>('.strct-sb__input')!;
    expect(input.getAttribute('role')).toBe('searchbox');
    expect(input.placeholder).toBe('Search hosts');
    expect(el.querySelector('.strct-sb__kbd')?.textContent).toBe('⌘K');
    expect(el.querySelector('.strct-sb__icon')).toBeTruthy();
  });

  it('two-way value, Enter emits (search), Escape and × clear', () => {
    const { fixture, el, cmp } = make();
    const input = el.querySelector<HTMLInputElement>('.strct-sb__input')!;
    input.value = 'hv-01';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(cmp.value()).toBe('hv-01');

    const searched: string[] = [];
    cmp.search.subscribe((q) => searched.push(q));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(searched).toEqual(['hv-01']);

    // the clear button replaces the hint while there is a value
    const clearBtn = el.querySelector<HTMLButtonElement>('.strct-sb__clear')!;
    expect(clearBtn).toBeTruthy();
    clearBtn.click();
    fixture.detectChanges();
    expect(cmp.value()).toBe('');
    expect(el.querySelector('.strct-sb__clear')).toBeNull();
  });

  it('trigger mode renders a labeled button and emits activated on click', () => {
    const { el, cmp } = make({ trigger: true, placeholder: 'Search', hint: '⌘K' });
    const btn = el.querySelector<HTMLButtonElement>('button.strct-sb--trigger')!;
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('Search');
    expect(el.querySelector('.strct-sb__input')).toBeNull();
    let fired = 0;
    cmp.activated.subscribe(() => fired++);
    btn.click();
    expect(fired).toBe(1);
  });

  it('implements CVA: writeValue / disabled state', () => {
    const { fixture, el, cmp } = make();
    cmp.writeValue('vm-42');
    fixture.detectChanges();
    expect(el.querySelector<HTMLInputElement>('.strct-sb__input')!.value).toBe('vm-42');
    cmp.setDisabledState(true);
    fixture.detectChanges();
    expect(el.querySelector<HTMLInputElement>('.strct-sb__input')!.disabled).toBe(true);
  });
});

// BUG-58-05: what is above the searchbox has to be able to tell that the
// Escape was used — a modal closed on the same keystroke that cleared this.
describe('StrctSearchbox — Escape', () => {
  const escape = (input: HTMLInputElement) => {
    const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    input.dispatchEvent(e);
    return e;
  };

  it('marks the Escape that clears a value, and leaves an empty one alone', () => {
    const fixture = TestBed.createComponent(StrctSearchbox);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('.strct-sb__input')!;

    // Nothing to clear: the keystroke is not ours.
    expect(escape(input).defaultPrevented).toBe(false);

    input.value = 'hv-01';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const used = escape(input);
    fixture.detectChanges();
    expect(used.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.value()).toBe('');
  });
});
