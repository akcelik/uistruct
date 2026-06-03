import { TestBed } from '@angular/core/testing';
import { StrctThemeService } from './theme.service';

describe('StrctThemeService', () => {
  let service: StrctThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-palette');
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(StrctThemeService);
  });

  it('defaults to arctic / dark and reflects it on the root element', () => {
    expect(service.palette()).toBe('arctic');
    expect(service.mode()).toBe('dark');
    expect(document.documentElement.getAttribute('data-palette')).toBe('arctic');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('setPalette updates the signal, the attribute and storage', () => {
    service.setPalette('ember');
    expect(service.palette()).toBe('ember');
    expect(document.documentElement.getAttribute('data-palette')).toBe('ember');
    expect(localStorage.getItem('strct-palette')).toBe('ember');
  });

  it('toggleMode flips between dark and light', () => {
    service.setMode('dark');
    service.toggleMode();
    expect(service.mode()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
