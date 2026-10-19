import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctTag, StrctTagLeading } from './tag';

describe('StrctTag', () => {
  it('renders a remove button when removable and emits on click', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('removable', true);
    fixture.detectChanges();

    let removed = false;
    fixture.componentInstance.removed.subscribe(() => (removed = true));

    const btn = fixture.nativeElement.querySelector('.strct-tag__remove') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(removed).toBe(true);
  });

  it('omits the remove button by default', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-tag__remove')).toBeNull();
  });

  it('hides the remove button when disabled', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('removable', true);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-tag__remove')).toBeNull();
  });

  it('uses removeLabel as the remove button aria-label', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('removable', true);
    fixture.componentRef.setInput('removeLabel', 'Entfernen');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.strct-tag__remove') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Entfernen');
  });

  // FR-48-03 — the body is the control for the thing the tag names.
  it('activates on click, Enter and Space when interactive', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    let n = 0;
    fixture.componentInstance.activated.subscribe(() => n++);
    const body = fixture.nativeElement.querySelector('.strct-tag__text') as HTMLElement;
    expect(body.getAttribute('role')).toBe('button');
    expect(body.getAttribute('tabindex')).toBe('0');
    body.click();
    body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(n).toBe(3);
  });

  it('keeps the body inert by default and never activates when disabled', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('.strct-tag__text') as HTMLElement;
    expect(body.getAttribute('role')).toBeNull();
    expect(body.getAttribute('tabindex')).toBeNull();
    let n = 0;
    fixture.componentInstance.activated.subscribe(() => n++);
    body.click();
    fixture.componentRef.setInput('interactive', true);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    body.click();
    expect(n).toBe(0);
  });

  it('removing does not activate, and activating does not remove', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('interactive', true);
    fixture.componentRef.setInput('removable', true);
    fixture.detectChanges();
    let activated = 0;
    let removed = 0;
    fixture.componentInstance.activated.subscribe(() => activated++);
    fixture.componentInstance.removed.subscribe(() => removed++);
    (fixture.nativeElement.querySelector('.strct-tag__remove') as HTMLElement).click();
    expect([activated, removed]).toEqual([0, 1]);
    (fixture.nativeElement.querySelector('.strct-tag__text') as HTMLElement).click();
    expect([activated, removed]).toEqual([1, 1]);
  });

  it('marks the pill shape and mono on the host', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('shape', 'pill');
    fixture.componentRef.setInput('mono', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList).toContain('strct-tag--pill');
    expect(el.classList).toContain('strct-tag--mono');
  });
});

// FR-49-07 — the tag's name says what it is; activateLabel says what pressing it does.
describe('StrctTag — activateLabel', () => {
  const body = (f: { nativeElement: HTMLElement }) =>
    f.nativeElement.querySelector('.strct-tag__text') as HTMLElement;

  it('names the body only when the tag is interactive', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('activateLabel', 'Show the console of APP02');
    fixture.detectChanges();
    // Not interactive: there is no button to name.
    expect(body(fixture).getAttribute('aria-label')).toBeNull();

    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    expect(body(fixture).getAttribute('role')).toBe('button');
    expect(body(fixture).getAttribute('aria-label')).toBe('Show the console of APP02');
  });

  it('leaves the text as the name when no label is given, and keeps removeLabel apart', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.componentRef.setInput('interactive', true);
    fixture.componentRef.setInput('removable', true);
    fixture.componentRef.setInput('removeLabel', 'Disconnect APP02');
    fixture.detectChanges();
    expect(body(fixture).getAttribute('aria-label')).toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.strct-tag__remove')!
        .getAttribute('aria-label'),
    ).toBe('Disconnect APP02');
  });
});

// FR-51 (chat) — an object chip opens the object's page, like any link.
describe('StrctTag — href', () => {
  it('renders its body as a link, with the rel a new tab needs', () => {
    const fixture = TestBed.createComponent(StrctTag);
    fixture.detectChanges();
    const el = () => fixture.nativeElement as HTMLElement;
    expect(el().querySelector('a')).toBeNull();

    fixture.componentRef.setInput('href', '/vms/web-01');
    fixture.componentRef.setInput('activateLabel', 'Open web-01');
    fixture.detectChanges();
    const a = el().querySelector('a.strct-tag__text')!;
    expect(a.getAttribute('href')).toBe('/vms/web-01');
    expect(a.getAttribute('aria-label')).toBe('Open web-01');
    expect(a.getAttribute('rel')).toBeNull();

    fixture.componentRef.setInput('target', '_blank');
    fixture.detectChanges();
    expect(el().querySelector('a')!.getAttribute('rel')).toBe('noopener noreferrer');

    // A disabled tag is not a link.
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(el().querySelector('a')).toBeNull();
  });
});

// BUG-58-02 / BUG-58-07 — one content projection, whichever branch renders.
describe('StrctTag — the leading slot and the text reach the same branch', () => {
  @Component({
    imports: [StrctTag, StrctTagLeading],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
      <strct-tag class="plain"><span strctTagLeading class="lead">●</span>HV-NODE-01</strct-tag>
      <strct-tag class="act" interactive
        ><span strctTagLeading class="lead">●</span>HV-NODE-02</strct-tag
      >
      <strct-tag class="link" href="/objects/x"
        ><span strctTagLeading class="lead">●</span>HV-NODE-03</strct-tag
      >
    `,
  })
  class Host {}

  function build() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('draws the leading content in every branch', () => {
    const el = build();
    for (const cls of ['plain', 'act', 'link']) {
      const tag = el.querySelector(`.${cls}`)!;
      expect(tag.querySelector('.lead'), cls).toBeTruthy();
    }
  });

  it('keeps the text inside the link, not in the branch that is not rendered', () => {
    const el = build();
    const link = el.querySelector('.link a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/objects/x');
    // FR-51-04 shipped a chip whose link was empty: the text went to the span.
    expect(link.textContent!.replace(/\s+/g, ' ').trim()).toContain('HV-NODE-03');
    expect(el.querySelector('.plain')!.textContent!.trim()).toContain('HV-NODE-01');
  });
});
