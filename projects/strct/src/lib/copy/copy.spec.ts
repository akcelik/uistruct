import { TestBed } from '@angular/core/testing';
import { StrctCopy } from './copy';

describe('StrctCopy', () => {
  function make(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(StrctCopy);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, cmp: fixture.componentInstance };
  }

  it('renders a labeled copy button (icon-only by default)', () => {
    const { el } = make({ text: '172.16.75.100' });
    const btn = el.querySelector('button.strct-copy')!;
    expect(btn.getAttribute('aria-label')).toBe('Copy');
    expect(el.querySelector('.strct-copy__label')).toBeNull();
  });

  it('copies via the clipboard API, emits (copied) and flips to the ✓ state', async () => {
    const written: string[] = [];
    Object.assign(navigator, {
      clipboard: { writeText: (t: string) => (written.push(t), Promise.resolve()) },
    });
    const { fixture, el, cmp } = make({ text: 'uuid-42', label: 'Copy ID' });
    const emitted: string[] = [];
    cmp.copied.subscribe((t) => emitted.push(t));
    el.querySelector<HTMLButtonElement>('button')!.click();
    await Promise.resolve(); // clipboard promise
    fixture.detectChanges();
    expect(written).toEqual(['uuid-42']);
    expect(emitted).toEqual(['uuid-42']);
    expect(el.querySelector('.strct-copy--done')).toBeTruthy();
    expect(el.querySelector('.strct-copy__label')?.textContent).toContain('Copied');
  });

  it('shows the error state and does not emit when the write rejects', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: () => Promise.reject(new Error('denied')) },
    });
    const { fixture, el, cmp } = make({ text: 'uuid-42', label: 'Copy ID' });
    const emitted: string[] = [];
    cmp.copied.subscribe((t) => emitted.push(t));
    el.querySelector<HTMLButtonElement>('button')!.click();
    await Promise.resolve(); // clipboard promise
    await Promise.resolve(); // .then -> .catch hop
    fixture.detectChanges();
    expect(emitted).toEqual([]);
    expect(el.querySelector('.strct-copy--done')).toBeNull();
    expect(el.querySelector('.strct-copy--error')).toBeTruthy();
    expect(el.querySelector('.strct-copy__label')?.textContent).toContain('Copy failed');
    expect(el.querySelector('button')!.getAttribute('aria-label')).toBe('Copy failed');
  });

  it('shows the error state when the clipboard API is unavailable', () => {
    Object.assign(navigator, { clipboard: undefined });
    const { fixture, el, cmp } = make({ text: 'uuid-42', label: 'Copy ID' });
    const emitted: string[] = [];
    cmp.copied.subscribe((t) => emitted.push(t));
    el.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    expect(emitted).toEqual([]);
    expect(el.querySelector('.strct-copy--error')).toBeTruthy();
    expect(el.querySelector('.strct-copy__label')?.textContent).toContain('Copy failed');
  });
});
