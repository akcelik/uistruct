import { TestBed } from '@angular/core/testing';
import { StrctAvatar } from './avatar';

describe('StrctAvatar', () => {
  it('applies the strct-av host class', () => {
    const fixture = TestBed.createComponent(StrctAvatar);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-av');
  });

  it('applies the sm modifier class when size is sm', () => {
    const fixture = TestBed.createComponent(StrctAvatar);
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-av--sm');
  });

  it('applies the lg modifier class when size is lg', () => {
    const fixture = TestBed.createComponent(StrctAvatar);
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-av--lg');
  });
});
