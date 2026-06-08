import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  StrctAlert,
  StrctBadge,
  StrctButton,
  StrctCheckbox,
  StrctDrawer,
  StrctDrawerFooter,
  StrctIcon,
  StrctInput,
  StrctProgress,
  StrctRange,
  StrctTag,
  StrctToastService,
  StrctToggle,
} from 'strct';

interface Adapter {
  id: string;
  name: string;
  switch: string;
  vlanOn: boolean;
  vlan: number;
}
interface Disk {
  id: string;
  name: string;
  sizeGb: number;
  controller: string;
  kind: 'Dynamic' | 'Fixed';
}
interface VmSettings {
  name: string;
  generation: 1 | 2;
  notes: string;
  vcpu: number;
  numa: boolean;
  reservePct: number;
  startupMb: number;
  dynamic: boolean;
  minMb: number;
  maxMb: number;
  weight: number;
  secureBoot: boolean;
  tpm: boolean;
  adapters: Adapter[];
  disks: Disk[];
  dvd: string;
  svcHeartbeat: boolean;
  svcExchange: boolean;
  svcBackup: boolean;
  svcGuest: boolean;
  svcTimeSync: boolean;
  checkpointsEnabled: boolean;
  checkpointType: 'production' | 'standard';
  startAction: 'nothing' | 'auto' | 'always';
  startDelay: number;
  stopAction: 'save' | 'shutdown' | 'turnoff';
}

interface Section {
  id: string;
  label: string;
  icon: string;
  group: string;
  keys: (keyof VmSettings)[];
  /** Changing these while the VM runs needs a restart. */
  restart?: boolean;
}

const SECTIONS: Section[] = [
  {
    id: 'general',
    label: 'General',
    icon: 'options',
    group: 'Hardware',
    keys: ['name', 'generation', 'notes'],
  },
  {
    id: 'processor',
    label: 'Processor',
    icon: 'cpu',
    group: 'Hardware',
    keys: ['vcpu', 'numa', 'reservePct'],
    restart: true,
  },
  {
    id: 'memory',
    label: 'Memory',
    icon: 'memory',
    group: 'Hardware',
    keys: ['startupMb', 'dynamic', 'minMb', 'maxMb', 'weight'],
    restart: true,
  },
  { id: 'disks', label: 'Hard drives', icon: 'disk', group: 'Hardware', keys: ['disks'] },
  { id: 'network', label: 'Network adapters', icon: 'nic', group: 'Hardware', keys: ['adapters'] },
  {
    id: 'security',
    label: 'Security',
    icon: 'shield',
    group: 'Hardware',
    keys: ['secureBoot', 'tpm'],
    restart: true,
  },
  {
    id: 'integration',
    label: 'Integration services',
    icon: 'sync',
    group: 'Management',
    keys: ['svcHeartbeat', 'svcExchange', 'svcBackup', 'svcGuest', 'svcTimeSync'],
  },
  {
    id: 'checkpoints',
    label: 'Checkpoints',
    icon: 'snapshot',
    group: 'Management',
    keys: ['checkpointsEnabled', 'checkpointType'],
  },
  {
    id: 'autostart',
    label: 'Automatic start / stop',
    icon: 'power',
    group: 'Management',
    keys: ['startAction', 'startDelay', 'stopAction'],
  },
];

const HOST_CORES = 32;
const HOST_RAM_GB = 256;

function seed(): VmSettings {
  return {
    name: 'web-frontend-01',
    generation: 2,
    notes: 'Front-end web tier — Prod-A cluster.',
    vcpu: 4,
    numa: false,
    reservePct: 0,
    startupMb: 4096,
    dynamic: true,
    minMb: 2048,
    maxMb: 16384,
    weight: 50,
    secureBoot: true,
    tpm: true,
    adapters: [
      { id: 'a1', name: 'Network Adapter', switch: 'External', vlanOn: true, vlan: 20 },
      { id: 'a2', name: 'Management', switch: 'Management', vlanOn: false, vlan: 1 },
    ],
    disks: [
      { id: 'd1', name: 'os.vhdx', sizeGb: 80, controller: 'SCSI Controller', kind: 'Dynamic' },
      { id: 'd2', name: 'data.vhdx', sizeGb: 500, controller: 'SCSI Controller', kind: 'Dynamic' },
    ],
    dvd: 'None',
    svcHeartbeat: true,
    svcExchange: true,
    svcBackup: true,
    svcGuest: false,
    svcTimeSync: true,
    checkpointsEnabled: true,
    checkpointType: 'production',
    startAction: 'auto',
    startDelay: 0,
    stopAction: 'save',
  };
}

