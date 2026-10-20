import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StrctDesc, StrctDescItem, StrctDescriptionList } from './description-list';

@Component({
  imports: [StrctDescriptionList, StrctDesc],
  changeDetection: ChangeDetectionStrategy.Eager,
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

  it('uses real description-list semantics (dl/dt/dd)', () => {
    const host = setup();
    const list = host.querySelector('dl.strct-dl__list');
    expect(list).toBeTruthy();
    const row = list!.querySelector('div.strct-desc')!;
    expect(row.querySelector('dt.strct-desc__label')?.textContent).toContain('Gateway');
    expect(row.querySelector('dd.strct-desc__value')?.textContent).toContain('172.16.75.2');
    const projected = list!.querySelector('strct-desc')!;
    expect(projected.querySelector('dt.strct-desc__label')?.textContent).toContain('Projected');
    expect(projected.querySelector('dd.strct-desc__value')).toBeTruthy();
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

  // FR-48-25
  describe('grid alignment, status and a note', () => {
    it('lays the rows out as one label column', () => {
      const fixture = TestBed.createComponent(StrctDescriptionList);
      fixture.componentRef.setInput('items', [
        { label: 'IPv4', value: '172.16.75.100' },
        { label: 'Gateway address', value: '172.16.75.2' },
      ]);
      fixture.componentRef.setInput('align', 'grid');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.classList).toContain('strct-dl--grid');
      fixture.componentRef.setInput('labelWidth', '160px');
      fixture.detectChanges();
      expect(el.style.getPropertyValue('--strct-dl-label-w')).toBe('160px');
    });

    it('renders a status dot, an icon and a note on a row', () => {
      const fixture = TestBed.createComponent(StrctDesc);
      fixture.componentRef.setInput('label', 'Agent');
      fixture.componentRef.setInput('status', 'success');
      fixture.componentRef.setInput('icon', 'host');
      fixture.componentRef.setInput('note', 'last seen 12 s ago');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.strct-desc__label strct-status-dot')).toBeTruthy();
      expect(el.querySelector('.strct-desc__label strct-icon')).toBeTruthy();
      expect(el.querySelector('.strct-desc__note')?.textContent).toContain('last seen 12 s ago');
      expect(el.querySelector('.strct-desc__label')?.textContent).toContain('Agent');
    });

    it('is a plain row without them', () => {
      const fixture = TestBed.createComponent(StrctDesc);
      fixture.componentRef.setInput('label', 'IPv4');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('strct-status-dot')).toBeNull();
      expect(el.querySelector('.strct-desc__note')).toBeNull();
    });
  });

  // BUG-49-05 — <dl> allows only dt/dd pairs or <div> wrappers as children.
  it('works as div[strctDesc], so a list keeps a valid content model', () => {
    @Component({
      imports: [StrctDescriptionList, StrctDesc],
      changeDetection: ChangeDetectionStrategy.Eager,
      template: `
        <strct-description-list>
          <div strctDesc label="IPv4" mono>172.16.75.100</div>
          <div strctDesc label="Gateway">172.16.75.2</div>
        </strct-description-list>
      `,
    })
    class DivHost {}

    const fixture = TestBed.createComponent(DivHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const dl = el.querySelector('dl') as HTMLElement;
    // every child of the <dl> is a div — no custom element between it and its pairs
    expect([...dl.children].every((c) => c.tagName === 'DIV')).toBe(true);
    expect(dl.querySelectorAll('dt').length).toBe(2);
    expect(dl.querySelectorAll('dd').length).toBe(2);
    expect(dl.querySelector('dt')?.textContent).toContain('IPv4');
    expect(dl.querySelector('dd')?.textContent).toContain('172.16.75.100');
  });
});

// FR-59-06: a value that is a destination is the link itself, instead of an
// <a> hand-made inside the slot.
describe('StrctDesc — a value that is a link', () => {
  @Component({
    imports: [StrctDesc],
    template: `
      <strct-desc label="Now" [href]="href()" [target]="target()">1.4.2</strct-desc>
      <strct-desc label="Plain">1.4.1</strct-desc>
    `,
  })
  class Host {
    href = signal('/updates/1.4.2');
    target = signal('');
  }

  const build = () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };

  it('wraps the whole value, and leaves a plain value alone', () => {
    const { el } = build();
    const link = el.querySelector<HTMLAnchorElement>('.strct-desc__value a.strct-desc__link')!;
    expect(link.getAttribute('href')).toBe('/updates/1.4.2');
    expect(link.textContent!.trim()).toBe('1.4.2');
    const plain = el.querySelectorAll('.strct-desc')[1];
    expect(plain.querySelector('a')).toBeNull();
    expect(plain.querySelector('.strct-desc__value')!.textContent!.trim()).toBe('1.4.1');
  });

  it('a new tab gets no handle on the opener', () => {
    const { fixture, el } = build();
    fixture.componentInstance.target.set('_blank');
    fixture.detectChanges();
    const link = el.querySelector('a.strct-desc__link')!;
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('routes when the destination is a routerLink', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', children: [] }])] });
    const fixture = TestBed.createComponent(StrctDesc);
    fixture.componentRef.setInput('label', 'Now');
    fixture.componentRef.setInput('routerLink', '/updates/1.4.2');
    fixture.detectChanges();
    const link = (fixture.nativeElement as HTMLElement).querySelector('a.strct-desc__link')!;
    expect(link.getAttribute('href')).toBe('/updates/1.4.2');
  });
});
