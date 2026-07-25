import { Component, ElementRef, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctOverlay, StrctOverlayPlacement } from './overlay';

@Component({
  imports: [StrctOverlay],
  template: `
    <button #anchor>Anchor</button>
    <div [strctOverlay]="anchor" [strctOverlayPlacement]="placement">Panel</div>
  `,
})
class HostComponent {
  @ViewChild('anchor', { static: true }) anchor!: ElementRef<HTMLElement>;
  @ViewChild(StrctOverlay) overlay!: StrctOverlay;
  placement: StrctOverlayPlacement = 'bottom-start';
}

describe('StrctOverlay', () => {
  it('exists on the host element', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const div = fixture.nativeElement.querySelector('div');
    expect(div?.style?.position).toBe('fixed');
  });

  it('parses strctOverlayMatchWidth="false" as false (booleanAttribute)', () => {
    @Component({
      imports: [StrctOverlay],
      template: `
        <button #anchor>Anchor</button>
        <div [strctOverlay]="anchor" strctOverlayMatchWidth="false">Panel</div>
      `,
    })
    class MatchWidthHost {
      @ViewChild(StrctOverlay) overlay!: StrctOverlay;
    }

    const fixture = TestBed.createComponent(MatchWidthHost);
    fixture.detectChanges();
    expect(fixture.componentInstance.overlay.matchWidth()).toBe(false);
  });
});

describe('StrctOverlay — start/end placement', () => {
  // Anchor: left 100, right 300; panel: 60 wide, 40 tall.
  const anchorRect = {
    x: 100,
    y: 100,
    width: 200,
    height: 30,
    top: 100,
    right: 300,
    bottom: 130,
    left: 100,
    toJSON: () => ({}),
  } as DOMRect;

  function setup(placement: StrctOverlayPlacement, rtl: boolean) {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.placement = placement;
    fixture.detectChanges();

    const anchor = fixture.componentInstance.anchor.nativeElement;
    const panel = fixture.nativeElement.querySelector('div') as HTMLElement;
    anchor.style.direction = rtl ? 'rtl' : 'ltr';
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(anchorRect);
    Object.defineProperty(panel, 'offsetWidth', { value: 60, configurable: true });
    Object.defineProperty(panel, 'offsetHeight', { value: 40, configurable: true });

    fixture.detectChanges();
    fixture.componentInstance.overlay.position();
    return { anchor, panel };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aligns start to the left edge and end to the right edge in LTR', () => {
    expect(setup('bottom-start', false).panel.style.left).toBe('100px');
    expect(setup('bottom-end', false).panel.style.left).toBe('240px'); // 300 - 60
  });

  it('mirrors start/end to the anchor direction in RTL', () => {
    expect(setup('bottom-start', true).panel.style.left).toBe('240px');
    expect(setup('bottom-end', true).panel.style.left).toBe('100px');
  });

  it('keeps top placements mirrored the same way in RTL', () => {
    const { panel } = setup('top-start', true);
    expect(panel.style.left).toBe('240px');
    expect(panel.style.top).toBe('55px'); // 100 - 5 gap - 40
  });

  it('keeps left/right physical regardless of direction', () => {
    expect(setup('right', true).panel.style.left).toBe('305px'); // 300 + 5 gap
    expect(setup('left', true).panel.style.left).toBe('35px'); // 100 - 5 - 60
  });

  it('still clamps the mirrored offset into the viewport', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(240);
    const { panel } = setup('bottom-start', true);
    // Mirrored offset would be 240; clamp pulls it to 240 - 60 - 4 = 176.
    expect(panel.style.left).toBe('176px');
  });
});