const clone = (v: VmSettings): VmSettings => JSON.parse(JSON.stringify(v)) as VmSettings;

/**
 * Scenario: a full "VM Edit Settings" editor — a master/detail settings shell
 * with grouped category navigation, rich live forms, per-section change
 * indicators, validation, dynamic hardware (add via a drawer), a restart-impact
 * notice, and a dirty-aware sticky action bar. Vendor-neutral / Hyper-V flavour.
 */
@Component({
  selector: 'app-vm-settings-scenario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    StrctBadge,
    StrctTag,
    StrctButton,
    StrctIcon,
    StrctInput,
    StrctCheckbox,
    StrctToggle,
    StrctRange,
    StrctProgress,
    StrctAlert,
    StrctDrawer,
    StrctDrawerFooter,
  ],
  template: `
    <!-- Identity header -->
    <header class="vms__head">
      <div class="vms__idcol">
        <a routerLink="/scenarios/inventory" class="vms__back">
          <strct-icon name="chevronLeft" [size]="13" /> Inventory
        </a>
        <div class="vms__title">
          <span class="vms__avatar"><strct-icon name="vm" [size]="20" [strokeWidth]="1.4" /></span>
          <h1 class="vms__name">{{ original().name }}</h1>
          <strct-badge status="success">Running</strct-badge>
          <strct-tag>Generation {{ original().generation }}</strct-tag>
        </div>
        <p class="vms__sub">
          Edit settings · changes to hardware marked ⟳ apply after the next restart
        </p>
      </div>
    </header>

    <!-- Settings shell -->
    <div class="vms__shell">
      <!-- Category nav -->
      <nav class="vms__nav" aria-label="Settings sections">
        @for (g of groups; track g) {
          <div class="vms__navgroup">{{ g }}</div>
          @for (sec of sectionsIn(g); track sec.id) {
            <button
              type="button"
              class="vms__navitem"
              [class.is-active]="active() === sec.id"
              (click)="active.set(sec.id)"
            >
              <strct-icon class="vms__navicon" [name]="sec.icon" [size]="16" [strokeWidth]="1.5" />
              <span class="vms__navlabel">{{ sec.label }}</span>
              @if (sec.restart) {
                <strct-icon class="vms__navrestart" name="sync" [size]="11" />
              }
              @if (sectionChanged(sec)) {
                <span class="vms__navdot" title="Unsaved changes"></span>
              }
            </button>
          }
        }
      </nav>

      <!-- Detail panel -->
      <section class="vms__panel">
        @let sec = activeSection();
        <div class="vms__panelhead">
          <div>
            <div class="vms__crumb">{{ sec.group }}</div>
            <h2 class="vms__h2">{{ sec.label }}</h2>
          </div>
          @if (sec.restart && runtimeChanged()) {
            <strct-tag status="warning"
              ><strct-icon name="sync" [size]="12" /> Restart required</strct-tag
            >
          }
        </div>

        <div class="vms__panelbody">
          @switch (active()) {
            <!-- GENERAL -->
            @case ('general') {
              <div class="f">
                <div class="f__l">
                  <span class="f__n">Name</span
                  ><span class="f__h">Display name in the inventory</span>
                </div>
                <div class="f__c">
                  <input
                    strctInput
                    [ngModel]="s().name"
                    (ngModelChange)="patch({ name: $event })"
                  />
                </div>
              </div>
              <div class="f">
                <div class="f__l">
                  <span class="f__n">Generation</span
                  ><span class="f__h">Firmware &amp; boot model (fixed after create)</span>
                </div>
                <div class="f__c">
                  <div class="seg">
                    <button
                      type="button"
                      class="seg__b"
                      [class.is-on]="s().generation === 1"
                      disabled
                    >
                      Gen 1
                    </button>
                    <button
                      type="button"
                      class="seg__b"
                      [class.is-on]="s().generation === 2"
                      disabled
                    >
                      Gen 2 · UEFI
                    </button>
                  </div>
                </div>
              </div>
              <div class="f f--top">
                <div class="f__l">
                  <span class="f__n">Notes</span><span class="f__h">Free-form description</span>
                </div>
                <div class="f__c">
                  <textarea
                    strctInput
                    rows="3"
                    [ngModel]="s().notes"
                    (ngModelChange)="patch({ notes: $event })"
                  ></textarea>
                </div>
              </div>
            }

            <!-- PROCESSOR -->
            @case ('processor') {
              <div class="hero">
                <div class="hero__big">{{ s().vcpu }}<span class="hero__unit">vCPU</span></div>
                <div class="hero__meta">
                  <span class="hero__cap">of {{ hostCores }} logical processors on the host</span>
                  <strct-progress
                    [value]="(s().vcpu / hostCores) * 100"
                    [status]="s().vcpu > hostCores * 0.75 ? 'warning' : 'accent'"
                  />
                </div>
              </div>
              <div class="f">
                <div class="f__l"><span class="f__n">Virtual processors</span></div>
                <div class="f__c">
                  <strct-range
                    [min]="1"
                    [max]="hostCores"
                    [ngModel]="s().vcpu"
                    (ngModelChange)="patch({ vcpu: $event })"
                    showValue
                  />
                </div>
              </div>
              <div class="f">
                <div class="f__l">
                  <span class="f__n">Reserve (%)</span
                  ><span class="f__h">Guaranteed share of a logical processor</span>
                </div>
                <div class="f__c">
                  <strct-range
                    [min]="0"
                    [max]="100"
                    [step]="5"
                    [ngModel]="s().reservePct"
                    (ngModelChange)="patch({ reservePct: $event })"
                    showValue
                  />
                </div>
              </div>
              <div class="f">
                <div class="f__l">
                  <span class="f__n">NUMA spanning</span
                  ><span class="f__h">Allow the VM to span NUMA nodes</span>
                </div>
                <div class="f__c">
                  <strct-toggle [ngModel]="s().numa" (ngModelChange)="patch({ numa: $event })"
                    >Enabled</strct-toggle
                  >
                </div>
              </div>
            }

            <!-- MEMORY -->
            @case ('memory') {
              <div class="hero">
                <div class="hero__big">
                  {{ gb(s().startupMb) }}<span class="hero__unit">GB</span>
                </div>
                <div class="hero__meta">
                  <span class="hero__cap">startup memory · {{ HOST_RAM }} GB on the host</span>
                  <strct-progress
                    [value]="(s().startupMb / 1024 / HOST_RAM) * 100"
                    status="accent"
                  />
                </div>
              </div>
              <div class="f">
                <div class="f__l"><span class="f__n">Startup RAM</span></div>
                <div class="f__c">
                  <strct-range
                    [min]="512"
                    [max]="65536"
                    [step]="512"
                    [ngModel]="s().startupMb"
                    (ngModelChange)="patch({ startupMb: $event })"
                  /><span class="f__val">{{ gb(s().startupMb) }} GB</span>
                </div>
              </div>
              <div class="f">
                <div class="f__l">
                  <span class="f__n">Dynamic Memory</span
                  ><span class="f__h">Grow / shrink RAM on demand</span>
                </div>
                <div class="f__c">
                  <strct-toggle [ngModel]="s().dynamic" (ngModelChange)="patch({ dynamic: $event })"
                    >Enabled</strct-toggle
                  >
                </div>
              </div>
              @if (s().dynamic) {
                <div class="f">
                  <div class="f__l"><span class="f__n">Minimum RAM</span></div>
                  <div class="f__c">
                    <strct-range
                      [min]="512"
                      [max]="65536"
                      [step]="512"
                      [ngModel]="s().minMb"
                      (ngModelChange)="patch({ minMb: $event })"
                    /><span class="f__val">{{ gb(s().minMb) }} GB</span>
                  </div>
                </div>
                <div class="f">
                  <div class="f__l"><span class="f__n">Maximum RAM</span></div>
                  <div class="f__c">
                    <strct-range
                      [min]="512"
                      [max]="131072"
                      [step]="512"
                      [ngModel]="s().maxMb"
                      (ngModelChange)="patch({ maxMb: $event })"
                    /><span class="f__val">{{ gb(s().maxMb) }} GB</span>
                  </div>
                </div>
                <div class="f">
                  <div class="f__l">
                    <span class="f__n">Memory weight</span
                    ><span class="f__h">Priority when the host is contended</span>
                  </div>
                  <div class="f__c">
                    <strct-range
                      [min]="0"
                      [max]="100"
                      [step]="5"
                      [ngModel]="s().weight"
                      (ngModelChange)="patch({ weight: $event })"
                      showValue
                    />
                  </div>
                </div>
                @if (memError()) {
                  <strct-alert type="critical">{{ memError() }}</strct-alert>
                }
              }
            }

            <!-- HARD DRIVES -->
            @case ('disks') {
              <div class="rows">
                @for (d of s().disks; track d.id) {
                  <div class="card">
                    <div class="card__lead"><strct-icon name="disk" [size]="18" /></div>
                    <div class="card__body">
                      <div class="card__row">
                        <input
                          strctInput
                          class="card__name"
                          [ngModel]="d.name"
                          (ngModelChange)="patchDisk(d.id, { name: $event })"
                        />
                        <strct-tag>{{ d.kind }}</strct-tag>
                      </div>
                      <div class="card__grid">
                        <label class="mini"
                          ><span>Size (GB)</span
                          ><input
                            strctInput
                            type="number"
                            [ngModel]="d.sizeGb"
                            (ngModelChange)="patchDisk(d.id, { sizeGb: +$event })"
                        /></label>
                        <label class="mini"
                          ><span>Controller</span>
                          <select
                            strctInput
                            [ngModel]="d.controller"
                            (ngModelChange)="patchDisk(d.id, { controller: $event })"
                          >
                            <option>SCSI Controller</option>
                            <option>IDE Controller 0</option>
                          </select>
                        </label>
                        <label class="mini"
                          ><span>Type</span>
                          <select
                            strctInput
                            [ngModel]="d.kind"
                            (ngModelChange)="patchDisk(d.id, { kind: $any($event) })"
                          >
                            <option>Dynamic</option>
                            <option>Fixed</option>
                          </select>
                        </label>
                      </div>
                    </div>
                    <button
                      strct-button
                      variant="flat"
                      size="sm"
                      iconOnly
                      aria-label="Remove disk"
                      (click)="removeDisk(d.id)"
                    >
                      <strct-icon name="trash" [size]="14" />
                    </button>
                  </div>
                }
              </div>
              <button strct-button variant="outline" size="sm" (click)="openAdd()">
                <strct-icon name="plus" [size]="14" /> Add hardware
              </button>
            }

            <!-- NETWORK ADAPTERS -->
            @case ('network') {
              <div class="rows">
                @for (a of s().adapters; track a.id) {
                  <div class="card">
                    <div class="card__lead"><strct-icon name="nic" [size]="18" /></div>
                    <div class="card__body">
                      <div class="card__row">
                        <input
                          strctInput
                          class="card__name"
                          [ngModel]="a.name"
                          (ngModelChange)="patchAdapter(a.id, { name: $event })"
                        />
                        <strct-tag [status]="a.switch === 'External' ? 'accent' : 'neutral'">{{
                          a.switch
                        }}</strct-tag>
                      </div>
                      <div class="card__grid">
                        <label class="mini"
                          ><span>Virtual switch</span>
                          <select
                            strctInput
                            [ngModel]="a.switch"
                            (ngModelChange)="patchAdapter(a.id, { switch: $event })"
                          >
                            <option>External</option>
                            <option>Internal</option>
                            <option>Private</option>
                            <option>Management</option>
                          </select>
                        </label>
                        <label class="mini"
                          ><span>VLAN ID</span>
                          <input
                            strctInput
                            type="number"
                            [disabled]="!a.vlanOn"
                            [ngModel]="a.vlan"
                            (ngModelChange)="patchAdapter(a.id, { vlan: +$event })"
                          />
                        </label>
                        <div class="mini mini--toggle">
                          <span>VLAN tagging</span>
                          <strct-toggle
                            [ngModel]="a.vlanOn"
                            (ngModelChange)="patchAdapter(a.id, { vlanOn: $event })"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      strct-button
                      variant="flat"
                      size="sm"
                      iconOnly
                      aria-label="Remove adapter"
                      (click)="removeAdapter(a.id)"
                    >
                      <strct-icon name="trash" [size]="14" />
                    </button>
                  </div>
                }
              </div>
              <button strct-button variant="outline" size="sm" (click)="openAdd()">
                <strct-icon name="plus" [size]="14" /> Add hardware
              </button>
            }

            <!-- SECURITY -->
            @case ('security') {
              <strct-alert type="info"
                >Gen 2 VMs support UEFI Secure Boot and a virtual TPM for key storage.</strct-alert
              >
              <div class="f">
                <div class="f__l">
                  <span class="f__n">Secure Boot</span
                  ><span class="f__h">Verify the bootloader signature</span>
                </div>
                <div class="f__c">
                  <strct-toggle
                    [ngModel]="s().secureBoot"
                    (ngModelChange)="patch({ secureBoot: $event })"
                    >Enabled</strct-toggle
                  >
                </div>
              </div>
              <div class="f">
                <div class="f__l">
                  <span class="f__n">Trusted Platform Module</span
                  ><span class="f__h">Enables disk encryption inside the guest</span>
                </div>
                <div class="f__c">
                  <strct-toggle [ngModel]="s().tpm" (ngModelChange)="patch({ tpm: $event })"
                    >Enabled</strct-toggle
                  >
                </div>
              </div>
            }

            <!-- INTEGRATION SERVICES -->
            @case ('integration') {
              <p class="lead">Services the host offers the guest operating system.</p>
              <div class="checks">
                <strct-checkbox
                  [ngModel]="s().svcHeartbeat"
                  (ngModelChange)="patch({ svcHeartbeat: $event })"
                  >Heartbeat</strct-checkbox
                >
                <strct-checkbox
                  [ngModel]="s().svcExchange"
                  (ngModelChange)="patch({ svcExchange: $event })"
                  >Data exchange</strct-checkbox
                >
                <strct-checkbox
                  [ngModel]="s().svcBackup"
                  (ngModelChange)="patch({ svcBackup: $event })"
                  >Backup (volume shadow copy)</strct-checkbox
                >
                <strct-checkbox
                  [ngModel]="s().svcGuest"
                  (ngModelChange)="patch({ svcGuest: $event })"
                  >Guest services</strct-checkbox
                >
                <strct-checkbox
                  [ngModel]="s().svcTimeSync"
                  (ngModelChange)="patch({ svcTimeSync: $event })"
                  >Time synchronization</strct-checkbox
                >
              </div>
            }

            <!-- CHECKPOINTS -->
            @case ('checkpoints') {
              <div class="f">
                <div class="f__l">
                  <span class="f__n">Checkpoints</span
                  ><span class="f__h">Point-in-time snapshots of the VM</span>
                </div>
                <div class="f__c">
                  <strct-toggle
                    [ngModel]="s().checkpointsEnabled"
                    (ngModelChange)="patch({ checkpointsEnabled: $event })"
                    >Enabled</strct-toggle
                  >
                </div>
              </div>
              @if (s().checkpointsEnabled) {
                <div class="f">
                  <div class="f__l"><span class="f__n">Checkpoint type</span></div>
                  <div class="f__c">
                    <div class="seg">
                      <button
                        type="button"
                        class="seg__b"
                        [class.is-on]="s().checkpointType === 'production'"
                        (click)="patch({ checkpointType: 'production' })"
                      >
                        Production
                      </button>
                      <button
                        type="button"
                        class="seg__b"
                        [class.is-on]="s().checkpointType === 'standard'"
                        (click)="patch({ checkpointType: 'standard' })"
                      >
                        Standard
                      </button>
                    </div>
                  </div>
                </div>
                <strct-alert type="info"
                  >Production checkpoints use the guest backup service for application-consistent
                  state.</strct-alert
                >
              }
            }

            <!-- AUTOMATIC START / STOP -->
            @case ('autostart') {
              <div class="f">
                <div class="f__l"><span class="f__n">On host start</span></div>
                <div class="f__c">
                  <select
                    strctInput
                    [ngModel]="s().startAction"
                    (ngModelChange)="patch({ startAction: $any($event) })"
                  >
                    <option value="nothing">Do nothing</option>
                    <option value="auto">Start if it was running</option>
                    <option value="always">Always start automatically</option>
                  </select>
                </div>
              </div>
              <div class="f">
                <div class="f__l">
                  <span class="f__n">Startup delay (s)</span
                  ><span class="f__h">Stagger boot to avoid host contention</span>
                </div>
                <div class="f__c">
                  <strct-range
                    [min]="0"
                    [max]="300"
                    [step]="10"
                    [ngModel]="s().startDelay"
                    (ngModelChange)="patch({ startDelay: $event })"
                    showValue
                  />
                </div>
              </div>
              <div class="f">
                <div class="f__l"><span class="f__n">On host shutdown</span></div>
                <div class="f__c">
                  <select
                    strctInput
                    [ngModel]="s().stopAction"
                    (ngModelChange)="patch({ stopAction: $any($event) })"
                  >
                    <option value="save">Save the VM state</option>
                    <option value="shutdown">Shut down the guest</option>
                    <option value="turnoff">Turn off the VM</option>
                  </select>
                </div>
              </div>
            }
          }
        </div>
      </section>
    </div>

    <!-- Sticky action bar -->
    <div class="vms__actions" [class.is-dirty]="dirtyCount() > 0">
      <div class="vms__status">
        @if (dirtyCount() > 0) {
          <span class="vms__dirtychip"
            ><span class="vms__dirtydot"></span>{{ dirtyCount() }} unsaved
            {{ dirtyCount() === 1 ? 'change' : 'changes' }}</span
          >
          @if (runtimeChanged()) {
            <span class="vms__restartnote"
              ><strct-icon name="sync" [size]="12" /> some changes apply after restart</span
            >
          }
        } @else {
          <span class="vms__clean"><strct-icon name="check" [size]="13" /> All changes saved</span>
        }
      </div>
      <div class="vms__btns">
        <button strct-button variant="flat" [disabled]="dirtyCount() === 0" (click)="discard()">
          Discard
        </button>
        <button
          strct-button
          variant="primary"
          solid
          [disabled]="dirtyCount() === 0 || !valid()"
          (click)="apply()"
        >
          Apply settings
        </button>
      </div>
    </div>

    <!-- Add-hardware drawer -->
    <strct-drawer [(open)]="addOpen" side="end" size="sm" title="Add hardware">
      <p class="lead">
        Pick a device to attach to <strong>{{ s().name }}</strong
        >.
      </p>
      <div class="addlist">
        <button type="button" class="addopt" (click)="add('nic')">
          <strct-icon name="nic" [size]="18" />
          <span><strong>Network Adapter</strong><em>Connect to a virtual switch</em></span>
        </button>
        <button type="button" class="addopt" (click)="add('disk')">
          <strct-icon name="disk" [size]="18" />
          <span><strong>Hard Drive</strong><em>Attach a new virtual disk</em></span>
        </button>
        <button type="button" class="addopt" (click)="add('dvd')">
          <strct-icon name="display" [size]="18" />
          <span><strong>DVD Drive</strong><em>Mount an ISO image</em></span>
        </button>
      </div>
      <ng-container strctDrawerFooter>
        <button strct-button variant="flat" (click)="addOpen.set(false)">Cancel</button>
      </ng-container>
    </strct-drawer>
  `,
  styles: [
    `
      :host {
        display: block;
        padding-bottom: 76px;
      }
      .vms__head {
        margin-bottom: 18px;
      }
      .vms__back {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--t3);
        text-decoration: none;
        margin-bottom: 10px;
      }
      .vms__back:hover {
        color: var(--acc);
      }
      .vms__title {
        display: flex;
        align-items: center;
        gap: 11px;
      }
      .vms__avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: var(--acc-m);
        color: var(--acc);
      }
      .vms__name {
        margin: 0;
        font-size: 22px;
        font-weight: 650;
        color: var(--t1);
        letter-spacing: -0.01em;
      }
      .vms__sub {
        margin: 8px 0 0;
        font-size: 12.5px;
        color: var(--t3);
      }

      .vms__shell {
        display: grid;
        grid-template-columns: 248px minmax(0, 1fr);
        gap: 0;
        border: 1px solid var(--b2);
        border-radius: 12px;
        overflow: hidden;
        background: var(--bg-1);
        min-height: 520px;
        box-shadow: var(--shadow-rest);
      }
      .vms__nav {
        border-right: 1px solid var(--b2);
        padding: 10px;
        background: var(--bg-2);
        overflow-y: auto;
      }
      .vms__navgroup {
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--t3);
        padding: 12px 10px 5px;
      }
      .vms__navgroup:first-child {
        padding-top: 4px;
      }
      .vms__navitem {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 8px 10px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--t2);
        cursor: pointer;
        font-size: 13px;
        font-family: var(--font);
        text-align: left;
        transition:
          background 0.13s ease,
          color 0.13s ease;
      }
      .vms__navitem:hover {
        background: var(--bg-3);
        color: var(--t1);
      }
      .vms__navitem.is-active {
        background: var(--acc-m);
        color: var(--acc);
        font-weight: 550;
      }
      .vms__navitem.is-active .vms__navicon {
        color: var(--acc);
      }
      .vms__navlabel {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .vms__navrestart {
        color: var(--t4, var(--t3));
        opacity: 0.7;
      }
      .vms__navitem.is-active .vms__navrestart {
        color: var(--acc);
      }
      .vms__navdot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--warning);
        flex-shrink: 0;
      }

      .vms__panel {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .vms__panelhead {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 18px 24px 14px;
        border-bottom: 1px solid var(--b1);
      }
      .vms__crumb {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--t3);
      }
      .vms__h2 {
        margin: 2px 0 0;
        font-size: 17px;
        font-weight: 620;
        color: var(--t1);
      }
      .vms__panelbody {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* Field rows */
      .f {
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr);
        gap: 18px;
        align-items: center;
      }
      .f--top {
        align-items: start;
      }
      .f__l {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-top: 1px;
      }
      .f__n {
        font-size: 13px;
        font-weight: 550;
        color: var(--t1);
      }
      .f__h {
        font-size: 12px;
        color: var(--t3);
        line-height: 1.4;
      }
      .f__c {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .f__c strct-range {
        flex: 1;
      }
      .f__c input,
      .f__c textarea,
      .f__c select {
        width: 100%;
      }
      .f__val {
        font-size: 12.5px;
        color: var(--t2);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        min-width: 54px;
        text-align: right;
      }

      /* Hero metric (processor / memory) */
      .hero {
        display: flex;
        align-items: center;
        gap: 22px;
        padding: 16px 20px;
        border: 1px solid var(--b2);
        border-radius: 11px;
        background: var(--bg-2);
      }
      .hero__big {
        font-size: 40px;
        font-weight: 680;
        color: var(--t1);
        line-height: 1;
        letter-spacing: -0.02em;
        display: flex;
        align-items: baseline;
        gap: 7px;
      }
      .hero__unit {
        font-size: 15px;
        font-weight: 600;
        color: var(--t3);
        letter-spacing: 0;
      }
      .hero__meta {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .hero__cap {
        font-size: 12px;
        color: var(--t3);
      }

      /* Segmented control */
      .seg {
        display: inline-flex;
        border: 1px solid var(--b2);
        border-radius: 8px;
        overflow: hidden;
      }
      .seg__b {
        padding: 7px 16px;
        border: 0;
        border-right: 1px solid var(--b2);
        background: var(--bg-1);
        color: var(--t2);
        cursor: pointer;
        font-size: 12.5px;
        font-family: var(--font);
      }
      .seg__b:last-child {
        border-right: 0;
      }
      .seg__b:hover:not(:disabled) {
        background: var(--bg-3);
      }
      .seg__b.is-on {
        background: var(--acc-m);
        color: var(--acc);
        font-weight: 600;
      }
      .seg__b:disabled {
        cursor: default;
        opacity: 0.9;
      }

      /* Hardware cards (disks / adapters) */
      .rows {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .card {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 14px 16px;
        border: 1px solid var(--b2);
        border-radius: 11px;
        background: var(--bg-2);
      }
      .card__lead {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: var(--bg-3);
        color: var(--t2);
        flex-shrink: 0;
      }
      .card__body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .card__row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .card__name {
        max-width: 240px;
        font-weight: 550;
      }
      .card__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
      }
      .mini {
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-size: 12px;
        color: var(--t3);
      }
      .mini > span {
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }
      .mini--toggle {
        justify-content: space-between;
      }
      .mini--toggle strct-toggle {
        align-self: flex-start;
      }

      .checks {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 4px 0;
      }
      .lead {
        margin: 0;
        font-size: 13px;
        color: var(--t2);
      }

      /* Add-hardware drawer */
      .addlist {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 14px;
      }
      .addopt {
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 12px 14px;
        border: 1px solid var(--b2);
        border-radius: 10px;
        background: var(--bg-1);
        color: var(--t1);
        cursor: pointer;
        text-align: left;
        transition:
          border-color 0.13s ease,
          background 0.13s ease;
      }
      .addopt:hover {
        border-color: var(--acc);
        background: var(--acc-s);
      }
      .addopt strct-icon {
        color: var(--acc);
        flex-shrink: 0;
      }
      .addopt span {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .addopt strong {
        font-size: 13.5px;
        font-weight: 600;
      }
      .addopt em {
        font-size: 12px;
        color: var(--t3);
        font-style: normal;
      }

      /* Sticky action bar */
      .vms__actions {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 40;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 24px;
        background: var(--bg-1);
        border-top: 1px solid var(--b2);
        box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
      }
      .vms__actions.is-dirty {
        border-top-color: var(--acc50);
      }
      .vms__status {
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 12.5px;
      }
      .vms__dirtychip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--t1);
        font-weight: 550;
      }
      .vms__dirtydot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--warning);
        box-shadow: 0 0 0 4px var(--warning-bg);
      }
      .vms__restartnote {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--warning);
      }
      .vms__clean {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--success);
      }
      .vms__btns {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      @media (max-width: 820px) {
        .vms__shell {
          grid-template-columns: 1fr;
        }
        .vms__nav {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          border-right: 0;
          border-bottom: 1px solid var(--b2);
        }
        .vms__navgroup {
          width: 100%;
        }
        .f {
          grid-template-columns: 1fr;
          gap: 8px;
          align-items: start;
        }
      }
    `,
  ],
})
export class VmSettingsPage {
  private readonly toast = inject(StrctToastService);
  protected readonly hostCores = HOST_CORES;
  protected readonly HOST_RAM = HOST_RAM_GB;
  protected readonly groups = ['Hardware', 'Management'];

