import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctTooltip } from './tooltip';

@Component({
  imports: [StrctTooltip],
  template: `<button strctTooltip="Hello">Btn</button>`,
})
class HostComponent {}

describe('StrctTooltip', () => {
  it('exists on the host element', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(btn.hasAttribute('strcttooltip')).toBe(true);
  });
});
