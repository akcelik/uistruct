import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctButton } from './button';

@Component({
  imports: [StrctButton],
  template: `<button strct-button variant="primary" size="sm">Go</button>`,
})
class HostComponent {}

describe('StrctButton', () => {
  it('applies the base, variant and size host classes', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(btn.classList).toContain('strct-btn');
    expect(btn.classList).toContain('strct-btn--primary');
    expect(btn.classList).toContain('strct-btn--sm');
  });
});
