import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctControlSizeDirective, strctControlHeight } from './control-size';
import { StrctSelect } from './select/select';

/**
 * FR-63-02. The heights themselves are a browser matter
 * (`scripts/control-height.mjs` measures all 144 of them); what is testable
 * here is which declaration of `--control-h` ends up on which element.
 */
describe('strctControlSize', () => {
  it('names the token for each size', () => {
    expect(strctControlHeight('sm')).toBe('var(--control-h-sm)');
    expect(strctControlHeight('md')).toBe('var(--control-h-md)');
    expect(strctControlHeight('lg')).toBe('var(--control-h-lg)');
  });

  it('sets the height for everything inside it', () => {
    @Component({
      imports: [StrctControlSizeDirective],
      template: `<div strctControlSize="sm"><span>inside</span></div>`,
    })
    class Host {}

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector('div') as HTMLElement;
    expect(box.style.getPropertyValue('--control-h')).toBe('var(--control-h-sm)');
  });

  it('a control states nothing until it is given a size, so the container wins', () => {
    const fixture = TestBed.createComponent(StrctSelect);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    // Nothing of its own: it inherits whatever encloses it.
    expect(host.style.getPropertyValue('--control-h')).toBe('');

    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(host.style.getPropertyValue('--control-h')).toBe('var(--control-h-lg)');
  });
});
