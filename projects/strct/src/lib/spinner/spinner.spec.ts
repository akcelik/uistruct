import { TestBed } from '@angular/core/testing';
import { StrctSpinner } from './spinner';

describe('StrctSpinner', () => {
  it('applies the strct-spinner host class', () => {
    const fixture = TestBed.createComponent(StrctSpinner);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-spinner');
  });

  it('applies the sm modifier class when size is sm', () => {
    const fixture = TestBed.createComponent(StrctSpinner);
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-spinner--sm');
  });

  it('applies the lg modifier class when size is lg', () => {
    const fixture = TestBed.createComponent(StrctSpinner);
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-spinner--lg');
  });
});

describe('StrctSpinner — visible caption (FR-48-20)', () => {
  it('a bare spinner is unchanged: the host is the ring, nothing inside', () => {
    const fixture = TestBed.createComponent(StrctSpinner);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).not.toContain('strct-spinner--captioned');
    expect(host.querySelector('.strct-spinner__ring')).toBeNull();
    expect(host.getAttribute('aria-label')).toBe('Loading');
  });

  it('a caption is shown and becomes the accessible name', () => {
    const fixture = TestBed.createComponent(StrctSpinner);
    fixture.componentRef.setInput('caption', 'Reading…');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-spinner--captioned');
    expect(host.querySelector('.strct-spinner__ring')).toBeTruthy();
    expect(host.querySelector('.strct-spinner__caption')!.textContent!.trim()).toBe('Reading…');
    // Not announced as "Loading" while it says something else on screen.
    expect(host.getAttribute('aria-label')).toBe('Reading…');
  });
});
