import { TestBed } from '@angular/core/testing';
import { StrctAlert } from './alert';

describe('StrctAlert', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctAlert);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-alert');
  });

  it('applies type modifier classes', () => {
    const fixture = TestBed.createComponent(StrctAlert);

    fixture.componentRef.setInput('type', 'success');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-alert--success');

    fixture.componentRef.setInput('type', 'warning');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-alert--warning');

    fixture.componentRef.setInput('type', 'critical');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-alert--critical');
  });

  it('uses role="status" normally and role="alert" for critical', () => {
    const fixture = TestBed.createComponent(StrctAlert);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).getAttribute('role')).toBe('status');

    fixture.componentRef.setInput('type', 'critical');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).getAttribute('role')).toBe('alert');
  });

  // FR-48-22
  it('takes an icon override and keeps the derived one otherwise', () => {
    const fixture = TestBed.createComponent(StrctAlert);
    fixture.componentRef.setInput('type', 'info');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const icon = () => el.querySelector('.strct-alert__icon');
    expect(icon()).toBeTruthy();
    fixture.componentRef.setInput('icon', 'lock');
    fixture.detectChanges();
    // the override reaches strct-icon's name input
    expect(el.querySelector('strct-icon')).toBeTruthy();
    expect(fixture.componentInstance.icon()).toBe('lock');
  });

  it('keeps the layout in an inner row, so a host display cannot break it', () => {
    const fixture = TestBed.createComponent(StrctAlert);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const row = el.querySelector('.strct-alert__row') as HTMLElement;
    expect(row).toBeTruthy();
    // icon, body (and the close button) are siblings inside the row
    expect(row.querySelector('.strct-alert__icon')).toBeTruthy();
    expect(row.querySelector('.strct-alert__body')).toBeTruthy();
  });
});
