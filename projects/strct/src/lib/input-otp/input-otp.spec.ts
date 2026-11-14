import { TestBed } from '@angular/core/testing';
import { StrctInputOtp } from './input-otp';
describe('StrctInputOtp', () => {
  it('renders the host element', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('contains the strct-otp class in its template', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-otp')).toBeTruthy();
  });

  it('renders the correct number of boxes based on length input', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.componentRef.setInput('length', 4);
    fixture.detectChanges();
    const boxes = fixture.nativeElement.querySelectorAll('.strct-otp__box');
    expect(boxes.length).toBe(4);
  });

  it('implements CVA', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');
  });
});

describe('StrctInputOtp FR-16-05/06', () => {
  it('autofocus puts the caret on box 0 at first render', async () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.componentRef.setInput('autofocus', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const first = fixture.nativeElement.querySelector('.strct-otp__box');
    expect(document.activeElement).toBe(first);
  });

  it('focus(index) moves the caret programmatically (fresh-attempt refocus)', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.detectChanges();
    fixture.componentInstance.focus(2);
    const boxes = fixture.nativeElement.querySelectorAll('.strct-otp__box');
    expect(document.activeElement).toBe(boxes[2]);
    fixture.componentInstance.focus();
    expect(document.activeElement).toBe(boxes[0]);
  });

  it('masked with a bare attribute (empty string) renders password boxes', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.componentRef.setInput('masked', '');
    fixture.detectChanges();
    const boxes = fixture.nativeElement.querySelectorAll('.strct-otp__box');
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      expect((box as HTMLInputElement).type).toBe('password');
    }

    fixture.componentRef.setInput('masked', false);
    fixture.detectChanges();
    for (const box of fixture.nativeElement.querySelectorAll('.strct-otp__box')) {
      expect((box as HTMLInputElement).type).toBe('text');
    }
  });

  it('groupSize renders aria-hidden separators between groups only', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.componentRef.setInput('length', 6);
    fixture.componentRef.setInput('groupSize', 3);
    fixture.detectChanges();
    const seps = fixture.nativeElement.querySelectorAll('.strct-otp__sep');
    expect(seps.length).toBe(1); // nnn – nnn: one separator, none trailing
    expect(seps[0].getAttribute('aria-hidden')).toBe('true');
    // Auto-advance still skips the separator (it is not an input).
    expect(fixture.nativeElement.querySelectorAll('.strct-otp__box').length).toBe(6);

    fixture.componentRef.setInput('groupSize', 2);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.strct-otp__sep').length).toBe(2);

    fixture.componentRef.setInput('groupSize', 0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.strct-otp__sep').length).toBe(0);
  });
});

// FR-49-19 — the boxes had to line up with a full-width Verify button.
describe('StrctInputOtp — fill', () => {
  it('is opt-in and marks the row', () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.detectChanges();
    const row = () => (fixture.nativeElement as HTMLElement).querySelector('.strct-otp')!;
    expect(row().classList).not.toContain('strct-otp--fill');
    fixture.componentRef.setInput('fill', true);
    fixture.detectChanges();
    expect(row().classList).toContain('strct-otp--fill');
  });
});

// BUG-80-03 / FR-80-06 — the row's shape and where it sits. The pixels are
// measured in Chrome by scripts/otp-row.mjs; what a unit test can hold is the
// contract that drives them: which class carries which look, and that the
// default moves nothing.
describe('StrctInputOtp — the code row', () => {
  const make = () => {
    const fixture = TestBed.createComponent(StrctInputOtp);
    fixture.detectChanges();
    return fixture;
  };
  const row = (fixture: ReturnType<typeof make>) =>
    (fixture.nativeElement as HTMLElement).querySelector('.strct-otp')!;

  it('align is start by default and says so on the host', () => {
    const fixture = make();
    expect(fixture.componentInstance.align()).toBe('start');
    expect((fixture.nativeElement as HTMLElement).getAttribute('data-align')).toBe('start');
  });

  it('align=center|end is on the host, where the row can be placed', () => {
    const fixture = make();
    for (const align of ['center', 'end', 'start'] as const) {
      fixture.componentRef.setInput('align', align);
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).getAttribute('data-align')).toBe(align);
      // The row itself is untouched: alignment is the host's job, so `fill`
      // keeps working exactly as it does without an alignment.
      expect(row(fixture).classList).not.toContain('strct-otp--center');
    }
  });

  it('size=lg marks the row, md is the default and marks nothing', () => {
    const fixture = make();
    expect(fixture.componentInstance.size()).toBe('md');
    expect(row(fixture).classList).not.toContain('strct-otp--lg');
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(row(fixture).classList).toContain('strct-otp--lg');
    fixture.componentRef.setInput('size', 'md');
    fixture.detectChanges();
    expect(row(fixture).classList).not.toContain('strct-otp--lg');
  });

  it('a size and an alignment do not disturb the boxes themselves', () => {
    const fixture = make();
    fixture.componentRef.setInput('length', 6);
    fixture.componentRef.setInput('groupSize', 3);
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('align', 'center');
    fixture.componentRef.setInput('fill', true);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.strct-otp__box').length).toBe(6);
    expect(host.querySelectorAll('.strct-otp__sep').length).toBe(1);
    for (const box of host.querySelectorAll('.strct-otp__box')) {
      expect((box as HTMLInputElement).autocomplete).toBe('one-time-code');
      expect((box as HTMLInputElement).maxLength).toBe(1);
    }
  });
});