  protected readonly s = signal<VmSettings>(seed());
  protected readonly original = signal<VmSettings>(seed());
  protected readonly active = signal('memory');
  protected readonly addOpen = signal(false);

  private uid = 9;
  private nextId(p: string): string {
    return p + ++this.uid;
  }

  protected readonly activeSection = computed(
    () => SECTIONS.find((x) => x.id === this.active()) ?? SECTIONS[0],
  );

  /** Top-level keys that differ from the saved baseline. */
  private readonly changed = computed(() => {
    const c = this.s();
    const o = this.original();
    const set = new Set<string>();
    for (const sec of SECTIONS) {
      for (const k of sec.keys) {
        if (JSON.stringify(c[k]) !== JSON.stringify(o[k])) set.add(k as string);
      }
    }
    return set;
  });
  protected readonly dirtyCount = computed(() => this.changed().size);

  /** True when any restart-impacting section has unsaved changes. */
  protected readonly runtimeChanged = computed(() =>
    SECTIONS.some((sec) => sec.restart && sec.keys.some((k) => this.changed().has(k as string))),
  );

  protected readonly memError = computed(() => {
    const v = this.s();
    if (!v.dynamic) return '';
    if (v.minMb > v.startupMb) return 'Minimum RAM cannot exceed startup RAM.';
    if (v.maxMb < v.startupMb) return 'Maximum RAM cannot be below startup RAM.';
    return '';
  });
  protected readonly valid = computed(() => !this.memError() && this.s().vcpu >= 1);

