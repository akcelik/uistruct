import { TestBed } from '@angular/core/testing';
import { StrctSpeedDial } from './speed-dial';

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
});
