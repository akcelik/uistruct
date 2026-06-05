import { TestBed } from '@angular/core/testing';
import { StrctWizard } from './wizard';

describe('StrctWizard', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctWizard);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-wiz');
  });
});
