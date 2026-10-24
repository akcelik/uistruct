import { Component, ViewChild, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctChips } from './chips';
import { StrctField } from '../forms/field';
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

  // The field was a role="button" tab stop wrapping the input and the chips'
  // remove buttons (axe nested-interactive, serious) — one Tab that did nothing.
  it('has one tab stop, the text field, and no button role around it', () => {
    const fixture = TestBed.createComponent(StrctChips);
    fixture.componentRef.setInput('placeholder', 'Add a label…');
    fixture.componentInstance.writeValue(['prod']);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const field = el.querySelector('.strct-chips') as HTMLElement;
    expect(field.hasAttribute('role')).toBe(false);
    expect(field.hasAttribute('tabindex')).toBe(false);

    // A click on the padding still lands in the input.
    const input = el.querySelector('.strct-chips__input') as HTMLInputElement;
    document.body.appendChild(el);
    field.click();
    expect(document.activeElement).toBe(input);
    // And the input has a name of its own outside a strct-field.
    expect(input.getAttribute('aria-label')).toBe('Add a label…');
    fixture.componentRef.setInput('ariaLabel', 'VM labels');
    fixture.detectChanges();
    expect(input.getAttribute('aria-label')).toBe('VM labels');
    el.remove();
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

describe('StrctChips inside a strct-field', () => {
  @Component({
    imports: [StrctChips, StrctField],
    template: `
      <strct-field label="VM labels">
        @if (show()) {
          <strct-chips placeholder="Add a label…" />
        }
      </strct-field>
    `,
  })
  class DeferredHost {
    readonly show = signal(false);
  }

  @Component({
    imports: [StrctChips, StrctField],
    template: `
      <strct-field label="VM labels"><strct-chips placeholder="Add a label…" /></strct-field>
    `,
  })
  class DirectHost {}

  /**
   * The field's `<label for>` is the input's name. An `aria-label` here would
   * override that visible label with the placeholder's wording — WCAG 2.5.3.
   * The component decides by looking for a `strct-field` ancestor, so this
   * checks both the plain case and a view inserted after the first render,
   * where the element may not be in its parent yet when the class is built.
   */
  it('lets the field label name the input, projected directly', async () => {
    const fixture = TestBed.createComponent(DirectHost);
    fixture.detectChanges();
    await fixture.whenStable(); // the field links its control after render
    const input = fixture.nativeElement.querySelector('.strct-chips__input') as HTMLInputElement;
    const label = fixture.nativeElement.querySelector('.strct-field__label') as HTMLLabelElement;
    expect(input).toBeTruthy();
    expect(input.getAttribute('aria-label')).toBeNull();
    // The visible label really is the name, not a dangling `for`.
    expect(label.getAttribute('for')).toBe(input.id);
  });

  it('lets the field label name the input, in a view inserted later', () => {
    const fixture = TestBed.createComponent(DeferredHost);
    fixture.detectChanges();
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.strct-chips__input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.getAttribute('aria-label')).toBeNull();
  });
});
