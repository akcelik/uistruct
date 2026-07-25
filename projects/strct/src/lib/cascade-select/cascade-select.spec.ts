import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  StrctCascadeColumn,
  StrctCascadeHost,
  StrctCascadeOption,
  StrctCascadeSelect,
} from './cascade-select';

const OPTIONS: StrctCascadeOption[] = [
  { label: 'Standalone', value: 'solo' },
  {
    label: 'Group A',
    children: [
      { label: 'A1', value: 'a1' },
      { label: 'Group B', children: [{ label: 'B1', value: 'b1' }] },
      { label: 'A3', value: 'a3' },
    ],
  },
  { label: 'Tail', value: 'tail' },
];

function keydown(el: Element, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

function create(options: StrctCascadeOption[] = OPTIONS) {
  const fixture = TestBed.createComponent(StrctCascadeSelect);
  fixture.componentRef.setInput('options', options);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const trigger = el.querySelector<HTMLButtonElement>('.strct-cs__trigger')!;
  const panel = () => el.querySelector<HTMLElement>('.strct-cs__panel');
  /** Rows of one column (its own `.strct-csc` only, not nested fly-outs). */
  const rows = (column: HTMLElement) =>
    Array.from(
      column.querySelectorAll<HTMLElement>(':scope > .strct-csc > .strct-csc__wrap > .strct-csn'),
    );
  return { fixture, el, trigger, panel, rows, cmp: fixture.componentInstance };
}

/** Open via the trigger (keyboard) and let the column's afterNextRender focus run. */
async function openWithKey(ctx: ReturnType<typeof create>, key = 'ArrowDown') {
  ctx.trigger.focus();
  keydown(ctx.trigger, key);
  ctx.fixture.detectChanges();
  await ctx.fixture.whenStable();
  ctx.fixture.detectChanges();
  return ctx.panel()!;
}

describe('StrctCascadeSelect', () => {
  it('applies the strct-cs host class', () => {
    const fixture = TestBed.createComponent(StrctCascadeSelect);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-cs');
  });

  it('implements CVA and invokes registerOnChange callback on pick', () => {
    const fixture = TestBed.createComponent(StrctCascadeSelect);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');

    let emitted: unknown;
    cmp.registerOnChange((v: unknown) => (emitted = v));
    cmp.pick('leaf-value');
    expect(emitted).toBe('leaf-value');
  });
});

describe('StrctCascadeSelect — trigger', () => {
  it('wears the shared strct-control skin and exposes aria-haspopup/aria-expanded', async () => {
    const ctx = create();
    expect(ctx.trigger.classList).toContain('strct-control');
    expect(ctx.trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(ctx.trigger.getAttribute('aria-expanded')).toBe('false');

    await openWithKey(ctx);
    expect(ctx.trigger.getAttribute('aria-expanded')).toBe('true');
    expect(ctx.panel()).toBeTruthy();
    expect(ctx.panel()!.querySelector('[role="menu"]')).toBeTruthy();
  });

  for (const key of ['ArrowDown', 'Enter', ' ']) {
    it(`opens the panel on ${key === ' ' ? 'Space' : key} without double-toggling`, async () => {
      const ctx = create();
      const event = keydown(ctx.trigger, key);
      expect(event.defaultPrevented).toBe(true); // Space must not scroll
      ctx.fixture.detectChanges();
      await ctx.fixture.whenStable();
      ctx.fixture.detectChanges();
      expect(ctx.panel()).toBeTruthy();
    });
  }

  it('does not open while disabled', async () => {
    const ctx = create();
    ctx.cmp.setDisabledState(true);
    ctx.fixture.detectChanges();
    expect(ctx.trigger.disabled).toBe(true);
    keydown(ctx.trigger, 'ArrowDown');
    ctx.fixture.detectChanges();
    await ctx.fixture.whenStable();
    expect(ctx.panel()).toBeNull();
  });

  it('merges the static disabled input with the CVA disabled state', async () => {
    const ctx = create();
    ctx.fixture.componentRef.setInput('disabled', true);
    ctx.fixture.detectChanges();
    expect(ctx.cmp.isDisabled()).toBe(true);
    expect(ctx.trigger.disabled).toBe(true);
    keydown(ctx.trigger, 'ArrowDown');
    ctx.fixture.detectChanges();
    await ctx.fixture.whenStable();
    expect(ctx.panel()).toBeNull();

    // Static disable stays even if the form re-enables.
    ctx.cmp.setDisabledState(false);
    expect(ctx.cmp.isDisabled()).toBe(true);

    // A static input change must not clobber the forms-driven disabled state.
    ctx.cmp.setDisabledState(true);
    ctx.fixture.componentRef.setInput('disabled', false);
    ctx.fixture.detectChanges();
    expect(ctx.cmp.isDisabled()).toBe(true);
    expect(ctx.trigger.disabled).toBe(true);
  });
});

describe('StrctCascadeSelect — keyboard navigation', () => {
  it('moves focus to the first row on open with a roving tabindex', async () => {
    const ctx = create();
    const panel = await openWithKey(ctx);
    const rows = ctx.rows(panel);
    expect(rows.length).toBe(3);
    expect(document.activeElement).toBe(rows[0]);
    expect(rows.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });

  it('ArrowDown/ArrowUp rove focus and wrap at both ends', async () => {
    const ctx = create();
    const panel = await openWithKey(ctx);
    const rows = ctx.rows(panel);

    keydown(document.activeElement!, 'ArrowDown');
    ctx.fixture.detectChanges();
    expect(document.activeElement).toBe(rows[1]);
    expect(rows.map((r) => r.tabIndex)).toEqual([-1, 0, -1]);

    keydown(document.activeElement!, 'ArrowDown');
    keydown(document.activeElement!, 'ArrowDown'); // wraps to the first row
    ctx.fixture.detectChanges();
    expect(document.activeElement).toBe(rows[0]);

    keydown(document.activeElement!, 'ArrowUp'); // wraps to the last row
    ctx.fixture.detectChanges();
    expect(document.activeElement).toBe(rows[2]);
  });

  it('Home/End jump to the first/last row', async () => {
    const ctx = create();
    const panel = await openWithKey(ctx);
    const rows = ctx.rows(panel);

    keydown(document.activeElement!, 'End');
    ctx.fixture.detectChanges();
    expect(document.activeElement).toBe(rows[2]);

    keydown(document.activeElement!, 'Home');
    ctx.fixture.detectChanges();
    expect(document.activeElement).toBe(rows[0]);
  });

  it('Enter on a group row opens its fly-out and focuses the first child', async () => {
    const ctx = create();
    const panel = await openWithKey(ctx);

    keydown(document.activeElement!, 'ArrowDown'); // rove to "Group A"
    ctx.fixture.detectChanges();
    const event = keydown(document.activeElement!, 'Enter');
    expect(event.defaultPrevented).toBe(true);
    ctx.fixture.detectChanges();
    await ctx.fixture.whenStable();
    ctx.fixture.detectChanges();

    const flyout = panel.querySelector<HTMLElement>('.strct-csc__subpanel');
    expect(flyout).toBeTruthy();
    const children = ctx.rows(flyout!);
    expect(children.map((c) => c.textContent)).toEqual(['A1', 'Group B', 'A3']);
    expect(document.activeElement).toBe(children[0]);
    // The group row advertises the open fly-out.
    expect(ctx.rows(panel)[1].getAttribute('aria-haspopup')).toBe('menu');
    expect(ctx.rows(panel)[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('ArrowRight opens the fly-out; ArrowLeft backs out to the group row', async () => {
    const ctx = create();
    const panel = await openWithKey(ctx);

    keydown(document.activeElement!, 'ArrowDown'); // "Group A"
    ctx.fixture.detectChanges();
    keydown(document.activeElement!, 'ArrowRight');
    ctx.fixture.detectChanges();
    await ctx.fixture.whenStable();
    ctx.fixture.detectChanges();

    const flyout = panel.querySelector<HTMLElement>('.strct-csc__subpanel')!;
    expect(ctx.rows(flyout).length).toBe(3);

    keydown(document.activeElement!, 'ArrowLeft');
    ctx.fixture.detectChanges();
    expect(panel.querySelector('.strct-csc__subpanel')).toBeNull();
    expect(document.activeElement).toBe(ctx.rows(panel)[1]);
  });

  it('backs out level by level through nested groups', async () => {
    const ctx = create();
    const panel = await openWithKey(ctx);

    keydown(document.activeElement!, 'ArrowDown'); // "Group A"
    ctx.fixture.detectChanges();
    keydown(document.activeElement!, 'ArrowRight'); // into Group A
    ctx.fixture.detectChanges();
    await ctx.fixture.whenStable();
    ctx.fixture.detectChanges();
    keydown(document.activeElement!, 'ArrowDown'); // "Group B"
    ctx.fixture.detectChanges();
    keydown(document.activeElement!, 'ArrowRight'); // into Group B
    ctx.fixture.detectChanges();
    await ctx.fixture.whenStable();
    ctx.fixture.detectChanges();

    const flyoutA = panel.querySelector<HTMLElement>('.strct-csc__subpanel')!;
    const flyoutB = flyoutA.querySelector<HTMLElement>('.strct-csc__subpanel')!;
    expect(document.activeElement).toBe(ctx.rows(flyoutB)[0]); // "B1"

    keydown(document.activeElement!, 'ArrowLeft'); // back to Group B's row
    ctx.fixture.detectChanges();
    expect(flyoutA.querySelector('.strct-csc__subpanel')).toBeNull();
    expect(document.activeElement).toBe(ctx.rows(flyoutA)[1]);

    keydown(document.activeElement!, 'ArrowLeft'); // back to Group A's row
    ctx.fixture.detectChanges();
    expect(panel.querySelector('.strct-csc__subpanel')).toBeNull();
    expect(document.activeElement).toBe(ctx.rows(panel)[1]);
  });

  it('Enter on a leaf picks the value, closes, and returns focus to the trigger', async () => {
    const ctx = create();
    const panel = await openWithKey(ctx);
    let emitted: unknown;
    ctx.cmp.registerOnChange((v: unknown) => (emitted = v));

    keydown(document.activeElement!, 'ArrowDown'); // "Group A"
    ctx.fixture.detectChanges();
    keydown(document.activeElement!, 'ArrowRight');
    ctx.fixture.detectChanges();
    await ctx.fixture.whenStable();
    ctx.fixture.detectChanges();

    keydown(document.activeElement!, 'Enter'); // pick "A1"
    ctx.fixture.detectChanges();

    expect(emitted).toBe('a1');
    expect(ctx.cmp.value()).toBe('a1');
    expect(ctx.panel()).toBeNull();
    expect(document.activeElement).toBe(ctx.trigger);
    expect(ctx.trigger.textContent).toContain('A1');
    expect(panel.isConnected).toBe(false);
  });

  it('Space picks a leaf and prevents the default page scroll', async () => {
    const ctx = create();
    await openWithKey(ctx);

    const event = keydown(document.activeElement!, ' '); // "Standalone"
    ctx.fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(ctx.cmp.value()).toBe('solo');
    expect(ctx.panel()).toBeNull();
    expect(document.activeElement).toBe(ctx.trigger);
  });

  it('Escape closes the whole cascade from any depth and returns focus', async () => {
    const ctx = create();
    const panel = await openWithKey(ctx);
    const onDocKeydown = vi.fn();
    document.addEventListener('keydown', onDocKeydown);
    try {
      keydown(document.activeElement!, 'ArrowDown');
      ctx.fixture.detectChanges();
      keydown(document.activeElement!, 'ArrowRight'); // fly-out open
      ctx.fixture.detectChanges();
      await ctx.fixture.whenStable();
      ctx.fixture.detectChanges();
      expect(panel.querySelector('.strct-csc__subpanel')).toBeTruthy();

      const event = keydown(document.activeElement!, 'Escape');
      ctx.fixture.detectChanges();

      expect(event.defaultPrevented).toBe(true);
      expect(onDocKeydown).not.toHaveBeenCalled(); // stopPropagation
      expect(ctx.panel()).toBeNull(); // root panel too, not just the fly-out
      expect(document.activeElement).toBe(ctx.trigger);
    } finally {
      document.removeEventListener('keydown', onDocKeydown);
    }
  });

  it('Tab closes the panel without preventing the default focus move', async () => {
    const ctx = create();
    await openWithKey(ctx);

    const event = keydown(document.activeElement!, 'Tab');
    ctx.fixture.detectChanges();

    expect(event.defaultPrevented).toBe(false);
    expect(ctx.panel()).toBeNull();
    expect(document.activeElement).toBe(ctx.trigger); // restored, Tab moves on from here
  });
});

describe('StrctCascadeSelect — pointer and misc', () => {
  it('clicking a group row toggles its fly-out; clicking a leaf picks it', async () => {
    const ctx = create();
    ctx.trigger.focus();
    ctx.trigger.click();
    ctx.fixture.detectChanges();
    await ctx.fixture.whenStable();
    ctx.fixture.detectChanges();

    const panel = ctx.panel()!;
    ctx.rows(panel)[1].click(); // "Group A"
    ctx.fixture.detectChanges();
    await ctx.fixture.whenStable();
    ctx.fixture.detectChanges();

    const flyout = panel.querySelector<HTMLElement>('.strct-csc__subpanel')!;
    expect(flyout).toBeTruthy();

    let emitted: unknown;
    ctx.cmp.registerOnChange((v: unknown) => (emitted = v));
    ctx.rows(flyout)[2].click(); // "A3"
    ctx.fixture.detectChanges();

    expect(emitted).toBe('a3');
    expect(ctx.panel()).toBeNull();
    expect(document.activeElement).toBe(ctx.trigger);
  });

  it('hover still previews a group fly-out without stealing focus', async () => {
    const ctx = create();
    const panel = await openWithKey(ctx);
    // The hover listeners sit on the wrap (mouseenter/leave don't bubble).
    const groupWrap = ctx.rows(panel)[1].closest('.strct-csc__wrap')!;
    const focused = document.activeElement;

    groupWrap.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    ctx.fixture.detectChanges();
    await ctx.fixture.whenStable();
    ctx.fixture.detectChanges();
    expect(panel.querySelector('.strct-csc__subpanel')).toBeTruthy();
    expect(document.activeElement).toBe(focused); // hover previews only

    groupWrap.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
    ctx.fixture.detectChanges();
    expect(panel.querySelector('.strct-csc__subpanel')).toBeNull();
  });

  it('marks the selected leaf row', async () => {
    const ctx = create();
    ctx.cmp.writeValue('a1');
    ctx.fixture.detectChanges();
    const panel = await openWithKey(ctx);

    keydown(document.activeElement!, 'ArrowDown');
    ctx.fixture.detectChanges();
    keydown(document.activeElement!, 'ArrowRight');
    ctx.fixture.detectChanges();
    await ctx.fixture.whenStable();
    ctx.fixture.detectChanges();

    const flyout = panel.querySelector<HTMLElement>('.strct-csc__subpanel')!;
    const children = ctx.rows(flyout);
    expect(children[0].classList).toContain('strct-csn--selected');
    expect(children[2].classList).not.toContain('strct-csn--selected');
  });

  it('an outside click closes the panel', async () => {
    const ctx = create();
    await openWithKey(ctx);
    document.body.click();
    ctx.fixture.detectChanges();
    expect(ctx.panel()).toBeNull();
  });

  it('compareWith marks and labels object values that are not reference-equal', async () => {
    const ctx = create([
      { label: 'One', value: { id: 1 } },
      { label: 'Two', value: { id: 2 } },
    ]);
    ctx.fixture.componentRef.setInput(
      'compareWith',
      (a: unknown, b: unknown) =>
        (a as { id: number } | null)?.id === (b as { id: number } | null)?.id,
    );
    ctx.cmp.writeValue({ id: 2 }); // a fresh object, never one of the option values
    ctx.fixture.detectChanges();
    expect(ctx.trigger.textContent).toContain('Two'); // findLabel via compareWith
    const panel = await openWithKey(ctx);
    const rows = ctx.rows(panel);
    expect(rows[1].classList).toContain('strct-csn--selected');
    expect(rows[0].classList).not.toContain('strct-csn--selected');
  });
});

describe('StrctCascadeColumn', () => {
  it('parses focusOnOpen="false" as false (booleanAttribute)', () => {
    @Component({
      imports: [StrctCascadeColumn],
      providers: [
        { provide: StrctCascadeHost, useValue: { pick: () => {}, isSelected: () => false } },
      ],
      template: `<strct-cascade-column [items]="items" focusOnOpen="false" />`,
    })
    class ColumnHost {
      @ViewChild(StrctCascadeColumn) column!: StrctCascadeColumn;
      items: StrctCascadeOption[] = OPTIONS;
    }

    const fixture = TestBed.createComponent(ColumnHost);
    fixture.detectChanges();
    expect(fixture.componentInstance.column.focusOnOpen()).toBe(false);
  });
});
