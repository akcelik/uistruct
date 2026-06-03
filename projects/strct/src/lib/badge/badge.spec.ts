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
});
