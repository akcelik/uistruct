import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctStack, StrctStackItem } from './stack';

describe('StrctStack', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctStack);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-stack');
  });

  it('renders a real description list', () => {
    const fixture = TestBed.createComponent(StrctStack);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('dl.strct-stack__list'),
    ).toBeTruthy();
  });
});

describe('StrctStackItem', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctStackItem);
    fixture.componentRef.setInput('label', 'Key');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-stack__item');
  });

  // BUG-49-05, again: <dl> allows only dt/dd pairs or <div> wrappers.
  it('works as div[strctStackItem], so the list keeps a valid content model', () => {
    @Component({
      imports: [StrctStack, StrctStackItem],
      changeDetection: ChangeDetectionStrategy.Eager,
      template: `
        <strct-stack>
          <div strctStackItem label="Cluster">Prod-B</div>
          <div strctStackItem label="Uptime">201 days</div>
        </strct-stack>
      `,
    })
    class Host {}

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const dl = (fixture.nativeElement as HTMLElement).querySelector('dl')!;
    // Every child of the <dl> is a <div> wrapping exactly one dt + one dd.
    const rows = [...dl.children];
    expect(rows.length).toBe(2);
    for (const row of rows) {
      expect(row.tagName).toBe('DIV');
      expect(row.classList).toContain('strct-stack__item');
      expect([...row.children].map((c) => c.tagName)).toEqual(['DT', 'DD']);
    }
    expect(rows[0].querySelector('dt')!.textContent).toContain('Cluster');
    expect(rows[0].querySelector('dd')!.textContent).toContain('Prod-B');
  });

  it('renders the label as dt and the value as dd', () => {
    const fixture = TestBed.createComponent(StrctStackItem);
    fixture.componentRef.setInput('label', 'Key');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('dt.strct-stack__label')?.textContent).toContain('Key');
    expect(el.querySelector('dd.strct-stack__value')).toBeTruthy();
  });
});
