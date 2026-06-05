import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctInput } from './input';

@Component({
  standalone: true,
  imports: [StrctInput],
  template: `<input strctInput data-testid="input" />`,
})
class InputHost {}

describe('StrctInput', () => {
  it('adds the strct-control class to the host input element', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('[data-testid="input"]') as HTMLInputElement;
    expect(input?.classList).toContain('strct-control');
  });
});
