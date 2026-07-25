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
});
