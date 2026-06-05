import { Component, ElementRef, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctOverlay } from './overlay';

@Component({
  imports: [StrctOverlay],
  template: `
    <button #anchor>Anchor</button>
    <div [strctOverlay]="anchor">Panel</div>
  `,
})
class HostComponent {
  @ViewChild('anchor', { static: true }) anchor!: ElementRef<HTMLElement>;
}

describe('StrctOverlay', () => {
  it('exists on the host element', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const div = fixture.nativeElement.querySelector('div');
    expect(div?.style?.position).toBe('fixed');
  });
});
