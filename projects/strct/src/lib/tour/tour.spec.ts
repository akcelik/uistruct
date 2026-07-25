import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctTour, StrctTourStep } from './tour';

@Component({
  imports: [StrctTour],
  template: `
    <button id="deploy-btn">Deploy</button>
    <strct-tour
      [(open)]="open"
      [steps]="steps"
      (finished)="finished = true"
      (dismissed)="dismissed = true"
    />
  `,
})
class HostComponent {
  open = signal(false);
  finished = false;
  dismissed = false;
  steps: StrctTourStep[] = [
    { target: '#deploy-btn', title: 'Deploy', body: 'Start a deployment here.' },
    { target: null, title: 'That is it', body: 'Enjoy.' },
  ];
}

function setup(open = true) {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.open.set(open);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

/** Focus moves happen in a setTimeout after render — flush them. */
const flushFocus = () => new Promise<void>((resolve) => setTimeout(resolve));

describe('StrctTour', () => {
  it('renders nothing while closed; open shows a labeled dialog card + ring', () => {
    const closed = setup(false);
    expect(closed.el.querySelector('.strct-tour__card')).toBeNull();
    const { el } = setup(true);
    const card = el.querySelector('.strct-tour__card')!;
    expect(card.getAttribute('role')).toBe('dialog');
    const title = el.querySelector('.strct-tour__title')!;
    expect(card.getAttribute('aria-labelledby')).toBe(title.id);
    expect(title.id).toBeTruthy();
    expect(title.textContent).toContain('Deploy');
    expect(el.querySelector('.strct-tour__ring')).toBeTruthy();
    expect(el.querySelector('.strct-tour__step')?.textContent).toContain('1 / 2');
  });

  it('Next steps through; the last step finishes and closes', () => {
    const { fixture, host, el } = setup(true);
    const nextBtn = () =>
      [...el.querySelectorAll<HTMLButtonElement>('.strct-tour__nav button')].at(-1)!;
    nextBtn().click();
    fixture.detectChanges();
    expect(el.querySelector('.strct-tour__step')?.textContent).toContain('2 / 2');
    // Centered step (no target) has no ring.
    expect(el.querySelector('.strct-tour__ring')).toBeNull();
    nextBtn().click();
    fixture.detectChanges();
    expect(host.open()).toBe(false);
    expect(host.finished).toBe(true);
    expect(host.dismissed).toBe(false);
  });

  it('Escape dismisses without finishing and stops propagation (a host overlay stays open)', () => {
    const { fixture, host, el } = setup(true);
    const onDoc = vi.fn();
    document.addEventListener('keydown', onDoc);
    el.querySelector('.strct-tour__card')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    document.removeEventListener('keydown', onDoc);
    fixture.detectChanges();
    expect(host.open()).toBe(false);
    expect(host.dismissed).toBe(true);
    expect(host.finished).toBe(false);
    expect(onDoc).not.toHaveBeenCalled();
  });

  it('moves focus to the Next/Done button on open and each step; restores focus on close', async () => {
    const { fixture, host, el } = setup(false);
    const trigger = el.querySelector<HTMLElement>('#deploy-btn')!;
    trigger.focus();
    host.open.set(true);
    fixture.detectChanges();
    await flushFocus();
    const nextBtn = () =>
      [...el.querySelectorAll<HTMLButtonElement>('.strct-tour__nav button')].at(-1)!;
    expect(document.activeElement).toBe(nextBtn());
    nextBtn().click();
    fixture.detectChanges();
    await flushFocus();
    expect(document.activeElement).toBe(nextBtn());
    // Finish on the last step: focus returns to the trigger.
    nextBtn().click();
    fixture.detectChanges();
    expect(host.finished).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it('traps Tab within the card', async () => {
    const { el } = setup(true);
    await flushFocus();
    const card = el.querySelector<HTMLElement>('.strct-tour__card')!;
    const buttons = [...el.querySelectorAll<HTMLButtonElement>('.strct-tour__nav button')];
    const first = buttons[0];
    const last = buttons.at(-1)!;
    last.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(first);
    first.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(last);
  });

  it('ArrowRight/Left step and Home/End jump; arrows mirror under RTL', () => {
    const { fixture, el } = setup(true);
    const card = el.querySelector<HTMLElement>('.strct-tour__card')!;
    const step = () => el.querySelector('.strct-tour__step')?.textContent;
    const key = (k: string) =>
      card.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    key('ArrowRight');
    fixture.detectChanges();
    expect(step()).toContain('2 / 2');
    key('ArrowLeft');
    fixture.detectChanges();
    expect(step()).toContain('1 / 2');
    key('End');
    fixture.detectChanges();
    expect(step()).toContain('2 / 2');
    key('Home');
    fixture.detectChanges();
    expect(step()).toContain('1 / 2');
    // RTL: ArrowRight goes back, ArrowLeft goes forward.
    card.style.direction = 'rtl';
    key('ArrowRight');
    fixture.detectChanges();
    expect(step()).toContain('1 / 2'); // already first: clamped
    key('ArrowLeft');
    fixture.detectChanges();
    expect(step()).toContain('2 / 2');
  });
});
