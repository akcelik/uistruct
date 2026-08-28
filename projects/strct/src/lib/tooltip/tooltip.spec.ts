import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctTooltip } from './tooltip';

@Component({
  imports: [StrctTooltip],
  changeDetection: ChangeDetectionStrategy.Eager,
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

  it('shows a role="tooltip" bubble on hover and links it via aria-describedby', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;

    btn.dispatchEvent(new Event('mouseenter'));

    const bubble = document.body.querySelector('[role="tooltip"]') as HTMLElement;
    expect(bubble).toBeTruthy();
    expect(bubble.id).toBeTruthy();
    expect(bubble.textContent).toBe('Hello');
    expect(btn.getAttribute('aria-describedby')).toBe(bubble.id);
  });

  it('hides on mouseleave and removes aria-describedby', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;

    btn.dispatchEvent(new Event('mouseenter'));
    btn.dispatchEvent(new Event('mouseleave'));

    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    expect(btn.hasAttribute('aria-describedby')).toBe(false);
  });

  it('Escape dismisses the bubble and consumes the event', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;

    btn.dispatchEvent(new Event('focus'));
    expect(document.body.querySelector('[role="tooltip"]')).toBeTruthy();

    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    // Registered after the directive's listener: stopImmediatePropagation must
    // keep it from firing (a host modal/drawer must not also see this Escape).
    const spy = vi.fn();
    document.addEventListener('keydown', spy);
    document.dispatchEvent(event);
    document.removeEventListener('keydown', spy);

    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('hides on document scroll', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;

    btn.dispatchEvent(new Event('mouseenter'));
    expect(document.body.querySelector('[role="tooltip"]')).toBeTruthy();

    document.dispatchEvent(new Event('scroll'));

    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('removes the bubble when the host is destroyed', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;

    btn.dispatchEvent(new Event('mouseenter'));
    expect(document.body.querySelector('[role="tooltip"]')).toBeTruthy();

    fixture.destroy();

    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
  });
});
