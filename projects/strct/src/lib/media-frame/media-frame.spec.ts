import { TestBed } from '@angular/core/testing';
import { StrctMediaFrame } from './media-frame';

function build(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(StrctMediaFrame);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('StrctMediaFrame', () => {
  it('keeps its ratio and projects the picture by default', () => {
    const { el } = build();
    expect(el.style.aspectRatio).toBe('4 / 3');
    expect(el.getAttribute('data-state')).toBe('content');
    expect(el.querySelector('.strct-mf__placeholder')).toBeNull();
    const wide = build({ ratio: '16 / 9' }).el;
    expect(wide.style.aspectRatio).toBe('16 / 9');
  });

  it('says why there is no picture, in its own space', () => {
    const { el } = build({ state: 'off', message: 'The VM is off' });
    const ph = el.querySelector('.strct-mf__placeholder') as HTMLElement;
    expect(ph).toBeTruthy();
    expect(ph.querySelector('strct-icon')).toBeTruthy();
    expect(ph.querySelector('.strct-mf__msg')?.textContent).toBe('The VM is off');
    expect(el.getAttribute('data-state')).toBe('off');
  });

  it('spins while loading and takes an icon override', () => {
    expect(build({ state: 'loading' }).el.querySelector('strct-spinner')).toBeTruthy();
    const { el } = build({ state: 'error', icon: 'lock', message: 'No permission' });
    expect(el.querySelector('strct-icon')).toBeTruthy();
    expect(el.querySelector('strct-spinner')).toBeNull();
  });

  it('is one tab stop when interactive, named by its message', () => {
    const { fixture, el } = build({ interactive: true, state: 'off', message: 'The VM is off' });
    const hit = el.querySelector('button.strct-mf__hit') as HTMLButtonElement;
    expect(hit).toBeTruthy();
    expect(hit.getAttribute('aria-label')).toBe('The VM is off');
    let n = 0;
    fixture.componentInstance.activated.subscribe(() => n++);
    hit.click();
    expect(n).toBe(1);
    expect(build().el.querySelector('.strct-mf__hit')).toBeNull();
  });
});

// FR-49-20 — a console thumbnail must not crop the guest's screen.
describe('StrctMediaFrame — fit', () => {
  it('covers by default and contains on request', () => {
    const fixture = TestBed.createComponent(StrctMediaFrame);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList).not.toContain('strct-mf--contain');

    fixture.componentRef.setInput('fit', 'contain');
    fixture.detectChanges();
    expect(el.classList).toContain('strct-mf--contain');
  });
});
