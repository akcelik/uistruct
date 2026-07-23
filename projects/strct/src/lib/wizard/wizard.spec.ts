import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctStep, StrctWizard, StrctWizardAside } from './wizard';

describe('StrctWizard', () => {
  it('applies the host class', () => {
    const fixture = TestBed.createComponent(StrctWizard);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-wiz');
  });
});

describe('StrctWizard vertical', () => {
  @Component({
    imports: [StrctWizard, StrctStep, StrctWizardAside],
    template: `
      <strct-wizard
        vertical
        title="Create virtual machine"
        [(current)]="current"
        (stepChange)="changes.push($event)"
      >
        <strct-step label="Identity" description="Name, environment">id</strct-step>
        <strct-step label="Placement" description="Cluster and template">pl</strct-step>
        <strct-step label="Review">rv</strct-step>
        <aside strctWizardAside class="live-summary">summary</aside>
      </strct-wizard>
    `,
  })
  class VHost {
    current = signal(0);
    changes: number[] = [];
  }

  function setup() {
    const fixture = TestBed.createComponent(VHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }
  const railSteps = (el: HTMLElement) => [
    ...el.querySelectorAll<HTMLButtonElement>('.strct-wiz__vstep'),
  ];
  const nextBtn = (el: HTMLElement) =>
    [...el.querySelectorAll<HTMLButtonElement>('.strct-wiz__foot button')].at(-1)!;

  it('renders the rail: title, progress counter, dashed-ring steps, aside', () => {
    const { el } = setup();
    expect(el.querySelector('.strct-wiz__vtitle')?.textContent?.trim()).toBe(
      'Create virtual machine',
    );
    expect(el.querySelector('.strct-wiz__pcount')?.textContent).toContain('0/3');
    const steps = railSteps(el);
    expect(steps.length).toBe(3);
    expect(steps[0].getAttribute('aria-current')).toBe('step');
    expect(steps[0].classList).toContain('strct-wiz__vstep--active');
    // Active step shows its description; future steps are disabled.
    expect(steps[0].textContent).toContain('Name, environment');
    expect(steps[1].disabled).toBe(true);
    expect(el.querySelector('.strct-wiz__aside .live-summary')?.textContent).toBe('summary');
    // Horizontal header must not render in vertical mode.
    expect(el.querySelector('.strct-wiz__steps')).toBeNull();
  });

  it('advancing fills the progress bar and marks visited steps done', () => {
    const { fixture, el } = setup();
    nextBtn(el).click();
    fixture.detectChanges();
    expect(el.querySelector('.strct-wiz__pcount')?.textContent).toContain('1/3');
    const fill = el.querySelector<HTMLElement>('.strct-wiz__pbar i')!;
    expect(fill.style.width).toBe('33.33333333333333%'); // 1/3 visited
    expect(railSteps(el)[0].classList).toContain('strct-wiz__vstep--done');
    expect(railSteps(el)[1].classList).toContain('strct-wiz__vstep--active');
  });

  it('rail click jumps back to a visited step but never forward past visited', () => {
    const { fixture, host, el } = setup();
    nextBtn(el).click();
    fixture.detectChanges();
    railSteps(el)[0].click();
    fixture.detectChanges();
    expect(host.current()).toBe(0);
    expect(host.changes).toEqual([1, 0]);
    // Step 3 was never reached — its rail button stays disabled.
    expect(railSteps(el)[2].disabled).toBe(true);
    // Progress remembers the furthest step even after going back.
    expect(el.querySelector('.strct-wiz__pcount')?.textContent).toContain('1/3');
  });

  it('horizontal default renders no rail and no aside', () => {
    @Component({
      imports: [StrctWizard, StrctStep],
      template: `<strct-wizard>
        <strct-step label="A">a</strct-step>
        <strct-step label="B">b</strct-step>
      </strct-wizard>`,
    })
    class HHost {}
    const fixture = TestBed.createComponent(HHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-wiz__rail')).toBeNull();
    expect(el.querySelector('.strct-wiz__steps')).toBeTruthy();
    expect(getComputedStyle(el.querySelector('.strct-wiz__aside')!).display).toBe('none');
  });
});
