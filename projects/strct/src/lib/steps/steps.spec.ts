import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctStepAction, StrctStepState, StrctSteps } from './steps';

const RUN: StrctStepState[] = [
  { id: 'check', label: 'Check', state: 'done' },
  { id: 'download', label: 'Download', state: 'done' },
  { id: 'maint', label: 'Maintenance', state: 'skipped', description: 'Host already drained' },
  { id: 'install', label: 'Install', state: 'active' },
  { id: 'restart', label: 'Restart', state: 'pending' },
  { id: 'verify', label: 'Verify', state: 'blocked' },
  { id: 'back', label: 'Back in service', state: 'failed' },
];

function build(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(StrctSteps);
  fixture.componentRef.setInput('steps', RUN);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

@Component({
  imports: [StrctSteps, StrctStepAction],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-steps [steps]="steps" appearance="cards">
      <ng-template strctStepAction let-step>
        <button type="button" class="act">{{ step.label }}</button>
      </ng-template>
    </strct-steps>
  `,
})
class CardHost {
  steps: StrctStepState[] = [
    { id: 'baseline', label: 'Baseline', state: 'done', description: 'Capture what is installed.' },
    { id: 'check', label: 'Check', state: 'active', description: 'Compare against the catalogue.' },
  ];
}

describe('StrctSteps', () => {
  it('is an ordered list carrying each step state', () => {
    const { el } = build();
    expect(el.querySelector('ol')).toBeTruthy();
    const items = el.querySelectorAll('li');
    expect(items.length).toBe(7);
    expect([...items].map((i) => i.getAttribute('data-state'))).toEqual([
      'done',
      'done',
      'skipped',
      'active',
      'pending',
      'blocked',
      'failed',
    ]);
  });

  it('marks the active step and says every state in words', () => {
    const { el } = build();
    const items = [...el.querySelectorAll('li')];
    expect(items[3].getAttribute('aria-current')).toBe('step');
    expect(items.filter((i) => i.getAttribute('aria-current')).length).toBe(1);
    expect(items[2].querySelector('.strct-steps__sr')?.textContent).toBe('skipped');
    expect(items[3].querySelector('.strct-steps__sr')?.textContent).toBe('in progress');
    expect(items[6].querySelector('.strct-steps__sr')?.textContent).toBe('failed');
  });

  it('takes the state words from labels', () => {
    const { el } = build({ labels: { skipped: 'atlandı' } });
    expect(el.querySelectorAll('li')[2].querySelector('.strct-steps__sr')?.textContent).toBe(
      'atlandı',
    );
  });

  it('numbers the pills only when asked, and always on cards', () => {
    expect(build().el.querySelector('.strct-steps__marker')?.textContent?.trim()).toBe('');
    expect(
      build({ numbered: true }).el.querySelector('.strct-steps__marker')?.textContent?.trim(),
    ).toBe('1');
    expect(
      build({ appearance: 'cards' }).el.querySelector('.strct-steps__marker')?.textContent?.trim(),
    ).toBe('1');
  });

  it('puts the description in a tooltip for pills and on the card itself', () => {
    const pills = build().el.querySelectorAll('li');
    expect(pills[2].getAttribute('title')).toBe('Host already drained');
    expect(pills[2].querySelector('.strct-steps__desc')).toBeNull();

    const cards = build({ appearance: 'cards' }).el.querySelectorAll('li');
    expect(cards[2].getAttribute('title')).toBeNull();
    expect(cards[2].querySelector('.strct-steps__desc')?.textContent).toBe('Host already drained');
  });

  it('renders a per-step action from the template', () => {
    const fixture = TestBed.createComponent(CardHost);
    fixture.detectChanges();
    const actions = (fixture.nativeElement as HTMLElement).querySelectorAll('.act');
    expect([...actions].map((a) => a.textContent)).toEqual(['Baseline', 'Check']);
  });

  it('carries the appearance and orientation on the host', () => {
    expect(build({ appearance: 'dots' }).el.classList).toContain('strct-steps--dots');
    expect(build({ orientation: 'vertical' }).el.classList).toContain('strct-steps--vertical');
    expect(build({ dense: true }).el.classList).toContain('strct-steps--dense');
    expect(build().el.classList).not.toContain('strct-steps--cards');
  });
});

// FR-49-16 — a plan shown before anything runs is not "pending".
describe('StrctSteps — planned, a name and wrapping pills', () => {
  const plan: StrctStepState[] = [
    { id: 'a', label: 'Enter maintenance', state: 'planned' },
    { id: 'b', label: 'Migrate 12 VMs', state: 'planned' },
    { id: 'c', label: 'Back in service', state: 'planned' },
  ];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctSteps);
    fixture.componentRef.setInput('steps', plan);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('renders the planned state and says the word', () => {
    const { el } = make();
    const steps = [...el.querySelectorAll('.strct-steps__step')];
    expect(steps.map((s) => s.getAttribute('data-state'))).toEqual([
      'planned',
      'planned',
      'planned',
    ]);
    expect(steps[0].querySelector('.strct-steps__sr')!.textContent!.trim()).toBe('planned');
    // It is its own state, not a rename of pending.
    expect(steps[0].getAttribute('aria-current')).toBeNull();
  });

  it('takes a name for the list, and it is the ol that carries it', () => {
    const { el } = make({ label: 'Migration plan' });
    expect(el.querySelector('ol')!.getAttribute('aria-label')).toBe('Migration plan');
    expect(make().el.querySelector('ol')!.getAttribute('aria-label')).toBeNull();
  });

  it('wrap is opt-in', () => {
    expect(make().el.classList).not.toContain('strct-steps--wrap');
    expect(make({ wrap: true }).el.classList).toContain('strct-steps--wrap');
  });

  it('the localizable word can be overridden', () => {
    const { el } = make({ labels: { planned: 'planlandı' } });
    expect(el.querySelector('.strct-steps__sr')!.textContent!.trim()).toBe('planlandı');
  });
});
