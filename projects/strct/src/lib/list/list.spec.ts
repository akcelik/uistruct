import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  StrctList,
  StrctListItem,
  StrctListItemDescription,
  StrctListItemLeading,
  StrctListItemMeta,
  StrctListItemTrailing,
} from './list';

describe('StrctList / StrctListItem (FR-48-24)', () => {
  @Component({
    imports: [
      StrctList,
      StrctListItem,
      StrctListItemLeading,
      StrctListItemDescription,
      StrctListItemMeta,
      StrctListItemTrailing,
    ],
    template: `
      <strct-list [dense]="dense()" [dividers]="dividers()" label="Active alarms">
        <strct-list-item
          interactive
          status="critical"
          [selected]="true"
          (activated)="opened.push('a1')"
        >
          <span strctListItemLeading class="lead">Critical</span>
          Datastore latency
          <span strctListItemDescription>ds-prod-01</span>
          <span strctListItemMeta>2 min ago</span>
          <button strctListItemTrailing class="ack" (click)="acked.push('a1')">Acknowledge</button>
        </strct-list-item>
        <strct-list-item>Quiet row</strct-list-item>
      </strct-list>
    `,
  })
  class Host {
    readonly dense = signal(false);
    readonly dividers = signal(true);
    opened: string[] = [];
    acked: string[] = [];
  }

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('is a list of listitems with the slots in their places', () => {
    const { el } = setup();
    expect(el.querySelector('[role="list"]')!.getAttribute('aria-label')).toBe('Active alarms');
    const items = el.querySelectorAll('[role="listitem"]');
    expect(items.length).toBe(2);
    const first = items[0];
    expect(first.querySelector('.strct-li__leading .lead')).toBeTruthy();
    expect(first.querySelector('.strct-li__title')!.textContent!.trim()).toBe('Datastore latency');
    expect(first.querySelector('.strct-li__desc')!.textContent!.trim()).toBe('ds-prod-01');
    expect(first.querySelector('.strct-li__meta')!.textContent!.trim()).toBe('2 min ago');
    // The trailing control sits OUTSIDE the activatable area, so it is its own
    // tab stop rather than part of "open this row".
    expect(first.querySelector('.strct-li__main .ack')).toBeNull();
    expect(first.querySelector('.strct-li__trailing .ack')).toBeTruthy();
  });

  it('an interactive row activates by click, Enter and Space; a plain row does not', () => {
    const { fixture, host, el } = setup();
    const [first, second] = [...el.querySelectorAll<HTMLElement>('.strct-li__main')];
    expect(first.getAttribute('role')).toBe('button');
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(second.hasAttribute('role')).toBe(false);
    expect(second.hasAttribute('tabindex')).toBe(false);

    first.click();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    first.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    second.click();
    fixture.detectChanges();
    expect(host.opened).toEqual(['a1', 'a1', 'a1']);
  });

  it('selected marks the current row for assistive tech', () => {
    const { el } = setup();
    expect(el.querySelector('.strct-li__main')!.getAttribute('aria-current')).toBe('true');
    expect(el.querySelectorAll('.strct-li--selected').length).toBe(1);
  });

  it('status draws the rail without touching the row content', () => {
    const { el } = setup();
    const first = el.querySelector('.strct-li')!;
    expect(first.classList).toContain('strct-li--status');
    expect(first.getAttribute('data-status')).toBe('critical');
  });

  it('dense and dividers are host-level switches', () => {
    const { fixture, host, el } = setup();
    const list = el.querySelector('.strct-list')!;
    expect(list.classList).toContain('strct-list--dividers');
    expect(list.classList).not.toContain('strct-list--dense');
    host.dense.set(true);
    host.dividers.set(false);
    fixture.detectChanges();
    expect(list.classList).toContain('strct-list--dense');
    expect(list.classList).not.toContain('strct-list--dividers');
  });

  it('emptyText appears only when the list has no items', () => {
    const { el } = setup();
    expect(el.querySelector('.strct-list__empty')).toBeNull();

    const fixture = TestBed.createComponent(StrctList);
    fixture.componentRef.setInput('emptyText', 'No alarms');
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.strct-list__empty')!
        .textContent!.trim(),
    ).toBe('No alarms');
  });
});
