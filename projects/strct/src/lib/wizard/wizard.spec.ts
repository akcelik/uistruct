import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctStep, StrctWizard, StrctWizardAside, provideStrctWizardDefaults } from './wizard';
import { StrctModal, StrctModalContent } from '../modal/modal';
import { resetStrctDevWarnings } from '../util/dev-warn';

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

  it('advancing to the last step keeps focus on the (now Finish) button', () => {
    const { fixture, el } = setup();
    const btn = nextBtn(el);
    btn.focus();
    btn.click();
    fixture.detectChanges();
    btn.click();
    fixture.detectChanges();
    // Next and Finish are one element — the swap cannot drop focus to <body>.
    expect(nextBtn(el).textContent).toContain('Finish');
    expect(document.activeElement).toBe(nextBtn(el));
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

  it('content header names the pane after the active step and follows Next', () => {
    const { fixture, el } = setup();
    expect(el.querySelector('.strct-wiz__ctitle')?.textContent?.trim()).toBe('Identity');
    expect(el.querySelector('.strct-wiz__clede')?.textContent?.trim()).toBe('Name, environment');
    nextBtn(el).click();
    fixture.detectChanges();
    expect(el.querySelector('.strct-wiz__ctitle')?.textContent?.trim()).toBe('Placement');
    expect(el.querySelector('.strct-wiz__clede')?.textContent?.trim()).toBe('Cluster and template');
  });

  it('contentHeader=false opts out; a description-less step renders no lede', () => {
    @Component({
      imports: [StrctWizard, StrctStep],
      // Plain field mutated mid-test — opt out of the v22 OnPush default.
      changeDetection: ChangeDetectionStrategy.Eager,
      template: `<strct-wizard vertical [contentHeader]="header" [current]="2">
        <strct-step label="A" description="da">a</strct-step>
        <strct-step label="B">b</strct-step>
        <strct-step label="C">c</strct-step>
      </strct-wizard>`,
    })
    class OptHost {
      header = false;
    }
    const fixture = TestBed.createComponent(OptHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-wiz__chead')).toBeNull();
    fixture.componentInstance.header = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(el.querySelector('.strct-wiz__ctitle')?.textContent?.trim()).toBe('C');
    expect(el.querySelector('.strct-wiz__clede')).toBeNull();
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
    // No projected aside ⇒ no aside element at all (BUG-17-00).
    expect(el.querySelector('.strct-wiz__aside')).toBeNull();
    // The content header is a vertical-mode affordance.
    expect(el.querySelector('.strct-wiz__chead')).toBeNull();
  });

  it('vertical without an aside renders no aside element (BUG-17-00)', () => {
    @Component({
      imports: [StrctWizard, StrctStep],
      template: `<strct-wizard vertical>
        <strct-step label="A">a</strct-step>
        <strct-step label="B">b</strct-step>
      </strct-wizard>`,
    })
    class NoAsideHost {}
    const fixture = TestBed.createComponent(NoAsideHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    // The empty aside used to wrap onto an implicit grid row and steal ~24%
    // of the layout height, floating the footer mid-dialog.
    expect(el.querySelector('.strct-wiz__aside')).toBeNull();
    expect(el.querySelector('.strct-wiz__layout--aside')).toBeNull();
    expect(el.querySelector('.strct-wiz__rail')).toBeTruthy();
  });

  it('flush drops the vertical card so the wizard can BE the dialog surface', () => {
    @Component({
      imports: [StrctWizard, StrctStep],
      template: `<strct-wizard vertical flush>
        <strct-step label="A">a</strct-step>
      </strct-wizard>`,
    })
    class FlushHost {}
    const fixture = TestBed.createComponent(FlushHost);
    fixture.detectChanges();
    const host = (fixture.nativeElement as HTMLElement).querySelector('strct-wizard')!;
    expect(host.classList).toContain('strct-wiz--flush');
    expect(host.querySelector('.strct-wiz__layout--v')).toBeTruthy();
  });
});

describe('StrctWizard app-wide defaults', () => {
  @Component({
    imports: [StrctWizard, StrctStep],
    template: `<strct-wizard>
      <strct-step label="A">a</strct-step>
      <strct-step label="B">b</strct-step>
    </strct-wizard>`,
  })
  class PlainHost {}

  @Component({
    imports: [StrctWizard, StrctStep],
    template: `<strct-wizard [vertical]="false">
      <strct-step label="A">a</strct-step>
    </strct-wizard>`,
  })
  class OptOutHost {}

  it('provideStrctWizardDefaults({ vertical: true }) makes plain wizards vertical', () => {
    TestBed.configureTestingModule({
      providers: [provideStrctWizardDefaults({ vertical: true })],
    });
    const fixture = TestBed.createComponent(PlainHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-wiz__rail')).toBeTruthy();
    expect(el.querySelector('.strct-wiz__steps')).toBeNull();
  });

  it('a bound [vertical]="false" wins over the app-wide default', () => {
    TestBed.configureTestingModule({
      providers: [provideStrctWizardDefaults({ vertical: true })],
    });
    const fixture = TestBed.createComponent(OptOutHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-wiz__rail')).toBeNull();
    expect(el.querySelector('.strct-wiz__steps')).toBeTruthy();
  });

  it('without the provider the default stays horizontal (semver)', () => {
    const fixture = TestBed.createComponent(PlainHost);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.strct-wiz__rail')).toBeNull();
  });
});

describe('StrctWizard silent-failure diagnostics', () => {
  beforeEach(() => resetStrctDevWarnings());
  afterEach(() => vi.restoreAllMocks());
  const spy = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
  const texts = (w: ReturnType<typeof spy>) => w.mock.calls.map((c) => String(c[0]));

  it('warns that title is dropped by the horizontal layout, and why a test may hit it', () => {
    const warn = spy();
    const fixture = TestBed.createComponent(StrctWizard);
    fixture.componentRef.setInput('title', 'Create VM');
    fixture.detectChanges();
    expect(texts(warn)).toEqual([
      expect.stringContaining('[strct-wizard] title="Create VM" is not rendered'),
    ]);
    expect(texts(warn)[0]).toContain('provideStrctWizardDefaults({ vertical: true })');
  });

  it('is quiet when the title can render', () => {
    const warn = spy();
    const fixture = TestBed.createComponent(StrctWizard);
    fixture.componentRef.setInput('title', 'Create VM');
    fixture.componentRef.setInput('vertical', true);
    fixture.detectChanges();
    expect(texts(warn)).toEqual([]);
  });

  @Component({
    imports: [StrctModal, StrctWizard, StrctStep],
    template: `
      <strct-modal [open]="true" chromeless title="Create VM">
        <strct-wizard vertical flush [style]="wizStyle"
          ><strct-step label="A">a</strct-step></strct-wizard
        >
      </strct-modal>
    `,
  })
  class ChromelessHost {
    wizStyle = '--strct-wiz-content-min: 480px';
  }

  it('warns when --strct-wiz-content-min is set on the wizard, where the dialog cannot see it', () => {
    const warn = spy();
    const fixture = TestBed.createComponent(ChromelessHost);
    fixture.detectChanges();
    expect(texts(warn)).toEqual([
      expect.stringContaining('[strct-wizard] --strct-wiz-content-min is 480px on the wizard'),
    ]);
    expect(texts(warn)[0]).toContain('Set it on the strct-modal or an ancestor');
  });
});

describe('StrctWizard — the footer is never clipped (BUG-41-01)', () => {
  @Component({
    imports: [StrctModal, StrctModalContent, StrctWizard, StrctStep],
    template: `
      <strct-modal [open]="true" chromeless title="Add hosts">
        <ng-template strctModalContent>
          <strct-wizard [vertical]="vertical" flush title="Add hosts">
            <strct-step label="One"><div style="height: 1400px">tall</div></strct-step>
          </strct-wizard>
        </ng-template>
      </strct-modal>
    `,
  })
  class DialogHost {
    vertical = true;
  }

  /** jsdom lays nothing out, so this pins the height CHAIN instead: every link
   *  that, if it went back to auto, lets the grid grow and the dialog clip the
   *  footer. The real-layout check is in the PR (Chrome, 1280×720). */
  function styles(vertical: boolean) {
    const fixture = TestBed.createComponent(DialogHost);
    fixture.componentInstance.vertical = vertical;
    fixture.detectChanges();
    return (sel: string) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el) : null;
    };
  }

  it('vertical: the chain runs dialog → body → host → layout → main → content', () => {
    const cs = styles(true);
    const body = cs('.strct-modal__dialog--chromeless .strct-modal__body')!;
    expect([body.flexGrow, body.minHeight]).toEqual(['1', '0px']);

    const host = cs('strct-wizard.strct-wiz--vertical')!;
    expect([host.display, host.flexDirection, host.minHeight]).toEqual(['flex', 'column', '0px']);

    const layout = cs('.strct-wiz__layout--v')!;
    expect(layout.flexGrow).toBe('1');
    expect(layout.minHeight).toBe('0px');
    // A bounded row track: 'auto' here is what let the grid grow to the step.
    expect(layout.gridTemplateRows).toBe('minmax(0, 1fr)');

    expect(cs('.strct-wiz__layout--v .strct-wiz__main')!.minHeight).toBe('0px');
    const content = cs('.strct-wiz__layout--v .strct-wiz__content')!;
    expect([content.flexGrow, content.minHeight, content.overflowY]).toEqual(['1', '0px', 'auto']);
  });

  it('horizontal in a height-capped surface: the step scrolls, not the dialog', () => {
    const cs = styles(false);
    const host = cs('strct-wizard.strct-wiz--flush')!;
    expect([host.display, host.flexDirection]).toEqual(['flex', 'column']);
    const content = cs('.strct-wiz__content')!;
    expect([content.flexGrow, content.minHeight, content.overflowY]).toEqual(['1', '0px', 'auto']);
  });

  it('an inline horizontal wizard keeps its block flow (and its margins)', () => {
    const fixture = TestBed.createComponent(StrctWizard);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(getComputedStyle(host).display).toBe('block');
    fixture.componentRef.setInput('vertical', false);
    fixture.detectChanges();
    const content = host.querySelector('.strct-wiz__content');
    // Not flush: no scroll container is imposed on an inline wizard (jsdom
    // reports an unset property as '').
    expect(content ? getComputedStyle(content).overflowY : '').not.toBe('auto');
  });
});
