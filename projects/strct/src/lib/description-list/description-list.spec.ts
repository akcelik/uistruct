import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctDesc, StrctDescItem, StrctDescriptionList } from './description-list';

@Component({
  imports: [StrctDescriptionList, StrctDesc],
  template: `
    <strct-description-list [items]="items" [inline]="inline" [align]="align">
      <strct-desc label="Projected" mono>value-here</strct-desc>
    </strct-description-list>
  `,
})
class HostComponent {
  items: StrctDescItem[] = [
    { label: 'Gateway', value: '172.16.75.2', mono: true },
    { label: 'Note', value: 'secondary', muted: true },
  ];
  inline = false;
  align: 'between' | 'start' = 'between';
}

function setup(patch: Partial<HostComponent> = {}) {
  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('strct-description-list') as HTMLElement;
}

describe('StrctDescriptionList', () => {
  it('renders rows from the items input', () => {
    const host = setup();
    const labels = [...host.querySelectorAll('div.strct-desc .strct-desc__label')].map(
      (el) => el.textContent,
    );
    expect(labels).toContain('Gateway');
    expect(host.textContent).toContain('172.16.75.2');
  });

  it('marks mono / muted item rows', () => {
    const host = setup();
    const rows = host.querySelectorAll('div.strct-desc');
    expect(rows[0].classList).toContain('strct-desc--mono');
    expect(rows[1].classList).toContain('strct-desc--muted');
  });

  it('also renders projected strct-desc rows alongside items', () => {
    const host = setup();
    const projected = host.querySelector('strct-desc');
    expect(projected?.classList).toContain('strct-desc');
    expect(projected?.classList).toContain('strct-desc--mono');
    expect(projected?.querySelector('.strct-desc__label')?.textContent).toContain('Projected');
  });

  it('toggles the inline (stat strip) layout class', () => {
    expect(setup({ inline: false }).classList).not.toContain('strct-dl--inline');
    expect(setup({ inline: true }).classList).toContain('strct-dl--inline');
  });

  it('toggles the start-align class', () => {
    expect(setup({ align: 'between' }).classList).not.toContain('strct-dl--start');
    expect(setup({ align: 'start' }).classList).toContain('strct-dl--start');
  });
});
