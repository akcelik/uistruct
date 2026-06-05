import { TestBed } from '@angular/core/testing';
import { StrctShell, StrctHeader, StrctFooter, StrctShellService } from './layout';
import { StrctVerticalNav } from './nav';

describe('StrctShell', () => {
  it('applies the strct-shell host class', () => {
    const fixture = TestBed.createComponent(StrctShell);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-shell');
  });
});

describe('StrctHeader', () => {
  it('applies the strct-header host class', () => {
    TestBed.configureTestingModule({ providers: [StrctShellService] });
    const fixture = TestBed.createComponent(StrctHeader);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-header');
  });
});

describe('StrctFooter', () => {
  it('applies the strct-footer host class', () => {
    const fixture = TestBed.createComponent(StrctFooter);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-footer');
  });
});

describe('StrctVerticalNav', () => {
  it('applies the strct-vnav host class', () => {
    TestBed.configureTestingModule({ providers: [StrctShellService] });
    const fixture = TestBed.createComponent(StrctVerticalNav);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-vnav');
  });
});
