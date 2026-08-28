import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StrctTab, StrctTabs } from './tabs';

@Component({
  imports: [StrctTabs, StrctTab],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<strct-tabs>
    <strct-tab label="A">AA</strct-tab>
    <strct-tab label="B">BB</strct-tab>
  </strct-tabs>`,
})
class HostComponent {}

@Component({
  imports: [StrctTabs, StrctTab],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<strct-tabs keepAlive>
    <strct-tab label="A">AA</strct-tab>
    <strct-tab label="B">BB</strct-tab>
  </strct-tabs>`,
})
class KeepAliveHostComponent {}

describe('StrctTabs', () => {
  it('shows the first tab by default and switches on select', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('AA');
    expect(el.textContent).not.toContain('BB');

    const tabs = fixture.debugElement.query(By.directive(StrctTabs)).componentInstance as StrctTabs;
    tabs.select(1);
    fixture.detectChanges();
    expect(el.textContent).toContain('BB');
    expect(el.textContent).not.toContain('AA');
  });

  it('moves selection with arrow keys, mirroring under RTL', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const bar = el.querySelector('.strct-tabs__bar') as HTMLElement;
    const tabs = fixture.debugElement.query(By.directive(StrctTabs)).componentInstance as StrctTabs;

    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(tabs.selectedIndex()).toBe(1);

    // RTL: ArrowRight moves backward.
    bar.style.direction = 'rtl';
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(tabs.selectedIndex()).toBe(0);
  });

  it('keeps the tablist out of the tab order; only the selected tab is focusable', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const bar = el.querySelector('.strct-tabs__bar') as HTMLElement;
    expect(bar.hasAttribute('tabindex')).toBe(false);

    const buttons = el.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
    expect(buttons[0].getAttribute('tabindex')).toBe('0');
    expect(buttons[1].getAttribute('tabindex')).toBe('-1');

    const tabs = fixture.debugElement.query(By.directive(StrctTabs)).componentInstance as StrctTabs;
    tabs.select(1);
    fixture.detectChanges();
    expect(buttons[0].getAttribute('tabindex')).toBe('-1');
    expect(buttons[1].getAttribute('tabindex')).toBe('0');
  });

  it('wires aria-controls/aria-labelledby between tabs and panels', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
    const panels = el.querySelectorAll<HTMLElement>('[role="tabpanel"]');
    expect(panels.length).toBe(2);

    buttons.forEach((button, i) => {
      const panel = panels[i];
      expect(button.id).toBeTruthy();
      expect(panel.id).toBeTruthy();
      expect(button.getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.getAttribute('aria-labelledby')).toBe(button.id);
    });
    expect(new Set([...panels].map((p) => p.id)).size).toBe(2);
  });

  it('keepAlive hides inactive panels instead of destroying them', () => {
    const fixture = TestBed.createComponent(KeepAliveHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    let panels = el.querySelectorAll<HTMLElement>('strct-tab');
    expect(panels.length).toBe(2);
    // Inactive content stays in the DOM, only hidden.
    expect(el.textContent).toContain('AA');
    expect(el.textContent).toContain('BB');
    expect(panels[0].hasAttribute('hidden')).toBe(false);
    expect(panels[1].hasAttribute('hidden')).toBe(true);

    const tabs = fixture.debugElement.query(By.directive(StrctTabs)).componentInstance as StrctTabs;
    tabs.select(1);
    fixture.detectChanges();
    panels = el.querySelectorAll<HTMLElement>('strct-tab');
    expect(panels.length).toBe(2);
    expect(el.textContent).toContain('BB');
    expect(panels[0].hasAttribute('hidden')).toBe(true);
    expect(panels[1].hasAttribute('hidden')).toBe(false);
  });
});
