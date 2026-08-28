import { TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { StrctSpeedDial } from './speed-dial';

@Component({
  standalone: true,
  imports: [StrctSpeedDial],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-speed-dial>
      <button type="button" class="action">Snapshot</button>
    </strct-speed-dial>
  `,
})
class SpeedDialHost {}

function fab(fixture: { nativeElement: HTMLElement }): HTMLButtonElement {
  return fixture.nativeElement.querySelector('.strct-sd__fab') as HTMLButtonElement;
}

describe('StrctSpeedDial', () => {
  it('applies the strct-sd-host host class', () => {
    const fixture = TestBed.createComponent(StrctSpeedDial);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-sd-host');
  });

  it('toggles open state', () => {
    const fixture = TestBed.createComponent(StrctSpeedDial);
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(false);

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('gives the icon-only FAB an accessible name', () => {
    const fixture = TestBed.createComponent(StrctSpeedDial);
    fixture.detectChanges();

    expect(fab(fixture).getAttribute('aria-label')).toBe('Actions');

    fixture.componentRef.setInput('ariaLabel', 'More actions');
    fixture.detectChanges();

    expect(fab(fixture).getAttribute('aria-label')).toBe('More actions');
  });

  it('exposes aria-expanded but does not claim menu semantics', () => {
    const fixture = TestBed.createComponent(StrctSpeedDial);
    fixture.detectChanges();

    expect(fab(fixture).getAttribute('aria-haspopup')).toBeNull();
    expect(fab(fixture).getAttribute('aria-expanded')).toBe('false');

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(fab(fixture).getAttribute('aria-expanded')).toBe('true');
  });

  it('closes when a projected action is activated', () => {
    const fixture = TestBed.createComponent(SpeedDialHost);
    fixture.detectChanges();

    const dial = fixture.nativeElement.querySelector('strct-speed-dial');
    const component = fixture.debugElement.query(By.directive(StrctSpeedDial))
      .componentInstance as StrctSpeedDial;
    component.open.set(true);
    fixture.detectChanges();

    (dial.querySelector('.action') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.open()).toBe(false);
  });

  it('closes on Escape and hands focus back to the FAB', () => {
    const fixture = TestBed.createComponent(StrctSpeedDial);
    fixture.detectChanges();

    fab(fixture).focus();
    fab(fixture).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(fab(fixture));
  });

  it('stops Escape propagation so a host overlay does not also close', () => {
    const fixture = TestBed.createComponent(StrctSpeedDial);
    fixture.detectChanges();

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    const stopSpy = vi.spyOn(event, 'stopPropagation');
    document.dispatchEvent(event);

    expect(stopSpy).toHaveBeenCalled();
  });

  it('ignores Escape while closed', () => {
    const fixture = TestBed.createComponent(StrctSpeedDial);
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    const stopSpy = vi.spyOn(event, 'stopPropagation');
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(stopSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
