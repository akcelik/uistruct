import { TestBed } from '@angular/core/testing';
import { StrctTree, StrctTreeNode } from './tree';

describe('StrctTree', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctTree);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-tree');
  });
});

describe('StrctTreeNode', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctTreeNode);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-tnode');
  });
});
