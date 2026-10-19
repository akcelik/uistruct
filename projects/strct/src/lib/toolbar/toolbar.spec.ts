import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctToolbar, StrctToolbarSpacer } from './toolbar';

@Component({
  imports: [StrctToolbar, StrctToolbarSpacer],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-toolbar
      [selectionCount]="count()"
      [divided]="divided()"
      [orientation]="orientation()"
      (cleared)="clears.set(clears() + 1)"
    >
      <button type="button" class="a">Restart</button>
      <button type="button" class="b">Stop</button>
      <strct-toolbar-spacer />
      <button type="button" class="c">Add</button>
    </strct-toolbar>
  `,
})
class HostComponent {
  count = signal(0);
  divided = signal(false);
  orientation = signal<'horizontal' | 'vertical'>('horizontal');
  clears = signal(0);
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

const key = (key: string) => new KeyboardEvent('keydown', { key, bubbles: true });

describe('StrctToolbar', () => {
  it('has role="toolbar" with an accessible name and orientation', () => {
    const { el } = setup();
    const bar = el.querySelector('[role="toolbar"]')!;
    expect(bar.getAttribute('aria-label')).toBe('Toolbar');
    expect(bar.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('projects the actions and renders the spacer', () => {
    const { el } = setup();
    expect(el.querySelectorAll('.strct-tb > button').length).toBe(3);
    expect(el.querySelector('strct-toolbar-spacer')).toBeTruthy();
  });

  it('shows the selection chip only when selectionCount > 0 and clears via ×', () => {
    const { fixture, host, el } = setup();
    expect(el.querySelector('.strct-tb__selection')).toBeNull();
    host.count.set(3);
    fixture.detectChanges();
    expect(el.querySelector('.strct-tb__count')!.textContent).toContain('3 selected');
    el.querySelector<HTMLButtonElement>('.strct-tb__clear')!.click();
    expect(host.clears()).toBe(1);
  });

  it('applies the divided variant class', () => {
    const { fixture, host, el } = setup();
    host.divided.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.strct-tb--divided')).toBeTruthy();
  });

  it('roves focus with ArrowRight/ArrowLeft (wrapping) and Home/End', () => {
    const { el } = setup();
    const buttons = () => Array.from(el.querySelectorAll<HTMLButtonElement>('.strct-tb > button'));
    buttons()[0].focus();
    buttons()[0].dispatchEvent(key('ArrowRight'));
    expect(document.activeElement).toBe(buttons()[1]);
    buttons()[1].dispatchEvent(key('ArrowRight'));
    expect(document.activeElement).toBe(buttons()[2]);
    buttons()[2].dispatchEvent(key('ArrowRight'));
    expect(document.activeElement).toBe(buttons()[0]); // wraps
    buttons()[0].dispatchEvent(key('ArrowLeft'));
    expect(document.activeElement).toBe(buttons()[2]); // wraps backwards
    buttons()[2].dispatchEvent(key('Home'));
    expect(document.activeElement).toBe(buttons()[0]);
    buttons()[0].dispatchEvent(key('End'));
    expect(document.activeElement).toBe(buttons()[2]);
  });

  it('includes the clear-selection button in the roving order', () => {
    const { fixture, host, el } = setup();
    host.count.set(1);
    fixture.detectChanges();
    const clear = el.querySelector<HTMLButtonElement>('.strct-tb__clear')!;
    clear.focus();
    clear.dispatchEvent(key('ArrowRight'));
    expect(document.activeElement).toBe(el.querySelector('.strct-tb > button.a'));
  });

  it('vertical orientation roves with ArrowUp/ArrowDown', () => {
    const { fixture, host, el } = setup();
    host.orientation.set('vertical');
    fixture.detectChanges();
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('.strct-tb > button'));
    buttons[0].focus();
    buttons[0].dispatchEvent(key('ArrowDown'));
    expect(document.activeElement).toBe(buttons[1]);
    buttons[1].dispatchEvent(key('ArrowRight')); // ignored in vertical mode
    expect(document.activeElement).toBe(buttons[1]);
  });
});

@Component({
  imports: [StrctToolbar],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ` <strct-toolbar [selectionCount]="1" [selectionLabel]="label" /> `,
})
class LocalizedHostComponent {
  label = (n: number) => `${n} ausgewählt`;
}

describe('StrctToolbar localization', () => {
  it('renders the custom selectionLabel factory', () => {
    const fixture = TestBed.createComponent(LocalizedHostComponent);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.strct-tb__count')!.textContent,
    ).toContain('1 ausgewählt');
  });
});

// FR-49-20 — the bar's roving took the arrow keys from a select inside it.
describe('StrctToolbar — an open overlay keeps its own arrow keys', () => {
  @Component({
    imports: [StrctToolbar],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
      <strct-toolbar>
        <button type="button" class="a">Start</button>
        <button type="button" class="b" [attr.aria-expanded]="open()" aria-haspopup="listbox">
          Scope
        </button>
        <button type="button" class="c">Stop</button>
        <div role="listbox" class="pop">
          <div role="option" aria-selected="false" tabindex="0" class="opt">Cluster</div>
        </div>
      </strct-toolbar>
    `,
  })
  class Host {
    open = signal(false);
  }

  function build() {
    const fixture = TestBed.createComponent(Host);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    fixture.detectChanges();
    return { fixture, el, host: fixture.componentInstance };
  }
  const right = () =>
    new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });

  it('roves while nothing is open, and yields once the control opens one', () => {
    const { fixture, el, host } = build();
    const trigger = el.querySelector('.b') as HTMLElement;
    trigger.focus();

    const roving = right();
    trigger.dispatchEvent(roving);
    fixture.detectChanges();
    expect(roving.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(el.querySelector('.c'));

    // With the listbox open, the trigger owns the key.
    host.open.set(true);
    fixture.detectChanges();
    trigger.focus();
    const yielded = right();
    trigger.dispatchEvent(yielded);
    fixture.detectChanges();
    expect(yielded.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(trigger);
    el.remove();
  });

  it('leaves a key pressed inside the open list alone', () => {
    const { fixture, el, host } = build();
    host.open.set(true);
    fixture.detectChanges();
    const option = el.querySelector('.opt') as HTMLElement;
    option.focus();
    const e = right();
    option.dispatchEvent(e);
    fixture.detectChanges();
    expect(e.defaultPrevented).toBe(false);
    el.remove();
  });
});

