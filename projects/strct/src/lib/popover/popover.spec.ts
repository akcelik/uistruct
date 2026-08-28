import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctButton } from '../button/button';
import { StrctPopover, StrctPopoverTrigger } from './popover';

@Component({
  imports: [StrctPopover, StrctPopoverTrigger, StrctButton],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-popover
      [open]="open()"
      (openChange)="open.set($event)"
      [trap]="trap"
      [ariaLabel]="label()"
    >
      <button strct-button strctPopoverTrigger>More</button>
      <button type="button" class="first">One</button>
      <button type="button" class="last">Two</button>
    </strct-popover>
  `,
})
class HostComponent {
  readonly open = signal(false);
  trap = false;
  readonly label = signal('Details');
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const btn = el.querySelector<HTMLElement>('[strctPopoverTrigger]')!;
  return { fixture, el, btn };
}

function panel(el: HTMLElement): HTMLElement | null {
  return el.querySelector<HTMLElement>('.strct-popover__panel');
}

describe('StrctPopover', () => {
  it('applies the base host class and stays closed by default', () => {
    const fixture = TestBed.createComponent(StrctPopover);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList).toContain('strct-popover');
    expect(panel(el)).toBeNull();
  });

  it('the trigger button carries aria-haspopup/aria-expanded and toggles on click', () => {
    const { fixture, el, btn } = setup();
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(panel(el)).toBeTruthy();
    btn.click();
    fixture.detectChanges();
    expect(panel(el)).toBeNull();
  });

  it('renders the panel as a labeled dialog (ariaLabel input)', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    expect(panel(el)!.getAttribute('role')).toBe('dialog');
    expect(panel(el)!.getAttribute('aria-label')).toBe('Details');
    fixture.componentInstance.label.set('Row actions');
    fixture.detectChanges();
    expect(panel(el)!.getAttribute('aria-label')).toBe('Row actions');
  });

  it('open is two-way: setting it from the outside opens and closes the panel', () => {
    const { fixture, el, btn } = setup();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    expect(panel(el)).toBeTruthy();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    // Closing from the inside flows back out through the model.
    document.body.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('Escape closes the panel and returns focus to the trigger', () => {
    const { fixture, el, btn } = setup();
    btn.focus();
    btn.click();
    fixture.detectChanges();
    expect(panel(el)).toBeTruthy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(panel(el)).toBeNull();
    expect(document.activeElement).toBe(btn);
  });

  it('Escape consumed by the open panel never reaches a host modal/drawer', () => {
    const { fixture, btn } = setup();
    // Registered after the component's own document listener — only
    // stopImmediatePropagation keeps this spy from seeing the keydown.
    const spy = vi.fn();
    document.addEventListener('keydown', spy);
    try {
      btn.click();
      fixture.detectChanges();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(spy).not.toHaveBeenCalled();
      // Closed popover consumes nothing — a host modal may have its Escape.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      document.removeEventListener('keydown', spy);
    }
  });

  it('an outside click closes the panel without touching focus', () => {
    const { fixture, el, btn } = setup();
    btn.focus();
    btn.click();
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();
    expect(panel(el)).toBeNull();
    expect(document.activeElement).toBe(btn);
  });

  it('a click inside the panel does not close it', () => {
    const { fixture, el, btn } = setup();
    btn.click();
    fixture.detectChanges();
    panel(el)!.click();
    fixture.detectChanges();
    expect(panel(el)).toBeTruthy();
  });

  it('trap off (default): opening does not steal focus and Tab is not trapped', async () => {
    const { fixture, el, btn } = setup();
    btn.focus();
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(panel(el)).toBeTruthy();
    expect(document.activeElement).toBe(btn);
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    panel(el)!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('trap on: focus moves into the panel on open and back to the trigger on close', async () => {
    const { fixture, el, btn } = setup();
    fixture.componentInstance.trap = true;
    btn.focus();
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable(); // let the afterNextRender focus-in run
    const first = el.querySelector<HTMLElement>('.first')!;
    expect(document.activeElement).toBe(first);
    // Trapped close always restores, even without Escape (outside click here).
    document.body.click();
    fixture.detectChanges();
    expect(panel(el)).toBeNull();
    expect(document.activeElement).toBe(btn);
  });

  it('trap on: Tab/Shift+Tab cycle within the panel', async () => {
    const { fixture, el, btn } = setup();
    fixture.componentInstance.trap = true;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const first = el.querySelector<HTMLElement>('.first')!;
    const last = el.querySelector<HTMLElement>('.last')!;
    // Tab on the last tabbable wraps to the first.
    last.focus();
    panel(el)!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(first);
    // Shift+Tab on the first tabbable wraps to the last.
    panel(el)!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(last);
  });
});
