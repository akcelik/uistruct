import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctAlert,
  StrctCheckbox,
  StrctField,
  StrctIcon,
  StrctInput,
  StrctRadio,
  StrctRadioGroup,
  StrctStack,
  StrctStackItem,
  StrctStep,
  StrctToggle,
  StrctWizard,
} from 'strct';

interface HostOption {
  id: string;
  name: string;
  spec: string;
}

/**
 * Scenario: a "New Cluster" provisioning flow — a multi-step wizard with
 * per-step validation gating (`[canAdvance]`), strct-field forms, a busy Finish
 * state and a success summary.
 */
@Component({
  selector: 'app-cluster-wizard-scenario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    StrctWizard,
    StrctStep,
    StrctField,
    StrctInput,
    StrctCheckbox,
    StrctToggle,
    StrctRadioGroup,
    StrctRadio,
    StrctStack,
    StrctStackItem,
    StrctAlert,
    StrctIcon,
  ],
  template: `
    <header class="wiz__head">
      <h1 class="wiz__title">New cluster</h1>
      <p class="wiz__sub">Provision a new compute cluster in four steps.</p>
    </header>

    @if (created()) {
      <strct-alert type="success" closable (closed)="reset()">
        Cluster <strong>{{ name() }}</strong> created in {{ datacenter() }} with
        {{ selectedHosts().length }} host(s).
      </strct-alert>
    } @else {
      <strct-wizard
        cancelable
        [submitting]="submitting()"
        finishLabel="Create cluster"
        (finished)="onFinish()"
        (cancelled)="onCancel()"
        (stepChange)="step.set($event)"
      >
        <!-- 1 · Basics -->
        <strct-step label="Basics" [canAdvance]="basicsValid()">
          <div class="wiz__form">
            <strct-field label="Cluster name" required [error]="nameError()">
              <input
                strctInput
                placeholder="e.g. Prod-West-A"
                [ngModel]="name()"
                (ngModelChange)="name.set($event)"
                (blur)="nameTouched.set(true)"
              />
            </strct-field>
            <strct-field label="Datacenter" hint="Where the cluster will be created.">
              <select strctInput [ngModel]="datacenter()" (ngModelChange)="datacenter.set($event)">
                <option value="us-east-1">us-east-1</option>
                <option value="us-west-2">us-west-2</option>
                <option value="eu-central-1">eu-central-1</option>
              </select>
            </strct-field>
            <strct-field label="Description" hint="Optional.">
              <textarea
                strctInput
                rows="2"
                placeholder="Purpose of this cluster…"
                [ngModel]="description()"
                (ngModelChange)="description.set($event)"
              ></textarea>
            </strct-field>
          </div>
        </strct-step>

        <!-- 2 · Hosts -->
        <strct-step label="Hosts" [canAdvance]="hostsValid()">
          <p class="wiz__hint">Select at least one host to add to the cluster.</p>
          <div class="wiz__hosts">
            @for (h of hosts; track h.id) {
              <div class="hostopt">
                <strct-checkbox
                  [ngModel]="isSelected(h.id)"
                  (ngModelChange)="toggleHost(h.id, $event)"
                >
                  <span class="hostopt__body">
                    <span class="hostopt__name"
                      ><strct-icon name="host" [size]="14" /> {{ h.name }}</span
                    >
                    <span class="hostopt__spec">{{ h.spec }}</span>
                  </span>
                </strct-checkbox>
              </div>
            }
          </div>
        </strct-step>

        <!-- 3 · Features -->
        <strct-step label="Features">
          <div class="wiz__form">
            <strct-toggle [ngModel]="ha()" (ngModelChange)="ha.set($event)"
              >High Availability (HA)</strct-toggle
            >
            <strct-toggle [ngModel]="drs()" (ngModelChange)="drs.set($event)"
              >Dynamic optimization</strct-toggle
            >
            <strct-field label="Optimization level">
              <strct-radio-group [ngModel]="automation()" (ngModelChange)="automation.set($event)">
                <strct-radio [value]="'manual'">Manual</strct-radio>
                <strct-radio [value]="'partial'">Partially automated</strct-radio>
                <strct-radio [value]="'full'">Fully automated</strct-radio>
              </strct-radio-group>
            </strct-field>
          </div>
        </strct-step>

        <!-- 4 · Review -->
        <strct-step label="Review">
          <strct-stack style="max-width: 460px;">
            <strct-stack-item label="Name">{{ name() }}</strct-stack-item>
            <strct-stack-item label="Datacenter">{{ datacenter() }}</strct-stack-item>
            <strct-stack-item label="Hosts">{{ selectedHosts().length }} selected</strct-stack-item>
            <strct-stack-item label="HA">{{ ha() ? 'Enabled' : 'Disabled' }}</strct-stack-item>
            <strct-stack-item label="Optimization">{{
              drs() ? 'Enabled · ' + automation() : 'Disabled'
            }}</strct-stack-item>
          </strct-stack>
        </strct-step>
      </strct-wizard>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 760px;
      }
      .wiz__head {
        margin-bottom: 18px;
      }
      .wiz__title {
        margin: 0;
        font-size: 24px;
        font-weight: 650;
        color: var(--t1);
        letter-spacing: -0.01em;
      }
      .wiz__sub {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--t3);
      }
      .wiz__form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-width: 420px;
      }
      .wiz__hint {
        font-size: 13px;
        color: var(--t2);
        margin: 0 0 12px;
      }
      .wiz__hosts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
      }
      .hostopt {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid var(--b2);
        border-radius: 9px;
        background: var(--bg-1);
        cursor: pointer;
      }
      .hostopt__body {
        display: flex;
        flex-direction: column;
      }
      .hostopt__name {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--t1);
      }
      .hostopt__name strct-icon {
        color: var(--t2);
      }
      .hostopt__spec {
        font-size: 12px;
        color: var(--t3);
      }
    `,
  ],
})
export class ClusterWizardPage {
  protected readonly step = signal(0);
  protected readonly name = signal('');
  protected readonly nameTouched = signal(false);
  protected readonly datacenter = signal('us-east-1');
  protected readonly description = signal('');
  protected readonly selectedHosts = signal<string[]>([]);
  protected readonly ha = signal(true);
  protected readonly drs = signal(true);
  protected readonly automation = signal('partial');
  protected readonly submitting = signal(false);
  protected readonly created = signal(false);

  protected readonly hosts: HostOption[] = [
    { id: 'h1', name: 'hv-pool-01', spec: '48 cores · 512 GB' },
    { id: 'h2', name: 'hv-pool-02', spec: '48 cores · 512 GB' },
    { id: 'h3', name: 'hv-pool-03', spec: '64 cores · 768 GB' },
    { id: 'h4', name: 'hv-pool-04', spec: '64 cores · 768 GB' },
  ];

  protected readonly basicsValid = computed(() => this.name().trim().length > 0);
  protected readonly hostsValid = computed(() => this.selectedHosts().length > 0);
  protected readonly nameError = computed(() =>
    this.nameTouched() && !this.name().trim() ? 'A cluster name is required.' : '',
  );

  protected isSelected(id: string): boolean {
    return this.selectedHosts().includes(id);
  }
  protected toggleHost(id: string, on: boolean): void {
    this.selectedHosts.update((list) => (on ? [...list, id] : list.filter((x) => x !== id)));
  }

  protected onFinish(): void {
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.created.set(true);
    }, 900);
  }
  protected onCancel(): void {
    this.reset();
  }
  protected reset(): void {
    this.created.set(false);
    this.step.set(0);
    this.name.set('');
    this.nameTouched.set(false);
    this.selectedHosts.set([]);
  }
}
