import { TestBed } from '@angular/core/testing';
import { StrctLegend, StrctLegendItem } from './legend';

const ITEMS: StrctLegendItem[] = [
  { label: 'Running', value: 12, status: 'success', shape: 'dot' },
  { label: 'Migrating', value: 3, color: 'var(--c2)', shape: 'dash' },
  { label: 'Failed', value: 0, status: 'critical', muted: true },
];

function build(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(StrctLegend);
  fixture.componentRef.setInput('items', ITEMS);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('StrctLegend', () => {
  it('renders a list of rows with their swatch shape and value', () => {
    const { el } = build();
    expect(el.querySelector('[role="list"]')).toBeTruthy();
    const rows = el.querySelectorAll('.strct-legend__row');
    expect(rows.length).toBe(3);
    expect(rows[0].querySelector('.strct-legend__swatch')?.classList).toContain(
      'strct-legend__swatch--dot',
    );
    expect(rows[1].querySelector('.strct-legend__swatch')?.classList).toContain(
      'strct-legend__swatch--dash',
    );
    // no shape given → a square
    expect(rows[2].querySelector('.strct-legend__swatch')?.classList).toContain(
      'strct-legend__swatch--square',
    );
    expect(rows[0].querySelector('.strct-legend__value')?.textContent?.trim()).toBe('12');
  });

  it('keeps a zero category, quietly', () => {
    const { el } = build();
    const zero = el.querySelectorAll('.strct-legend__row')[2];
    expect(zero.textContent).toContain('Failed');
    expect(zero.textContent).toContain('0');
    expect(zero.classList).toContain('strct-legend__row--muted');
  });

  it('paints the swatch from status or an explicit colour', () => {
    const { el } = build();
    const swatches = el.querySelectorAll<HTMLElement>('.strct-legend__swatch');
    expect(swatches[0].style.getPropertyValue('--strct-legend-color')).toBe('var(--success)');
    expect(swatches[1].style.getPropertyValue('--strct-legend-color')).toBe('var(--c2)');
  });

  it('is plain text until interactive, then a toggle per row', () => {
    expect(build().el.querySelector('button')).toBeNull();
    const { fixture, el } = build({ interactive: true });
    const buttons = el.querySelectorAll('button.strct-legend__hit');
    expect(buttons.length).toBe(3);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    let toggled = '';
    fixture.componentInstance.itemToggle.subscribe((label) => (toggled = label));
    (buttons[1] as HTMLElement).click();
    expect(toggled).toBe('Migrating');
  });

  it('marks a switched-off row with aria-pressed="false"', () => {
    const fixture = TestBed.createComponent(StrctLegend);
    fixture.componentRef.setInput('items', [{ label: 'CPU', off: true }]);
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('button')?.getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('stacks when vertical', () => {
    expect((build({ orientation: 'vertical' }).el as HTMLElement).classList).toContain(
      'strct-legend--vertical',
    );
  });
});
