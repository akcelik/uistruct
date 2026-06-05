import { TestBed } from '@angular/core/testing';
import { StrctIcon, STRCT_ICONS } from './icon';

describe('StrctIcon', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctIcon);
    fixture.componentRef.setInput('name', 'host');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-icon');
  });

  it('renders the named icon', () => {
    const fixture = TestBed.createComponent(StrctIcon);
    fixture.componentRef.setInput('name', 'host');
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('sets aria-label when ariaLabel is provided', () => {
    const fixture = TestBed.createComponent(StrctIcon);
    fixture.componentRef.setInput('name', 'host');
    fixture.componentRef.setInput('ariaLabel', 'A host icon');
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('A host icon');
    expect(svg?.getAttribute('aria-hidden')).toBeNull();
  });

  it('hides the icon from assistive tech when ariaLabel is empty', () => {
    const fixture = TestBed.createComponent(StrctIcon);
    fixture.componentRef.setInput('name', 'host');
    fixture.componentRef.setInput('ariaLabel', '');
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders new action icons', () => {
    const actionIcons = [
      'plus',
      'minus',
      'pencil',
      'trash',
      'refresh',
      'filter',
      'settings',
      'user',
    ];
    for (const name of actionIcons) {
      const fixture = TestBed.createComponent(StrctIcon);
      fixture.componentRef.setInput('name', name);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).toBeTruthy();
    }
  });

  it('renders new infrastructure icons', () => {
    const infraIcons = [
      'pod',
      'deployment',
      'service',
      'node',
      'ingress',
      'cloud',
      'container',
      'firewall',
    ];
    for (const name of infraIcons) {
      const fixture = TestBed.createComponent(StrctIcon);
      fixture.componentRef.setInput('name', name);
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).toBeTruthy();
    }
  });

  it('renders composite eyeOff using the eye base path', () => {
    expect(STRCT_ICONS['eyeOff']).toContain(STRCT_ICONS['eye']);
    expect(STRCT_ICONS['eyeOff']).toContain('M2.5 2.5l11 11');
  });

  it('renders composite bellOff using the bell base path', () => {
    expect(STRCT_ICONS['bellOff']).toContain(STRCT_ICONS['bell']);
    expect(STRCT_ICONS['bellOff']).toContain('M2.6 2.6l10.8 10.8');
  });
});
