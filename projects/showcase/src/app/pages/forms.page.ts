import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctCascadeOption,
  StrctCascadeSelect,
  StrctCheckbox,
  StrctChips,
  StrctColorPicker,
  StrctCombobox,
  StrctDatepicker,
  StrctFile,
  StrctInput,
  StrctInputOtp,
  StrctOption,
  StrctPassword,
  StrctRadio,
  StrctRadioGroup,
  StrctRange,
  StrctRating,
  StrctToggle,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-forms-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    DemoBlock,
    FormsModule,
    StrctInput,
    StrctCheckbox,
    StrctToggle,
    StrctRadio,
    StrctRadioGroup,
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
  ],
  template: `
    <app-page-header
      title="Forms"
      subtitle="Native controls styled by the strctInput directive, plus custom checkbox, toggle and radio components — all ControlValueAccessor-compatible."
    />

    <app-demo
      anchor="input"
      heading="Input"
      description="Text input wearing the shared control style."
      code="<input strctInput placeholder=&quot;Your name&quot; [(ngModel)]=&quot;name&quot; />"
    >
      <div class="field">
        <input strctInput placeholder="Your name" [ngModel]="name()" (ngModelChange)="name.set($event)" />
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
      code="<strct-checkbox [(ngModel)]=&quot;agree&quot;>I agree</strct-checkbox>"
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
      code="<strct-radio-group [(ngModel)]=&quot;size&quot;>…</strct-radio-group>"
    >
      <strct-radio-group [ngModel]="size()" (ngModelChange)="size.set($event)">
        <strct-radio [value]="'sm'">Small</strct-radio>
        <strct-radio [value]="'md'">Medium</strct-radio>
        <strct-radio [value]="'lg'">Large</strct-radio>
      </strct-radio-group>
      <span class="echo">selected: {{ size() }}</span>
    </app-demo>

    <app-demo
      anchor="range"
      heading="Slider"
      description="Range input with a filled track and live value."
      code="<strct-range [min]=&quot;0&quot; [max]=&quot;100&quot; [(ngModel)]=&quot;volume&quot; showValue />"
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
      code="<strct-combobox [options]=&quot;cities&quot; [(ngModel)]=&quot;city&quot; />"
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
      code="<strct-datepicker [(ngModel)]=&quot;date&quot; />"
    >
      <strct-datepicker [ngModel]="date()" (ngModelChange)="date.set($event)" />
      <span class="echo">value: {{ date() || '—' }}</span>
    </app-demo>

    <app-demo
      anchor="password"
      heading="Password"
      description="Reveal toggle and an optional strength meter."
      code="<strct-password [(ngModel)]=&quot;pw&quot; meter />"
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
      code="<strct-file [(ngModel)]=&quot;files&quot; multiple />"
    >
      <strct-file [ngModel]="files()" (ngModelChange)="files.set($event)" multiple />
    </app-demo>

    <app-demo
      anchor="colorpicker"
      heading="Color picker"
      description="Preset swatches plus a hex field. Value is a #rrggbb string."
      code="<strct-color-picker [(ngModel)]=&quot;color&quot; />"
    >
      <strct-color-picker [ngModel]="color()" (ngModelChange)="color.set($event)" />
      <span class="echo">value: {{ color() || '—' }}</span>
    </app-demo>

    <app-demo
      anchor="cascade"
      heading="Cascade select"
      description="Pick a leaf from nested groups — e.g. a port group under a virtual switch."
      code="<strct-cascade-select [options]=&quot;switches&quot; [(ngModel)]=&quot;portGroup&quot; />"
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
      code="<strct-rating [(ngModel)]=&quot;score&quot; />"
    >
      <strct-rating [ngModel]="score()" (ngModelChange)="score.set($event)" />
      <span class="echo">value: {{ score() }}</span>
    </app-demo>

    <app-demo
      anchor="chips"
      heading="Chips"
      description="Type a tag and press Enter; Backspace removes the last. Value is a string[]."
      code="<strct-chips [(ngModel)]=&quot;labels&quot; placeholder=&quot;Add a tag…&quot; />"
    >
      <strct-chips [ngModel]="labels()" (ngModelChange)="labels.set($event)" placeholder="Add a tag…" />
      <span class="echo">value: [{{ labels().join(', ') }}]</span>
    </app-demo>

    <app-demo
      anchor="otp"
      heading="Input OTP"
      description="One-time-password boxes with auto-advance, backspace and paste."
      code="<strct-input-otp [length]=&quot;6&quot; [(ngModel)]=&quot;code&quot; />"
    >
      <strct-input-otp [length]="6" [ngModel]="code()" (ngModelChange)="code.set($event)" />
      <span class="echo">value: {{ code() || '—' }}</span>
    </app-demo>
  `,
  styles: [
    `
    .field { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 320px; }
    .stack { display: flex; flex-direction: column; gap: 12px; }
    .echo { font-size: 12px; color: var(--t2); font-family: var(--mono); }
    select, textarea, input { max-width: 320px; }
    `,
  ],
})
export class FormsPage {
  protected readonly name = signal('');
  protected readonly region = signal('eu');
  protected readonly agree = signal(false);
  protected readonly notify = signal(true);
  protected readonly size = signal('md');
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

  protected readonly switches: StrctCascadeOption[] = [
    {
      label: 'vSwitch0',
      children: [
        { label: 'Management', value: 'pg-mgmt' },
        { label: 'vMotion', value: 'pg-vmotion' },
        { label: 'Storage', value: 'pg-storage' },
      ],
    },
    {
      label: 'vSwitch1',
      children: [
        { label: 'Production', value: 'pg-prod' },
        { label: 'DMZ', value: 'pg-dmz' },
      ],
    },
    {
      label: 'DvSwitch-Core',
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