// BUG-58-15: the APG toolbar pattern leaves a text field its arrow keys — the
// roving focus took them, so the caret could not be moved inside a searchbox
// sitting in the bar.
@Component({
  imports: [StrctToolbar],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-toolbar>
      <button type="button" class="a">Restart</button>
      <input type="text" class="q" />
      <textarea class="note"></textarea>
      <div class="note2" contenteditable="true" tabindex="0"></div>
      <button type="button" class="b">Stop</button>
      <input type="checkbox" class="box" />
    </strct-toolbar>
  `,
})
class TextEntryHost {}

describe('StrctToolbar — a text field inside the bar', () => {
  function setupText() {
    const fixture = TestBed.createComponent(TextEntryHost);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }
  const arrow = (from: HTMLElement, k: 'ArrowLeft' | 'ArrowRight') => {
    const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    from.dispatchEvent(e);
    return e;
  };

  it('leaves the arrow keys to an input, a textarea and a contenteditable', () => {
    const { el } = setupText();
    for (const sel of ['.q', '.note', '.note2'] as const) {
      const field = el.querySelector<HTMLElement>(sel)!;
      field.focus();
      const left = arrow(field, 'ArrowLeft');
      const right = arrow(field, 'ArrowRight');
      // Untouched: the caret moves, and focus stays in the field.
      expect(left.defaultPrevented).toBe(false);
      expect(right.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(field);
    }
  });

  it('still roves from the buttons, and from a checkbox (its keys are not the caret)', () => {
    const { el } = setupText();
    const a = el.querySelector<HTMLElement>('.a')!;
    a.focus();
    arrow(a, 'ArrowRight');
    expect(document.activeElement).toBe(el.querySelector('.q'));

    const box = el.querySelector<HTMLElement>('.box')!;
    box.focus();
    arrow(box, 'ArrowLeft');
    expect(document.activeElement).toBe(el.querySelector('.b'));
  });
});
