import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctButton,
  StrctCascadeOption,
  StrctCascadeSelect,
  StrctCheckbox,
  StrctChips,
  StrctColorPicker,
  StrctCombobox,
  StrctDatepicker,
  StrctField,
  StrctFile,
  StrctInput,
  StrctInputMask,
  StrctInputOtp,
  StrctKnob,
  StrctOption,
  StrctPassword,
  StrctRadio,
  StrctRadioGroup,
  StrctRange,
  StrctRating,
  StrctSegmented,
  StrctSegmentedOption,
  StrctToggle,
  StrctValidationState,
  StrctTransfer,
  StrctTransferItem,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-forms-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    DemoBlock,
    FormsModule,
    StrctButton,
    StrctField,
    StrctInput,
    StrctCheckbox,
    StrctToggle,
    StrctRadio,
    StrctRadioGroup,
    StrctSegmented,
    StrctRange,
    StrctCombobox,
    StrctDatepicker,
    StrctPassword,
    StrctFile,
    StrctColorPicker,
    StrctCascadeSelect,
    StrctRating,
    StrctChips,
    StrctInputOtp,
    StrctKnob,
    StrctInputMask,
    StrctTransfer,
  ],
  template: `
    <app-page-header
      title="Forms"
      subtitle="Native controls styled by the strctInput directive, plus custom checkbox, toggle and radio components — all ControlValueAccessor-compatible."
    />

    <app-demo
      anchor="field"
      heading="Form field"
      description="Wrap any control for a consistent label, required marker, hint and error — aria-describedby and aria-invalid are wired automatically. Type an address without an @ to see the error state."
      code='<strct-field label="Email" required hint="…" [error]="err()"><input strctInput /></strct-field>'
    >
      <div class="field">
        <strct-field label="Email" required hint="We'll never share it." [error]="emailError()">
          <input
            strctInput
            type="email"
            placeholder="you@example.com"
            [ngModel]="fieldEmail()"
            (ngModelChange)="fieldEmail.set($event)"
          />
        </strct-field>
      </div>
    </app-demo>

    <app-demo
      anchor="field-validation"
      heading="Async validation state"
      description="A first-class checking → ok / warning / error affordance: a trailing spinner / check / warning plus the reason in the hint slot (aria-live). Simulate a live NTP-server reachability check:"
      code='<strct-field label="NTP server" [validationState]="probe()"><input strctInput /></strct-field>'
    >
      <div class="field">
        <strct-field
          label="NTP server"
          hint="We check reachability as you type."
          [validationState]="probe()"
        >
          <input strctInput placeholder="time.example.com" [(ngModel)]="ntpServer" />
        </strct-field>
        <div class="vstate-btns">
          <button strct-button size="sm" variant="flat" (click)="probe.set({ status: 'idle' })">
            Idle
          </button>
          <button
            strct-button
            size="sm"
            variant="flat"
            (click)="probe.set({ status: 'checking', message: 'Checking reachability…' })"
          >
            Checking
          </button>
          <button
            strct-button
            size="sm"
            variant="flat"
            (click)="probe.set({ status: 'ok', message: 'Reachable · stratum 3' })"
          >
            OK
          </button>
          <button
            strct-button
            size="sm"
            variant="flat"
            (click)="probe.set({ status: 'warning', message: 'High latency (420ms)' })"
          >
            Warning
          </button>
          <button
            strct-button
            size="sm"
            variant="flat"
            (click)="probe.set({ status: 'error', message: 'Unreachable' })"
          >
            Error
          </button>
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="input"
      heading="Input"
      description="Text input wearing the shared control style."
      code='<input strctInput placeholder="Your name" [(ngModel)]="name" />'
    >
      <div class="field">
        <input
          strctInput
          placeholder="Your name"
          [ngModel]="name()"
          (ngModelChange)="name.set($event)"
        />
        <span class="echo">value: {{ name() || '—' }}</span>
      </div>
    </app-demo>

    <app-demo anchor="textarea" heading="Textarea" description="Multi-line, vertically resizable.">
      <textarea strctInput rows="3" placeholder="Notes…"></textarea>
    </app-demo>

    <app-demo anchor="select" heading="Select" description="Native select with a custom chevron.">
      <select strctInput [ngModel]="region()" (ngModelChange)="region.set($event)">
        <option value="eu">Europe</option>
        <option value="us">Americas</option>
        <option value="apac">Asia Pacific</option>
      </select>
    </app-demo>

    <app-demo
      anchor="checkbox"
      heading="Checkbox"
      description="Custom box with form binding."
      code='<strct-checkbox [(ngModel)]="agree">I agree</strct-checkbox>'
    >
      <div class="stack">
        <strct-checkbox [ngModel]="agree()" (ngModelChange)="agree.set($event)">
          Accept terms
        </strct-checkbox>
        <strct-checkbox [ngModel]="true" disabled>Pre-checked & disabled</strct-checkbox>
      </div>
    </app-demo>

    <app-demo anchor="toggle" heading="Toggle" description="On/off switch.">
      <div class="stack">
        <strct-toggle [ngModel]="notify()" (ngModelChange)="notify.set($event)">
          Email notifications
        </strct-toggle>
        <strct-toggle [ngModel]="false" disabled>Disabled</strct-toggle>
      </div>
    </app-demo>

    <app-demo
      anchor="radio"
      heading="Radio group"
      description="Single choice from a set."
      code='<strct-radio-group [(ngModel)]="size">…</strct-radio-group>'
    >
      <strct-radio-group [ngModel]="size()" (ngModelChange)="size.set($event)">
        <strct-radio [value]="'sm'">Small</strct-radio>
        <strct-radio [value]="'md'">Medium</strct-radio>
        <strct-radio [value]="'lg'">Large</strct-radio>
      </strct-radio-group>
      <span class="echo">selected: {{ size() }}</span>
    </app-demo>

    <app-demo
      anchor="segmented"
      heading="Segmented"
      description="One-of-N selection as a joined segmented control — for mode pickers and list filters. Keyboard accessible (role=radiogroup, arrow keys)."
      code='<strct-segmented [options]="filters" [(ngModel)]="filter" size="sm" />'
    >
      <div class="seg-demo">
        <strct-segmented
          [options]="[
            { value: false, label: 'Disabled' },
            { value: true, label: 'Enabled' },
          ]"
          [(ngModel)]="ntpEnabled"
        />
        <strct-segmented [options]="taskFilters" [(ngModel)]="filter" size="sm" />
        <span class="echo">NTP: {{ ntpEnabled() }} · filter: {{ filter() }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="range"
      heading="Slider"
      description="Range input with a filled track and live value."
      code='<strct-range [min]="0" [max]="100" [(ngModel)]="volume" showValue />'
    >
      <strct-range
        [min]="0"
        [max]="100"
        [ngModel]="volume()"
        (ngModelChange)="volume.set($event)"
        showValue
      />
    </app-demo>

    <app-demo
      anchor="combobox"
      heading="Combobox"
      description="Type to filter, click to select. ControlValueAccessor-compatible."
      code='<strct-combobox [options]="cities" [(ngModel)]="city" />'
    >
      <strct-combobox
        [options]="cities"
        [ngModel]="city()"
        (ngModelChange)="city.set($event)"
        placeholder="Search a city…"
      />
      <span class="echo">value: {{ city() ?? '—' }}</span>
    </app-demo>

    <app-demo
      anchor="datepicker"
      heading="Date picker"
      description="Calendar popover; value is an ISO date string."
      code='<strct-datepicker [(ngModel)]="date" />'
    >
      <strct-datepicker [ngModel]="date()" (ngModelChange)="date.set($event)" />
      <span class="echo">value: {{ date() || '—' }}</span>
    </app-demo>

    <app-demo
      anchor="password"
      heading="Password"
      description="Reveal toggle and an optional strength meter."
      code='<strct-password [(ngModel)]="pw" meter />'
    >
      <strct-password
        [ngModel]="pw()"
        (ngModelChange)="pw.set($event)"
        placeholder="Enter a password"
        meter
      />
    </app-demo>

    <app-demo
      anchor="file"
      heading="File upload"
      description="Drag and drop or browse; shows selected files. Value is a File[]."
      code='<strct-file [(ngModel)]="files" multiple />'
    >
      <strct-file [ngModel]="files()" (ngModelChange)="files.set($event)" multiple />
    </app-demo>

    <app-demo
      anchor="colorpicker"
      heading="Color picker"
      description="Preset swatches plus a hex field. Value is a #rrggbb string."
      code='<strct-color-picker [(ngModel)]="color" />'
    >
      <strct-color-picker [ngModel]="color()" (ngModelChange)="color.set($event)" />
      <span class="echo">value: {{ color() || '—' }}</span>
    </app-demo>

    <app-demo
      anchor="cascade"
      heading="Cascade select"
      description="Pick a leaf from nested groups — e.g. a port group under a virtual switch."
      code='<strct-cascade-select [options]="switches" [(ngModel)]="portGroup" />'
    >
      <strct-cascade-select
        [options]="switches"
        [ngModel]="portGroup()"
        (ngModelChange)="portGroup.set($event)"
        placeholder="Select a port group…"
      />
      <span class="echo">value: {{ portGroup() ?? '—' }}</span>
    </app-demo>

    <app-demo
      anchor="rating"
      heading="Rating"
      description="Star rating; click the active star again to clear."
      code='<strct-rating [(ngModel)]="score" />'
    >
      <strct-rating [ngModel]="score()" (ngModelChange)="score.set($event)" />
      <span class="echo">value: {{ score() }}</span>
    </app-demo>

    <app-demo
      anchor="chips"
      heading="Chips"
      description="Type a tag and press Enter; Backspace removes the last. Value is a string[]."
      code='<strct-chips [(ngModel)]="labels" placeholder="Add a tag…" />'
    >
      <strct-chips
        [ngModel]="labels()"
        (ngModelChange)="labels.set($event)"
        placeholder="Add a tag…"
      />
      <span class="echo">value: [{{ labels().join(', ') }}]</span>
    </app-demo>

    <app-demo
      anchor="otp"
      heading="Input OTP"
      description="One-time-password boxes with auto-advance, backspace and paste."
      code='<strct-input-otp [length]="6" [(ngModel)]="code" />'
    >
      <strct-input-otp [length]="6" [ngModel]="code()" (ngModelChange)="code.set($event)" />
      <span class="echo">value: {{ code() || '—' }}</span>
    </app-demo>

    <app-demo
      anchor="knob"
      heading="Knob"
      description="Rotary dial — drag, use the arrow keys, or scroll. CVA-compatible."
      code='<strct-knob [min]="0" [max]="100" [(ngModel)]="fan" label="Fan" />'
    >
      <strct-knob
        [ngModel]="fan()"
        (ngModelChange)="fan.set($event)"
        label="Fan %"
        status="accent"
      />
      <strct-knob
        [ngModel]="temp()"
        (ngModelChange)="temp.set($event)"
        [min]="0"
        [max]="120"
        label="°C"
        status="warning"
      />
    </app-demo>

    <app-demo
      anchor="inputmask"
      heading="Input mask"
      description="Formatted entry. Tokens: 9 = digit, A = letter, * = alphanumeric; the rest are literals."
      code='<strct-input-mask mask="(999) 999 99 99" [(ngModel)]="phone" />'
    >
      <div class="field">
        <span class="echo">Phone</span>
        <strct-input-mask
          mask="(999) 999 99 99"
          [ngModel]="phone()"
          (ngModelChange)="phone.set($event)"
        />
      </div>
      <div class="field">
        <span class="echo">National ID (TR)</span>
        <strct-input-mask
          mask="99999999999"
          [ngModel]="tckn()"
          (ngModelChange)="tckn.set($event)"
        />
      </div>
      <div class="field">
        <span class="echo">Card</span>
        <strct-input-mask
          mask="9999 9999 9999 9999"
          [ngModel]="card()"
          (ngModelChange)="card.set($event)"
        />
      </div>
      <div class="field">
        <span class="echo">MAC address</span>
        <strct-input-mask
          mask="HH:HH:HH:HH:HH:HH"
          uppercase
          [ngModel]="mac()"
          (ngModelChange)="mac.set($event)"
        />
      </div>
      <div class="field">
        <span class="echo">WWPN</span>
        <strct-input-mask
          mask="HH:HH:HH:HH:HH:HH:HH:HH"
          uppercase
          [ngModel]="wwpn()"
          (ngModelChange)="wwpn.set($event)"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="transfer"
      heading="Transfer"
      description="Dual-list picklist for membership editing — assign hosts to a cluster. Checkbox multi-select, move buttons, a searchbox per side; [(assigned)] is the two-way id set."
      code='<strct-transfer [items]="hosts" [(assigned)]="clusterHosts" (moved)="log($event)" />'
    >
      <div style="width: 100%; max-width: 640px; display: flex; flex-direction: column; gap: 8px;">
        <strct-transfer [items]="tfHosts" [(assigned)]="tfAssigned" />
        <span class="echo">assigned: {{ tfAssigned().join(', ') || '—' }}</span>
      </div>
    </app-demo>
  `,
  styles: [
    `
      .field {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        max-width: 320px;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .echo {
        font-size: 12px;
        color: var(--t2);
        font-family: var(--mono);
      }
      select,
      textarea,
      input {
        max-width: 320px;
      }
      .seg-demo {
        display: flex;
        flex-direction: column;
        gap: 14px;
        align-items: flex-start;
      }
      .vstate-btns {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }
    `,
  ],
})
export class FormsPage {
  protected readonly tfHosts: StrctTransferItem[] = [
    { id: 'hv-01', label: 'hv-01.dc-east', icon: 'host' },
    { id: 'hv-02', label: 'hv-02.dc-east', icon: 'host' },
    { id: 'hv-03', label: 'hv-03.dc-east', icon: 'host' },
    { id: 'hv-04', label: 'hv-04.dc-west', icon: 'host' },
    { id: 'hv-05', label: 'hv-05.dc-west', icon: 'host', disabled: true },
  ];
  protected readonly tfAssigned = signal<string[]>(['hv-01']);