  protected sectionsIn(group: string): Section[] {
    return SECTIONS.filter((x) => x.group === group);
  }
  protected sectionChanged(sec: Section): boolean {
    return sec.keys.some((k) => this.changed().has(k as string));
  }

  protected gb(mb: number): string {
    const v = mb / 1024;
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }

  protected patch(p: Partial<VmSettings>): void {
    this.s.update((v) => ({ ...v, ...p }));
  }
  protected patchAdapter(id: string, p: Partial<Adapter>): void {
    this.s.update((v) => ({
      ...v,
      adapters: v.adapters.map((a) => (a.id === id ? { ...a, ...p } : a)),
    }));
  }
  protected removeAdapter(id: string): void {
    this.s.update((v) => ({ ...v, adapters: v.adapters.filter((a) => a.id !== id) }));
  }
  protected patchDisk(id: string, p: Partial<Disk>): void {
    this.s.update((v) => ({ ...v, disks: v.disks.map((d) => (d.id === id ? { ...d, ...p } : d)) }));
  }
  protected removeDisk(id: string): void {
    this.s.update((v) => ({ ...v, disks: v.disks.filter((d) => d.id !== id) }));
  }

  protected openAdd(): void {
    this.addOpen.set(true);
  }
  protected add(kind: 'nic' | 'disk' | 'dvd'): void {
    if (kind === 'nic') {
      this.s.update((v) => ({
        ...v,
        adapters: [
          ...v.adapters,
          {
            id: this.nextId('a'),
            name: 'Network Adapter',
            switch: 'External',
            vlanOn: false,
            vlan: 1,
          },
        ],
      }));
      this.active.set('network');
      this.toast.success('Network adapter added');
    } else if (kind === 'disk') {
      this.s.update((v) => ({
        ...v,
        disks: [
          ...v.disks,
          {
            id: this.nextId('d'),
            name: 'new-disk.vhdx',
            sizeGb: 100,
            controller: 'SCSI Controller',
            kind: 'Dynamic',
          },
        ],
      }));
      this.active.set('disks');
      this.toast.success('Hard drive added');
    } else {
      this.patch({ dvd: 'boot.iso' });
      this.toast.success('DVD drive added');
    }
    this.addOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      this.apply();
    }
  }

  protected apply(): void {
    if (this.dirtyCount() === 0 || !this.valid()) return;
    this.original.set(clone(this.s()));
    this.toast.success(`Settings applied to ${this.s().name}`);
  }
  protected discard(): void {
    this.s.set(clone(this.original()));
  }
}
