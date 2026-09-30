import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctAlert } from '../alert/alert';
import { StrctBadge } from '../badge/badge';
import { StrctInput } from '../forms/input';
import { resetStrctDevWarnings } from './dev-warn';

/**
 * Writing a component the way a sibling component is written must not fail
 * silently — these are the exact misuses the audit found shipped.
 */
@Component({
  imports: [StrctAlert],
  changeDetection: ChangeDetectionStrategy.Eager,
  // `strct-button` and `strct-empty-state` have `variant`, so this reads right
  // and rendered nine info-blue boxes in the audited app.
  template: `<strct-alert variant="warning">Heads up</strct-alert>`,
})
class WrongAlert {}

@Component({
  imports: [StrctBadge],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<strct-badge size="sm">3</strct-badge>`,
})
class WrongBadge {}

@Component({
  imports: [StrctAlert],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<strct-alert type="warning" icon="lock">Fine</strct-alert>`,
})
class RightAlert {}

@Component({
  imports: [StrctInput],
  changeDetection: ChangeDetectionStrategy.Eager,
  // `<button strct-button>` is kebab-case, so this is what a consumer writes.
  template: `<input strct-input /><select strctInput></select>`,
})
class KebabInput {}

describe('dev-mode host checks (FR-48-42)', () => {
  let warnings: string[];
  let warn: typeof console.warn;

  beforeEach(() => {
    resetStrctDevWarnings();
    warnings = [];
    warn = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(String(args[0]));
  });
  afterEach(() => {
    console.warn = warn;
  });

  async function render(type: unknown) {
    const fixture = TestBed.createComponent(type as never);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('names the right input when a borrowed one is used', async () => {
    await render(WrongAlert);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('<strct-alert> has no "variant" input');
    expect(warnings[0]).toContain('"type"');
    expect(warnings[0]).toContain('info, success, warning, critical');
  });

  it('lists the component’s own inputs when there is more than one', async () => {
    await render(WrongBadge);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('<strct-badge> has no "size" input');
    expect(warnings[0]).toContain('"status"');
  });

  it('says nothing for valid usage', async () => {
    await render(RightAlert);
    expect(warnings).toEqual([]);
  });

  it('warns once, not once per change detection', async () => {
    const fixture = await render(WrongAlert);
    fixture.detectChanges();
    fixture.detectChanges();
    expect(warnings.length).toBe(1);
  });

  it('styles an input written the kebab-case way', async () => {
    const fixture = await render(KebabInput);
    const el = fixture.nativeElement as HTMLElement;
    expect((el.querySelector('input') as HTMLElement).classList).toContain('strct-control');
    expect((el.querySelector('select') as HTMLElement).classList).toContain('strct-control');
  });
});
