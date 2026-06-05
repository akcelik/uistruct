import { TestBed } from '@angular/core/testing';
import { StrctSignpost } from './signpost';

describe('StrctSignpost', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctSignpost);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-sp');
  });
});
