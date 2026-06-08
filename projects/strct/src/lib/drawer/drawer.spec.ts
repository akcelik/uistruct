import { TestBed } from '@angular/core/testing';
import { StrctDrawer } from './drawer';

describe('StrctDrawer', () => {
  it('renders nothing when closed', () => {
    const f = TestBed.createComponent(StrctDrawer);
    f.detectChanges();

    expect((f.nativeElement as HTMLElement).querySelector('.strct-drawer')).toBeNull();
  });

  it('renders the panel with the side + size modifier classes when open', () => {
    const f = TestBed.createComponent(StrctDrawer);
    f.componentRef.setInput('open', true);
    f.componentRef.setInput('side', 'start');
    f.componentRef.setInput('size', 'lg');
    f.detectChanges();

    const panel = (f.nativeElement as HTMLElement).querySelector('.strct-drawer');
    expect(panel).not.toBeNull();
    expect(panel!.classList).toContain('strct-drawer--start');
    expect(panel!.classList).toContain('strct-drawer--lg');
  });

  it('close() sets open to false and removes the panel', () => {
    const f = TestBed.createComponent(StrctDrawer);
    f.componentRef.setInput('open', true);
    f.detectChanges();

    f.componentInstance.close();
    f.detectChanges();

    expect(f.componentInstance.open()).toBe(false);
    expect((f.nativeElement as HTMLElement).querySelector('.strct-drawer')).toBeNull();
  });
});
