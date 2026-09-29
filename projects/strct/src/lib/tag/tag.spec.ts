import { TestBed } from '@angular/core/testing';
import { StrctTag } from './tag';

describe('StrctTag', () => {
  it('renders a remove button when removable and emits on click', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('removable', true);
    fixture.detectChanges();

    let removed = false;
    fixture.componentInstance.removed.subscribe(() => (removed = true));

    const btn = fixture.nativeElement.querySelector('.strct-tag__remove') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(removed).toBe(true);
  });

  it('omits the remove button by default', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-tag__remove')).toBeNull();
  });

  it('hides the remove button when disabled', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('removable', true);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-tag__remove')).toBeNull();
  });

  it('uses removeLabel as the remove button aria-label', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('removable', true);
    fixture.componentRef.setInput('removeLabel', 'Entfernen');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.strct-tag__remove') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Entfernen');
  });

  // FR-48-03 — the body is the control for the thing the tag names.
  it('activates on click, Enter and Space when interactive', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    let n = 0;
    fixture.componentInstance.activated.subscribe(() => n++);
    const body = fixture.nativeElement.querySelector('.strct-tag__text') as HTMLElement;
    expect(body.getAttribute('role')).toBe('button');
    expect(body.getAttribute('tabindex')).toBe('0');
    body.click();
    body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(n).toBe(3);
  });

  it('keeps the body inert by default and never activates when disabled', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('.strct-tag__text') as HTMLElement;
    expect(body.getAttribute('role')).toBeNull();
    expect(body.getAttribute('tabindex')).toBeNull();
    let n = 0;
    fixture.componentInstance.activated.subscribe(() => n++);
    body.click();
    fixture.componentRef.setInput('interactive', true);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    body.click();
    expect(n).toBe(0);
  });

  it('removing does not activate, and activating does not remove', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('interactive', true);
    fixture.componentRef.setInput('removable', true);
    fixture.detectChanges();
    let activated = 0;
    let removed = 0;
    fixture.componentInstance.activated.subscribe(() => activated++);
    fixture.componentInstance.removed.subscribe(() => removed++);
    (fixture.nativeElement.querySelector('.strct-tag__remove') as HTMLElement).click();
    expect([activated, removed]).toEqual([0, 1]);
    (fixture.nativeElement.querySelector('.strct-tag__text') as HTMLElement).click();
    expect([activated, removed]).toEqual([1, 1]);
  });

  it('marks the pill shape and mono on the host', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('shape', 'pill');
    fixture.componentRef.setInput('mono', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList).toContain('strct-tag--pill');
    expect(el.classList).toContain('strct-tag--mono');
  });
});
