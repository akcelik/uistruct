import { TestBed } from '@angular/core/testing';
import { StrctToastOutlet, StrctToastService } from './toast';

describe('StrctToastOutlet', () => {
  it('creates the component', () => {
    const fixture = TestBed.createComponent(StrctToastOutlet);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('uses dismissLabel for the close button aria-label', () => {
    const service = TestBed.inject(StrctToastService);
    service.show('Hi', { duration: 0 });
    const fixture = TestBed.createComponent(StrctToastOutlet);
    fixture.componentRef.setInput('dismissLabel', 'Close notification');
    fixture.detectChanges();
    const btn: HTMLElement = fixture.nativeElement.querySelector('.strct-toast__close');
    expect(btn.getAttribute('aria-label')).toBe('Close notification');
  });

  it('gives only critical toasts role="alert" for assertive announcement', () => {
    const service = TestBed.inject(StrctToastService);
    service.show('FYI', { duration: 0 });
    service.show('Broke', { type: 'critical', duration: 0 });
    const fixture = TestBed.createComponent(StrctToastOutlet);
    fixture.detectChanges();
    const toasts: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.strct-toast');
    expect(toasts[0].getAttribute('role')).toBeNull();
    expect(toasts[1].getAttribute('role')).toBe('alert');
  });

  it('renders at most 5 toasts, keeping the newest', () => {
    const service = TestBed.inject(StrctToastService);
    for (let i = 1; i <= 7; i++) {
      service.show(`T${i}`, { duration: 0 });
    }
    const fixture = TestBed.createComponent(StrctToastOutlet);
    fixture.detectChanges();
    const toasts: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.strct-toast');
    expect(toasts.length).toBe(5);
    expect(toasts[0].textContent).toContain('T3');
    expect(toasts[4].textContent).toContain('T7');
  });

  it('pauses auto-dismiss while hovered and resumes on mouse leave', () => {
    vi.useFakeTimers();
    try {
      const service = TestBed.inject(StrctToastService);
      service.show('Hi');
      const fixture = TestBed.createComponent(StrctToastOutlet);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement.querySelector('.strct-toast');
      el.dispatchEvent(new Event('mouseenter'));
      vi.advanceTimersByTime(10_000);
      expect(service.toasts().length).toBe(1);
      el.dispatchEvent(new Event('mouseleave'));
      vi.advanceTimersByTime(4000);
      expect(service.toasts().length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('pauses auto-dismiss while focus is inside the toast', () => {
    vi.useFakeTimers();
    try {
      const service = TestBed.inject(StrctToastService);
      service.show('Hi');
      const fixture = TestBed.createComponent(StrctToastOutlet);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement.querySelector('.strct-toast');
      el.dispatchEvent(new FocusEvent('focusin'));
      vi.advanceTimersByTime(10_000);
      expect(service.toasts().length).toBe(1);
      el.dispatchEvent(new FocusEvent('focusout'));
      vi.advanceTimersByTime(4000);
      expect(service.toasts().length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('StrctToastService', () => {
  it('injects via TestBed', () => {
    const service = TestBed.inject(StrctToastService);
    expect(service).toBeTruthy();
  });

  it('queues a toast and clears it', () => {
    const service = TestBed.inject(StrctToastService);
    const id = service.show('Hello');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Hello');
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it('auto-dismisses after the duration', () => {
    vi.useFakeTimers();
    try {
      const service = TestBed.inject(StrctToastService);
      service.show('Hi');
      vi.advanceTimersByTime(3999);
      expect(service.toasts().length).toBe(1);
      vi.advanceTimersByTime(1);
      expect(service.toasts().length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('pause stops the countdown and resume restarts it in full', () => {
    vi.useFakeTimers();
    try {
      const service = TestBed.inject(StrctToastService);
      const id = service.show('Hi');
      vi.advanceTimersByTime(3000);
      service.pause(id);
      vi.advanceTimersByTime(10_000);
      expect(service.toasts().length).toBe(1);
      service.resume(id);
      vi.advanceTimersByTime(3999);
      expect(service.toasts().length).toBe(1);
      vi.advanceTimersByTime(1);
      expect(service.toasts().length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clear cancels pending auto-dismiss timers', () => {
    vi.useFakeTimers();
    try {
      const service = TestBed.inject(StrctToastService);
      service.show('Hi');
      service.clear();
      vi.advanceTimersByTime(10_000);
      expect(service.toasts().length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
