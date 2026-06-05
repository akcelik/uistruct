import { TestBed } from '@angular/core/testing';
import { StrctLogin } from './login';

describe('StrctLogin', () => {
  it('applies the strct-login host class', () => {
    const fixture = TestBed.createComponent(StrctLogin);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-login');
  });
});
