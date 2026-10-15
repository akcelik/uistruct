import { TestBed } from '@angular/core/testing';
import { StrctBadge } from './badge';

describe('StrctBadge', () => {
  it('applies the status and solid modifier classes on the host', () => {
    const fixture = TestBed.createComponent(StrctBadge);
    fixture.componentRef.setInput('status', 'success');
    fixture.componentRef.setInput('solid', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-badge');
    expect(host.classList).toContain('strct-badge--success');
    expect(host.classList).toContain('strct-badge--solid');
  });

  it('coerces a bare solid attribute via booleanAttribute', () => {
    const fixture = TestBed.createComponent(StrctBadge);
    fixture.componentRef.setInput('solid', '');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-badge--solid');
  });

  // FR-52-04 — a product's own colour, where the five statuses already mean
  // something else on the same row.
  it('takes a tone of its own, as a class and as the property the styles read', () => {
    const fixture = TestBed.createComponent(StrctBadge);
    fixture.componentRef.setInput('tone', 'var(--prod-acc)');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList).toContain('strct-badge--tone');
    expect(el.style.getPropertyValue('--strct-badge-fg')).toBe('var(--prod-acc)');

    // Without one, nothing is set and the status styles are untouched.
    fixture.componentRef.setInput('tone', '');
    fixture.detectChanges();
    expect(el.classList).not.toContain('strct-badge--tone');
    expect(el.style.getPropertyValue('--strct-badge-fg')).toBe('');
  });

  it('emits the corrected --warning class plus the deprecated --warninging alias', () => {
    const fixture = TestBed.createComponent(StrctBadge);
    fixture.componentRef.setInput('status', 'warning');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList).toContain('strct-badge--warning');
    expect(el.classList).toContain('strct-badge--warninging');
  });
});
