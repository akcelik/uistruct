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
});
