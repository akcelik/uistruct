import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctButton } from './button';

@Component({
  imports: [StrctButton],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<button strct-button variant="primary" size="sm">Go</button>`,
})
class HostComponent {}

@Component({
  imports: [StrctButton],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<p>See <button strct-button variant="link">Show all</button> for the rest.</p>`,
})
class LinkHost {}

describe('StrctButton', () => {
  it('applies the base, variant and size host classes', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(btn.classList).toContain('strct-btn');
    expect(btn.classList).toContain('strct-btn--primary');
    expect(btn.classList).toContain('strct-btn--sm');
  });

  it('marks the link variant on the host (FR-48-09)', () => {
    const fixture = TestBed.createComponent(LinkHost);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('.strct-btn--link') as HTMLElement;
    expect(link).toBeTruthy();
    expect(link.tagName).toBe('BUTTON');
    expect(link.classList).not.toContain('strct-btn--flat');
  });
});
