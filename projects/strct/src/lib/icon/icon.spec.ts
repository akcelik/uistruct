import { TestBed } from '@angular/core/testing';
import { StrctIcon, STRCT_ICONS, STRCT_ICON_GROUPS, STRCT_ICON_NAMES } from './icon';

describe('StrctIcon', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctIcon);
    fixture.componentRef.setInput('name', 'host');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-icon');
  });

  it('renders every badge variant with its state class (incl. the new paused)', () => {
    for (const badge of ['success', 'warning', 'critical', 'running', 'paused', 'off', 'info']) {
      const fixture = TestBed.createComponent(StrctIcon);
      fixture.componentRef.setInput('name', 'vm');
      fixture.componentRef.setInput('badge', badge);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.strct-icon__badge');
      expect(el?.classList).toContain(`strct-icon__badge--${badge}`);
    }
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

  it('renders the new storage, hardware, AI and peripheral icons', () => {
    const names = [
      'opticalDisc',
      'ssd',
      'usb',
      'sdCard',
      'tape',
      'gpu',
      'psu',
      'fan',
      'battery',
      'ups',
      'motherboard',
      'sensor',
      'thermometer',
      'sparkles',
      'brain',
      'robot',
      'neuralNetwork',
      'aiChip',
      'wand',
      'model',
      'router',
      'loadBalancer',
      'wifi',
      'bluetooth',
      'monitor',
      'keyboard',
      'printer',
    ];
    for (const name of names) {
      expect(STRCT_ICONS[name]).toBeTruthy();
      const fixture = TestBed.createComponent(StrctIcon);
      fixture.componentRef.setInput('name', name);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
    }
  });

  it('registers the plain file and clipboard icons and groups them', () => {
    for (const name of ['file', 'clipboard']) {
      expect(STRCT_ICONS[name]).toBeTruthy();
      const fixture = TestBed.createComponent(StrctIcon);
      fixture.componentRef.setInput('name', name);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
    }
    const grouped = new Set<string>(STRCT_ICON_GROUPS.flatMap((g) => g.names));
    expect(grouped.has('file')).toBe(true);
    expect(grouped.has('clipboard')).toBe(true);
  });

  it('registers the time/comms/view/identity additions and repairs (0.21.0)', () => {
    const names = [
      'clock',
      'history',
      'timer',
      'hourglass',
      'help',
      'home',
      'link',
      'globe',
      'star',
      'pin',
      'share',
      'archive',
      'mail',
      'chat',
      'zoomIn',
      'zoomOut',
      'fullscreen',
      'exitFullscreen',
      'listView',
      'dragHandle',
      'chevronUp',
      'chevronDoubleLeft',
      'chevronDoubleUp',
      'chevronDoubleDown',
      'dns',
      'vpn',
      'api',
      'bolt',
      'queue',
      'users',
      'login',
      'unlock',
      'ban',
      'wifiOff',
      'cloudOff',
      'linkOff',
    ];
    for (const name of names) {
      expect(STRCT_ICONS[name]).toBeTruthy();
      const fixture = TestBed.createComponent(StrctIcon);
      fixture.componentRef.setInput('name', name);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
    }
    // Semantic aliases resolve to the same markup.
    expect(STRCT_ICONS['unlink']).toBe(STRCT_ICONS['linkOff']);
    expect(STRCT_ICONS['webhook']).toBe(STRCT_ICONS['bolt']);
    // Off composites reuse their base glyphs.
    expect(STRCT_ICONS['wifiOff']).toContain(STRCT_ICONS['wifi']);
    expect(STRCT_ICONS['cloudOff']).toContain(STRCT_ICONS['cloud']);
  });

  it('groups every new icon in STRCT_ICON_GROUPS', () => {
    const grouped = new Set<string>(STRCT_ICON_GROUPS.flatMap((g) => g.names));
    for (const name of ['opticalDisc', 'gpu', 'sparkles', 'router']) {
      expect(grouped.has(name)).toBe(true);
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

  it('ships shieldCheck (the 2FA-on state) sharing the shield silhouette', () => {
    expect(STRCT_ICONS['shieldCheck']).toBeTruthy();
    expect(STRCT_ICONS['shieldCheck']).toContain('M8 2.3l5.2 1.9');
    const fixture = TestBed.createComponent(StrctIcon);
    fixture.componentRef.setInput('name', 'shieldCheck');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg path')).toBeTruthy();
    const grouped = new Set<string>(STRCT_ICON_GROUPS.flatMap((g) => g.names));
    expect(grouped.has('shieldCheck')).toBe(true);
  });

  it('STRCT_ICON_NAMES lists every built-in name, sorted, matching the registry', () => {
    expect(STRCT_ICON_NAMES.length).toBe(Object.keys(STRCT_ICONS).length);
    expect([...STRCT_ICON_NAMES]).toEqual([...STRCT_ICON_NAMES].sort());
    for (const name of STRCT_ICON_NAMES) expect(STRCT_ICONS[name]).toBeTruthy();
    // Every documented group entry is a real registered icon.
    for (const g of STRCT_ICON_GROUPS) {
      for (const name of g.names) expect(STRCT_ICONS[name], name).toBeTruthy();
    }
  });

  it('strictName renders like name and wins when both are set', () => {
    const fixture = TestBed.createComponent(StrctIcon);
    fixture.componentRef.setInput('strictName', 'rocket');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg path')).toBeTruthy();
    fixture.componentRef.setInput('name', 'host');
    fixture.componentRef.setInput('strictName', 'shieldCheck');
    fixture.detectChanges();
    const html = fixture.nativeElement.querySelector('svg')!.innerHTML;
    expect(html).toContain('M8 2.3l5.2 1.9'); // the shield silhouette, not host
  });

  it('an unset name (empty string) renders empty without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fixture = TestBed.createComponent(StrctIcon);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg')?.innerHTML.trim()).toBeFalsy();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns once (dev mode) on an unknown icon name and renders empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (let i = 0; i < 3; i++) {
      const fixture = TestBed.createComponent(StrctIcon);
      fixture.componentRef.setInput('name', 'sheildCheck'); // typo on purpose
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg')?.innerHTML.trim()).toBeFalsy();
    }
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('sheildCheck');
    warn.mockRestore();
  });
});
