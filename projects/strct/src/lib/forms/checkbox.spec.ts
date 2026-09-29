import { TestBed } from '@angular/core/testing';
import { StrctCheckbox } from './checkbox';

describe('StrctCheckbox', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctCheckbox);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-cb class in its template', () => {
    const fixture = TestBed.createComponent(StrctCheckbox);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-cb')).toBeTruthy();
  });

  it('implements CVA and invokes registerOnChange callback on toggle', () => {
    const fixture = TestBed.createComponent(StrctCheckbox);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted = false;
    cmp.registerOnChange((v: boolean) => (emitted = v));
    cmp.onToggle({ target: { checked: true } } as unknown as Event);
    expect(emitted).toBe(true);
  });

  it('renders an indeterminate marker on the box', () => {
    const fixture = TestBed.createComponent(StrctCheckbox);
    fixture.componentRef.setInput('indeterminate', true);
    fixture.detectChanges();

    const native = fixture.nativeElement.querySelector('.strct-cb__native') as HTMLInputElement;
    expect(native.indeterminate).toBe(true);

    // jsdom cannot compute ::after styles; assert the selector hooks instead.
    expect(native.matches(':indeterminate')).toBe(true);
    const css = Array.from(document.head.querySelectorAll('style'))
      .map((s) => s.textContent)
      .join('');
    expect(css).toMatch(/\.strct-cb__native[^\n]*:indeterminate[^\n]*\.strct-cb__box[^\n]*::after/);
  });

  it('merges the static disabled input with the CVA disabled state', () => {
    const fixture = TestBed.createComponent(StrctCheckbox);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    const native = fixture.nativeElement.querySelector('.strct-cb__native') as HTMLInputElement;

    expect(cmp.isDisabled()).toBe(true);
    expect(native.disabled).toBe(true);

    // Static disable stays even if the form re-enables.
    cmp.setDisabledState(false);
    expect(cmp.isDisabled()).toBe(true);

    // A static input change must not clobber the forms-driven disabled state.
    cmp.setDisabledState(true);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(cmp.isDisabled()).toBe(true);
    expect(native.disabled).toBe(true);
  });

  // FR-48-04 — the sentence belongs to the option, inside its own label.
  it('renders a description inside the label and links it with aria-describedby', () => {
    const fixture = TestBed.createComponent(StrctCheckbox);
    fixture.componentRef.setInput('description', 'The cluster networks and the firewall.');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const desc = el.querySelector('.strct-cb__desc') as HTMLElement;
    expect(desc.textContent).toContain('The cluster networks');
    // inside the component's own <label>, so clicking the sentence toggles it
    expect(desc.closest('label')).toBe(el.querySelector('label'));
    expect(el.querySelectorAll('label').length).toBe(1);
    expect(el.querySelector('input')?.getAttribute('aria-describedby')).toBe(desc.id);
    expect(el.querySelector('.strct-cb')?.classList).toContain('strct-cb--described');
    // The sentence shares the <label>, so the name is pinned to the label text
    // rather than swallowing the description as well.
    const labelSpan = el.querySelector('.strct-cb__label') as HTMLElement;
    expect(el.querySelector('input')?.getAttribute('aria-labelledby')).toBe(labelSpan.id);
  });

  it('has no description element by default', () => {
    const fixture = TestBed.createComponent(StrctCheckbox);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-cb__desc')).toBeNull();
    expect(el.querySelector('input')?.getAttribute('aria-describedby')).toBeNull();
    expect(el.querySelector('input')?.getAttribute('aria-labelledby')).toBeNull();
  });
});
