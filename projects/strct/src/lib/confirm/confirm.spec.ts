import { TestBed } from '@angular/core/testing';
import { StrctConfirmOutlet, StrctConfirmService } from './confirm';

function setup() {
  const fixture = TestBed.createComponent(StrctConfirmOutlet);
  fixture.detectChanges();
  const service = TestBed.inject(StrctConfirmService);
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, service, el };
}

/** Let the modal's and the outlet's initial-focus macrotasks run. */
function flushFocusTimers(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('StrctConfirmOutlet', () => {
  it('renders nothing until a confirmation is requested', () => {
    const { el } = setup();
    expect(el.querySelector('.strct-modal__dialog')).toBeNull();
  });

  it('resolves true on confirm', async () => {
    const { fixture, service, el } = setup();
    const p = service.confirm({ title: 'Delete row?', message: 'This cannot be undone.' });
    fixture.detectChanges();
    const dialog = el.querySelector<HTMLElement>('.strct-modal__dialog')!;
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain('Delete row?');
    expect(dialog.textContent).toContain('This cannot be undone.');
    const confirmBtn = el.querySelector<HTMLElement>('.strct-modal__foot button:last-child')!;
    confirmBtn.click();
    expect(await p).toBe(true);
    fixture.detectChanges();
    expect(el.querySelector('.strct-modal__dialog')).toBeNull();
  });

  it('resolves false on cancel', async () => {
    const { fixture, service, el } = setup();
    const p = service.confirm({ title: 'T', message: 'M' });
    fixture.detectChanges();
    el.querySelector<HTMLElement>('.strct-confirm__cancel')!.click();
    expect(await p).toBe(false);
  });

  it('resolves false on Escape', async () => {
    const { fixture, service } = setup();
    const p = service.confirm({ title: 'T', message: 'M' });
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(await p).toBe(false);
  });

  it('resolves false on a backdrop click', async () => {
    const { fixture, service, el } = setup();
    const p = service.confirm({ title: 'T', message: 'M' });
    fixture.detectChanges();
    el.querySelector<HTMLElement>('.strct-modal__overlay')!.click();
    expect(await p).toBe(false);
  });

  it('moves initial focus to the cancel button (safe default)', async () => {
    const { fixture, service, el } = setup();
    const p = service.confirm({ title: 'T', message: 'M', tone: 'critical' });
    fixture.detectChanges();
    await fixture.whenStable(); // afterNextRender hop
    await flushFocusTimers(); // behind the modal's own initial focus
    const cancel = el.querySelector<HTMLElement>('.strct-confirm__cancel')!;
    expect(document.activeElement).toBe(cancel);
    service.settle(false);
    await p;
  });

  it('restores focus to the previously focused element on close', async () => {
    const { fixture, service, el } = setup();
    const before = document.createElement('button');
    document.body.appendChild(before);
    before.focus();
    try {
      const p = service.confirm({ title: 'T', message: 'M' });
      fixture.detectChanges();
      el.querySelector<HTMLElement>('.strct-confirm__cancel')!.click();
      fixture.detectChanges();
      expect(await p).toBe(false);
      expect(document.activeElement).toBe(before);
    } finally {
      before.remove();
    }
  });

  it('uses the English defaults and honors per-call labels', async () => {
    const { fixture, service, el } = setup();
    const p = service.confirm({ title: 'T', message: 'M' });
    fixture.detectChanges();
    const buttons = el.querySelectorAll<HTMLElement>('.strct-modal__foot button');
    expect(buttons[0].textContent!.trim()).toBe('Cancel');
    expect(buttons[1].textContent!.trim()).toBe('Confirm');
    service.settle(false);
    await p;
    fixture.detectChanges();
    const p2 = service.confirm({
      title: 'T',
      message: 'M',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
    });
    fixture.detectChanges();
    const buttons2 = el.querySelectorAll<HTMLElement>('.strct-modal__foot button');
    expect(buttons2[0].textContent!.trim()).toBe('Keep');
    expect(buttons2[1].textContent!.trim()).toBe('Delete');
    service.settle(false);
    await p2;
  });

  it('honors localized outlet-level default labels', async () => {
    const { fixture, service, el } = setup();
    fixture.componentRef.setInput('confirmLabel', 'Bestätigen');
    fixture.componentRef.setInput('cancelLabel', 'Abbrechen');
    const p = service.confirm({ title: 'T', message: 'M' });
    fixture.detectChanges();
    const buttons = el.querySelectorAll<HTMLElement>('.strct-modal__foot button');
    expect(buttons[0].textContent!.trim()).toBe('Abbrechen');
    expect(buttons[1].textContent!.trim()).toBe('Bestätigen');
    service.settle(false);
    await p;
  });

  it('styles the confirm button by tone', async () => {
    const { fixture, service, el } = setup();
    const p = service.confirm({ title: 'T', message: 'M', tone: 'critical' });
    fixture.detectChanges();
    const confirmBtn = el.querySelector<HTMLElement>('.strct-modal__foot button:last-child')!;
    expect(confirmBtn.className).toContain('critical');
    service.settle(false);
    await p;
  });
});

describe('StrctConfirmService', () => {
  it('injects via TestBed', () => {
    expect(TestBed.inject(StrctConfirmService)).toBeTruthy();
  });

  it('a new confirm() cancels (resolves false) the pending one', async () => {
    const service = TestBed.inject(StrctConfirmService);
    const first = service.confirm({ title: 'One', message: 'M' });
    const second = service.confirm({ title: 'Two', message: 'M' });
    expect(await first).toBe(false);
    expect(service.active()?.title).toBe('Two');
    service.settle(true);
    expect(await second).toBe(true);
    expect(service.active()).toBeNull();
  });

  it('settle without a pending confirmation is a no-op', () => {
    const service = TestBed.inject(StrctConfirmService);
    expect(() => service.settle(true)).not.toThrow();
  });
});
