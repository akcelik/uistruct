import { TestBed } from '@angular/core/testing';
import { StrctSkeleton } from './skeleton';

describe('StrctSkeleton', () => {
  it('applies the strct-skel host class', () => {
    const fixture = TestBed.createComponent(StrctSkeleton);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-skel');
  });
});
