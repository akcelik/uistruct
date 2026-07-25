import { TestBed } from '@angular/core/testing';
import {
  STRCT_NOTIFICATION_HISTORY_LIMIT,
  StrctNotification,
  StrctToastService,
} from '../toast/toast';
import { StrctNotificationCenter } from './notification-center';

function bell(fixture: { nativeElement: HTMLElement }): HTMLElement {
  return fixture.nativeElement.querySelector('.strct-nc__bell')!;
}

function openPanel(fixture: ReturnType<typeof TestBed.createComponent<StrctNotificationCenter>>) {
  bell(fixture).click();
  fixture.detectChanges();
}

describe('StrctNotificationCenter', () => {
  it('records every shown toast in the shared history', () => {
    const service = TestBed.inject(StrctToastService);
    service.show('Deployed', { title: 'CI', type: 'success', duration: 0 });
    expect(service.history().length).toBe(1);
    const entry = service.history()[0];
    expect(entry.title).toBe('CI');
    expect(entry.message).toBe('Deployed');
    expect(entry.type).toBe('success');
    expect(entry.read).toBe(false);
    expect(entry.timestamp).toBeGreaterThan(0);
    expect(service.unreadCount()).toBe(1);
  });

  it('caps the history, keeping the newest entries', () => {
    const service = TestBed.inject(StrctToastService);
    for (let i = 1; i <= STRCT_NOTIFICATION_HISTORY_LIMIT + 5; i++) {
      service.show(`T${i}`, { duration: 0 });
    }
    expect(service.history().length).toBe(STRCT_NOTIFICATION_HISTORY_LIMIT);
    expect(service.history()[0].message).toBe('T6');
    expect(service.history().at(-1)!.message).toBe(`T${STRCT_NOTIFICATION_HISTORY_LIMIT + 5}`);
  });

  it('shows the unread count on the badge and in the bell aria-label', () => {
    const service = TestBed.inject(StrctToastService);
    const fixture = TestBed.createComponent(StrctNotificationCenter);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-nc__badge')).toBeNull();
    expect(bell(fixture).getAttribute('aria-label')).toBe('Notifications');

    service.show('One', { duration: 0 });
    service.show('Two', { duration: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-nc__badge')!.textContent.trim()).toBe('2');
    expect(bell(fixture).getAttribute('aria-label')).toBe('Notifications, 2 unread');
  });

  it('uses bellLabelFormat for the bell aria-label when provided', () => {
    const service = TestBed.inject(StrctToastService);
    service.show('One', { duration: 0 });
    const fixture = TestBed.createComponent(StrctNotificationCenter);
    fixture.componentRef.setInput('bellLabelFormat', (n: number) => `Alerts (${n} new)`);
    fixture.detectChanges();
    expect(bell(fixture).getAttribute('aria-label')).toBe('Alerts (1 new)');
  });

  it('lists the newest entries first and caps them at maxItems', () => {
    const service = TestBed.inject(StrctToastService);
    for (let i = 1; i <= 5; i++) service.show(`T${i}`, { duration: 0 });
    const fixture = TestBed.createComponent(StrctNotificationCenter);
    fixture.componentRef.setInput('maxItems', 2);
    fixture.detectChanges();
    openPanel(fixture);
    const items: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('.strct-nc__item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('T5');
    expect(items[1].textContent).toContain('T4');
  });

  it('mark-all-read empties the badge', () => {
    const service = TestBed.inject(StrctToastService);
    service.show('One', { duration: 0 });
    service.show('Two', { duration: 0 });
    const fixture = TestBed.createComponent(StrctNotificationCenter);
    fixture.detectChanges();
    openPanel(fixture);

    const actions: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('.strct-nc__action');
    actions[0].click();
    fixture.detectChanges();

    expect(service.unreadCount()).toBe(0);
    expect(fixture.nativeElement.querySelector('.strct-nc__badge')).toBeNull();
    expect(fixture.nativeElement.querySelector('.strct-nc__dot')).toBeNull();
  });

  it('clear-all drops the history and shows the empty state', () => {
    const service = TestBed.inject(StrctToastService);
    service.show('One', { duration: 0 });
    const fixture = TestBed.createComponent(StrctNotificationCenter);
    fixture.detectChanges();
    openPanel(fixture);

    const actions: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('.strct-nc__action');
    actions[1].click();
    fixture.detectChanges();

    expect(service.history().length).toBe(0);
    const empty: HTMLElement = fixture.nativeElement.querySelector('.strct-nc__empty');
    expect(empty.textContent).toContain('No notifications');
  });

  it('shows the empty state when there is no history', () => {
    const fixture = TestBed.createComponent(StrctNotificationCenter);
    fixture.componentRef.setInput('emptyText', 'All caught up');
    fixture.detectChanges();
    openPanel(fixture);
    const empty: HTMLElement = fixture.nativeElement.querySelector('.strct-nc__empty');
    expect(empty.textContent).toContain('All caught up');
    expect(fixture.nativeElement.querySelector('.strct-nc__list')).toBeNull();
  });

  it('clicking an entry marks it read, emits activated and closes the panel', () => {
    const service = TestBed.inject(StrctToastService);
    service.show('Disk full', { title: 'db-1', type: 'critical', duration: 0 });
    const fixture = TestBed.createComponent(StrctNotificationCenter);
    fixture.detectChanges();
    const emitted: StrctNotification[] = [];
    fixture.componentInstance.activated.subscribe((n) => emitted.push(n));
    openPanel(fixture);

    fixture.nativeElement.querySelector('.strct-nc__item')!.click();
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(emitted[0].message).toBe('Disk full');
    expect(service.unreadCount()).toBe(0);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('moves focus into the panel on open and back to the bell on Escape', () => {
    vi.useFakeTimers();
    try {
      const service = TestBed.inject(StrctToastService);
      service.show('One', { duration: 0 });
      const fixture = TestBed.createComponent(StrctNotificationCenter);
      fixture.detectChanges();

      bell(fixture).focus();
      bell(fixture).click();
      fixture.detectChanges();
      vi.advanceTimersByTime(0);

      const panel: HTMLElement = fixture.nativeElement.querySelector('.strct-nc__panel');
      expect(panel.contains(document.activeElement)).toBe(true);

      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.componentInstance.open()).toBe(false);
      expect(document.activeElement).toBe(bell(fixture));
    } finally {
      vi.useRealTimers();
    }
  });

  it('closes on outside click', () => {
    const fixture = TestBed.createComponent(StrctNotificationCenter);
    fixture.detectChanges();
    openPanel(fixture);
    expect(fixture.componentInstance.open()).toBe(true);

    document.body.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('stops Escape propagation so a host overlay does not also close', () => {
    const fixture = TestBed.createComponent(StrctNotificationCenter);
    fixture.detectChanges();
    openPanel(fixture);

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    const stopSpy = vi.spyOn(event, 'stopPropagation');
    document.dispatchEvent(event);

    expect(stopSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
