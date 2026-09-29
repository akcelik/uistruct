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

  // FR-48-29
  it('renders an icon instead of initials, and squares on demand', () => {
    const fixture = TestBed.createComponent(StrctAvatar);
    fixture.componentRef.setInput('name', 'Platform Admins');
    fixture.componentRef.setInput('icon', 'users');
    fixture.componentRef.setInput('shape', 'square');
    fixture.componentRef.setInput('tone', 'accent-soft');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('strct-icon')).toBeTruthy();
    expect(el.querySelector('.strct-av__initials')).toBeNull();
    expect(el.classList).toContain('strct-av--square');
    expect(el.getAttribute('data-tone')).toBe('accent-soft');
  });

  it('keeps an image over an icon, and initials by default', () => {
    const fixture = TestBed.createComponent(StrctAvatar);
    fixture.componentRef.setInput('name', 'Ada Lovelace');
    fixture.componentRef.setInput('icon', 'users');
    fixture.componentRef.setInput('src', '/a.png');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('img')).toBeTruthy();
    expect(el.querySelector('strct-icon')).toBeNull();

    const plain = TestBed.createComponent(StrctAvatar);
    plain.componentRef.setInput('name', 'Ada Lovelace');
    plain.detectChanges();
    const p = plain.nativeElement as HTMLElement;
    expect(p.querySelector('.strct-av__initials')?.textContent?.trim()).toBe('AL');
    expect(p.classList).not.toContain('strct-av--square');
    expect(p.getAttribute('data-tone')).toBe('neutral');
  });
});
