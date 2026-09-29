import { TestBed } from '@angular/core/testing';
import { StrctStatusDot } from './status-dot';

function create(init?: (cmp: StrctStatusDot) => void) {
  const fixture = TestBed.createComponent(StrctStatusDot);
  if (init) init(fixture.componentInstance);
  fixture.detectChanges();
  return fixture;
}

describe('StrctStatusDot', () => {
  it('renders the host element', () => {
    const fixture = create();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('applies the tone class for the status', () => {
    const fixture = create();
    fixture.componentRef.setInput('status', 'critical');
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.classList.contains('strct-dot--critical')).toBe(true);
    expect(host.classList.contains('strct-dot--success')).toBe(false);
  });

  it('renders a per-status default as visually-hidden text', () => {
    const fixture = create();
    fixture.componentRef.setInput('status', 'warning');
    fixture.detectChanges();
    const sr = fixture.nativeElement.querySelector('.strct-dot__sr');
    expect(sr.textContent.trim()).toBe('Warning');
  });

  it('lets the label input override the default sr text', () => {
    const fixture = create();
    fixture.componentRef.setInput('status', 'success');
    fixture.componentRef.setInput('label', 'All systems operational');
    fixture.detectChanges();
    const sr = fixture.nativeElement.querySelector('.strct-dot__sr');
    expect(sr.textContent.trim()).toBe('All systems operational');
  });

  it('keeps the visual dot hidden from assistive tech', () => {
    const fixture = create();
    const dot = fixture.nativeElement.querySelector('.strct-dot__dot');
    expect(dot.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies the small-size class', () => {
    const fixture = create();
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('strct-dot--sm')).toBe(true);
  });

  it('marks pulse on the host and leaves it off by default (FR-48-19)', () => {
    const fixture = TestBed.createComponent(StrctStatusDot);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList).not.toContain('strct-dot--pulse');
    fixture.componentRef.setInput('pulse', true);
    fixture.detectChanges();
    expect(el.classList).toContain('strct-dot--pulse');
  });
});
