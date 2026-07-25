import { TestBed } from '@angular/core/testing';
import { StrctRating } from './rating';

describe('StrctRating', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctRating);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-rating class in its template', () => {
    const fixture = TestBed.createComponent(StrctRating);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-rating')).toBeTruthy();
  });

  it('implements CVA and invokes registerOnChange callback on pick', () => {
    const fixture = TestBed.createComponent(StrctRating);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted = 0;
    cmp.registerOnChange((v: number) => (emitted = v));
    cmp.pick(3);
    expect(emitted).toBe(3);
  });

  it('exposes a radiogroup with an accessible name', () => {
    const fixture = TestBed.createComponent(StrctRating);
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('.strct-rating') as HTMLElement;
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Rating');

    fixture.componentRef.setInput('ariaLabel', 'Product score');
    fixture.detectChanges();
    expect(group.getAttribute('aria-label')).toBe('Product score');
  });

  it('renders stars as radios with aria-checked following the value', () => {
    const fixture = TestBed.createComponent(StrctRating);
    fixture.detectChanges();
    fixture.componentInstance.writeValue(3);
    fixture.detectChanges();

    const stars = fixture.nativeElement.querySelectorAll('.strct-rating__star');
    expect(stars.length).toBe(5);
    expect(stars[2].getAttribute('role')).toBe('radio');
    expect(stars[2].getAttribute('aria-checked')).toBe('true');
    expect(stars[0].getAttribute('aria-checked')).toBe('false');
  });

  it('keeps readonly stars focusable and marks the group readonly', () => {
    const fixture = TestBed.createComponent(StrctRating);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();

    const group = fixture.nativeElement.querySelector('.strct-rating') as HTMLElement;
    expect(group.getAttribute('aria-readonly')).toBe('true');

    const stars = fixture.nativeElement.querySelectorAll('button.strct-rating__star');
    stars.forEach((star: HTMLButtonElement) => expect(star.disabled).toBe(false));

    // selection is still blocked in readonly mode
    fixture.componentInstance.pick(4);
    expect(fixture.componentInstance.value()).toBe(0);
  });

  it('moves focus between stars with arrow keys, wrapping at the ends', () => {
    const fixture = TestBed.createComponent(StrctRating);
    fixture.detectChanges();
    const stars = fixture.nativeElement.querySelectorAll(
      '.strct-rating__star',
    ) as NodeListOf<HTMLButtonElement>;

    stars[1].focus();
    stars[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(stars[2]);

    stars[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(stars[1]);

    stars[4].focus();
    stars[4].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(stars[0]);

    stars[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(stars[4]);
  });

  it('localizes the star aria-labels via starAriaLabel', () => {
    const fixture = TestBed.createComponent(StrctRating);
    fixture.detectChanges();
    let stars = fixture.nativeElement.querySelectorAll('.strct-rating__star');
    expect(stars[0].getAttribute('aria-label')).toBe('1 of 5');

    fixture.componentRef.setInput(
      'starAriaLabel',
      (star: number, max: number) => `${star} von ${max}`,
    );
    fixture.detectChanges();
    stars = fixture.nativeElement.querySelectorAll('.strct-rating__star');
    expect(stars[0].getAttribute('aria-label')).toBe('1 von 5');
  });
});
