import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StrctTab, StrctTabs } from './tabs';

@Component({
  imports: [StrctTabs, StrctTab],
  template: `<strct-tabs>
    <strct-tab label="A">AA</strct-tab>
    <strct-tab label="B">BB</strct-tab>
  </strct-tabs>`,
})
class HostComponent {}

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
});