  protected readonly fieldEmail = signal('');
  protected readonly emailError = computed(() => {
    const v = this.fieldEmail();
    return v && !v.includes('@') ? 'Enter a valid email address.' : '';
  });

  protected readonly name = signal('');
  protected readonly region = signal('eu');
  protected readonly agree = signal(false);
  protected readonly notify = signal(true);
  protected readonly size = signal('md');
  protected readonly ntpServer = signal('');
  protected readonly probe = signal<StrctValidationState>({ status: 'idle' });
  protected readonly ntpEnabled = signal<unknown>(true);
  protected readonly filter = signal<unknown>('all');
  protected readonly taskFilters: StrctSegmentedOption[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'failed', label: 'Failed' },
  ];
  protected readonly volume = signal(60);
  protected readonly city = signal<unknown>(null);
  protected readonly date = signal('');
  protected readonly pw = signal('');
  protected readonly files = signal<File[]>([]);
  protected readonly color = signal('#7b9ec8');
  protected readonly portGroup = signal<unknown>(null);
  protected readonly score = signal(3);
  protected readonly labels = signal<string[]>(['production', 'eu-west']);
  protected readonly code = signal('');
  protected readonly fan = signal(45);
  protected readonly temp = signal(60);
  protected readonly phone = signal('');
  protected readonly tckn = signal('');
  protected readonly card = signal('');
  protected readonly mac = signal('');
  protected readonly wwpn = signal('');

  protected readonly switches: StrctCascadeOption[] = [
    {
      label: 'Switch-A',
      children: [
        { label: 'Management', value: 'pg-mgmt' },
        { label: 'Live Migration', value: 'pg-livemig' },
        { label: 'Storage', value: 'pg-storage' },
      ],
    },
    {
      label: 'Switch-B',
      children: [
        { label: 'Production', value: 'pg-prod' },
        { label: 'DMZ', value: 'pg-dmz' },
      ],
    },
    {
      label: 'Core-Switch',
      children: [
        { label: 'App Tier', value: 'pg-app' },
        { label: 'DB Tier', value: 'pg-db' },
      ],
    },
  ];

  protected readonly cities: StrctOption[] = [
    { value: 'ist', label: 'Istanbul' },
    { value: 'ams', label: 'Amsterdam' },
    { value: 'ber', label: 'Berlin' },
    { value: 'lon', label: 'London' },
    { value: 'par', label: 'Paris' },
    { value: 'mad', label: 'Madrid' },
    { value: 'rom', label: 'Rome' },
  ];
}
