import { focusFirstIn, keepTabInside, restoreFocus, saveFocusedElement } from './focus';

function pressTab(target: HTMLElement, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

describe('overlay focus helpers', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="trigger">Trigger</button>
      <div id="panel">
        <button id="first" disabled>Disabled</button>
        <button id="second">Second</button>
        <input id="third" />
        <a id="fourth" href="#">Link</a>
      </div>
    `;
    container = document.getElementById('panel') as HTMLElement;
    container.addEventListener('keydown', (e) => keepTabInside(e as KeyboardEvent, container));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('saveFocusedElement', () => {
    it('returns the currently focused HTMLElement', () => {
      const trigger = document.getElementById('trigger') as HTMLElement;
      trigger.focus();
      expect(saveFocusedElement()).toBe(trigger);
    });

    it('returns null when the active element is not an HTMLElement', () => {
      const realActive = Object.getOwnPropertyDescriptor(Document.prototype, 'activeElement');
      Object.defineProperty(document, 'activeElement', { get: () => null, configurable: true });
      expect(saveFocusedElement()).toBeNull();
      if (realActive) Object.defineProperty(document, 'activeElement', realActive);
    });
  });

  describe('restoreFocus', () => {
    it('focuses a connected element', () => {
      const trigger = document.getElementById('trigger') as HTMLElement;
      restoreFocus(trigger);
      expect(document.activeElement).toBe(trigger);
    });

    it('is a no-op for null or undefined', () => {
      expect(() => {
        restoreFocus(null);
        restoreFocus(undefined);
      }).not.toThrow();
    });

    it('does not focus a detached element', () => {
      const detached = document.createElement('button');
      restoreFocus(detached);
      expect(document.activeElement).not.toBe(detached);
    });
  });

  describe('focusFirstIn', () => {
    it('focuses the first focusable descendant, skipping disabled ones', () => {
      expect(focusFirstIn(container)).toBe(true);
      expect(document.activeElement).toBe(document.getElementById('second'));
    });

    it('returns false and focuses nothing when there is nothing focusable', () => {
      document.body.innerHTML = '<div id="empty"><span tabindex="-1">Skip</span></div>';
      const empty = document.getElementById('empty') as HTMLElement;
      expect(focusFirstIn(empty)).toBe(false);
      expect(document.activeElement).not.toBe(empty);
    });
  });

  describe('keepTabInside', () => {
    it('wraps Tab from the last item back to the first', () => {
      const first = document.getElementById('second') as HTMLElement;
      const last = document.getElementById('fourth') as HTMLElement;
      last.focus();
      const event = pressTab(last);
      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(first);
    });

    it('wraps Shift+Tab from the first item back to the last', () => {
      const first = document.getElementById('second') as HTMLElement;
      const last = document.getElementById('fourth') as HTMLElement;
      first.focus();
      const event = pressTab(first, true);
      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(last);
    });

    it('moves Shift+Tab into the container when focus is outside it', () => {
      const trigger = document.getElementById('trigger') as HTMLElement;
      trigger.focus();
      const event = pressTab(container, true);
      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(document.getElementById('fourth'));
    });

    it('lets Tab through untouched in the middle of the container', () => {
      const middle = document.getElementById('third') as HTMLElement;
      middle.focus();
      const event = pressTab(middle);
      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(middle);
    });

    it('prevents Tab when there is nothing focusable', () => {
      document.body.innerHTML = '<div id="empty2"></div>';
      const empty = document.getElementById('empty2') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
      keepTabInside(event, empty);
      expect(event.defaultPrevented).toBe(true);
    });
  });
});
