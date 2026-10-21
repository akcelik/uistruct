import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctButton } from './button';

@Component({
  imports: [StrctButton],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<button strct-button variant="primary" size="sm">Go</button>`,
})
class HostComponent {}

@Component({
  imports: [StrctButton],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<p>See <button strct-button variant="link">Show all</button> for the rest.</p>`,
})
class LinkHost {}

describe('StrctButton', () => {
  it('applies the base, variant and size host classes', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(btn.classList).toContain('strct-btn');
    expect(btn.classList).toContain('strct-btn--primary');
    expect(btn.classList).toContain('strct-btn--sm');
  });

  it('marks the link variant on the host (FR-48-09)', () => {
    const fixture = TestBed.createComponent(LinkHost);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('.strct-btn--link') as HTMLElement;
    expect(link).toBeTruthy();
    expect(link.tagName).toBe('BUTTON');
    expect(link.classList).not.toContain('strct-btn--flat');
  });
});

// FR-59-03: a disabled action owes its reason, and a disabled button cannot be
// focused — so with a reason it says no a different way.
describe('StrctButton — disabledReason', () => {
  @Component({
    imports: [StrctButton],
    template: ` <button strct-button [disabled]="off()" [disabledReason]="why()">Join</button> `,
  })
  class Host {
    off = signal(true);
    why = signal('');
    clicks = 0;
  }

  const build = () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, btn: el.querySelector('button')! };
  };

  afterEach(() => {
    document.querySelectorAll('[role="tooltip"]').forEach((t) => t.remove());
  });

  it('with no reason it is the native attribute, exactly as before', () => {
    const { btn } = build();
    expect(btn.hasAttribute('disabled')).toBe(true);
    expect(btn.getAttribute('aria-disabled')).toBeNull();
  });

  it('with a reason it keeps its tab stop and says no through aria-disabled', () => {
    const { fixture, btn } = build();
    fixture.componentInstance.why.set('The cluster is already joined');
    fixture.detectChanges();
    expect(btn.hasAttribute('disabled')).toBe(false);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    btn.focus();
    expect(document.activeElement).toBe(btn);
  });

  it('shows the reason on focus and describes itself with it', () => {
    const { fixture, btn } = build();
    fixture.componentInstance.why.set('The cluster is already joined');
    fixture.detectChanges();

    btn.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    const id = btn.getAttribute('aria-describedby')!;
    expect(id).toBeTruthy();
    const bubble = document.getElementById(id)!;
    expect(bubble.getAttribute('role')).toBe('tooltip');
    expect(bubble.textContent).toBe('The cluster is already joined');

    btn.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(btn.getAttribute('aria-describedby')).toBeNull();
    expect(document.getElementById(id)).toBeNull();
  });

  // BUG-60-01: the refusal has to run before the consumer's own handler. A
  // host listener is a bubble listener, and Angular attaches a (click) from
  // the consumer's template to the element first — so the "disabled" button
  // performed its action on a click, and on Enter / Space with it.
  it("refuses a (click) written in the consumer's template, and the parent's", () => {
    @Component({
      imports: [StrctButton],
      template: `
        <!-- A clickable region around the button: its handler must not fire
             either, because the refused click never bubbles. -->
        <div
          role="button"
          tabindex="0"
          (click)="outer = outer + 1"
          (keyup.enter)="outer = outer + 1"
        >
          <button
            strct-button
            [disabled]="off()"
            disabledReason="Why not"
            (click)="inner = inner + 1"
          >
            Go
          </button>
        </div>
      `,
    })
    class TemplateHost {
      off = signal(true);
      inner = 0;
      outer = 0;
      late = 0;
    }

    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    // A listener added after the element exists, which the old refusal did stop.
    btn.addEventListener('click', () => host.late++);

    btn.click();
    expect({ inner: host.inner, outer: host.outer, late: host.late }).toEqual({
      inner: 0,
      outer: 0,
      late: 0,
    });
    // A button's keyboard activation is a click, and it is refused the same way.
    const keyActivation = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 });
    btn.dispatchEvent(keyActivation);
    expect(keyActivation.defaultPrevented).toBe(true);
    expect(host.inner).toBe(0);

    // Enabled again, every one of them runs.
    host.off.set(false);
    fixture.detectChanges();
    btn.click();
    expect({ inner: host.inner, outer: host.outer, late: host.late }).toEqual({
      inner: 1,
      outer: 1,
      late: 1,
    });
  });

  it('refuses the click it can no longer refuse natively', () => {
    const { fixture, host, btn } = build();
    fixture.componentInstance.why.set('Not while a job is running');
    fixture.detectChanges();
    btn.addEventListener('click', () => host.clicks++);
    btn.click();
    expect(host.clicks).toBe(0);

    fixture.componentInstance.off.set(false);
    fixture.detectChanges();
    btn.click();
    expect(host.clicks).toBe(1);
  });
});
