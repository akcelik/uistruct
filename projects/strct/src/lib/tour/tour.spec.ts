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

describe('StrctTour', () => {
  it('renders nothing while closed; open shows a labeled dialog card + ring', () => {
    const closed = setup(false);
    expect(closed.el.querySelector('.strct-tour__card')).toBeNull();
    const { el } = setup(true);
    const card = el.querySelector('.strct-tour__card')!;
    expect(card.getAttribute('role')).toBe('dialog');
    expect(card.getAttribute('aria-label')).toBe('Deploy');
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

  it('Escape dismisses without finishing', () => {
    const { fixture, host } = setup(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(host.open()).toBe(false);
    expect(host.dismissed).toBe(true);
    expect(host.finished).toBe(false);
  });
});
