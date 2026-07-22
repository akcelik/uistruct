import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  StrctBadge,
  StrctButton,
  StrctBytesPipe,
  StrctDiff,
  StrctDurationPipe,
  StrctLogLine,
  StrctLogViewer,
  StrctRatePipe,
  StrctSiPipe,
  StrctTimeRange,
  StrctTimeRangePicker,
  strctFormatDuration,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

const RUNNING_CONF = [
  'server:',
  '  host: 0.0.0.0',
  '  port: 8443',
  '  tls:',
  '    enabled: true',
  '    cert: /etc/pki/hv-02.crt',
  'pools:',
  '  - name: default',
  '    size: 16',
  '    overflow: 4',
  'logging:',
  '  level: info',
  '  targets:',
  '    - syslog',
  'metrics:',
  '  enabled: true',
  '  interval: 30s',
  'features:',
  '  drs: true',
  '  ha: true',
].join('\n');

const DRAFT_CONF = RUNNING_CONF.replace('    size: 16', '    size: 32')
  .replace('  level: info', '  level: warn')
  .replace('  interval: 30s', '  interval: 15s')
  .replace('features:', 'features:\n  vsan: true');

const LOG_TEMPLATES: { text: string; level?: StrctLogLine['level'] }[] = [
  { text: 'INFO  reconcile loop completed in 42ms' },
  { text: 'INFO  heartbeat from hv-01.dc-east ok' },
  { text: 'DEBUG cache hit ratio 0.94' },
  { text: 'WARN  datastore-ssd-01 at 83% capacity', level: 'warn' },
  { text: 'INFO  vm web-02 cpu steal 2%' },
  { text: 'ERROR fan redundancy lost on hv-02', level: 'error' },
  { text: 'INFO  \u001b[32mbackup job finished\u001b[0m in 12m 4s' },
  { text: 'INFO  \u001b[1;34msnapshot\u001b[0m created for db-primary' },
];

@Component({
  selector: 'app-ops-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    DemoBlock,
    StrctBadge,
    StrctButton,
    StrctTimeRangePicker,
    StrctLogViewer,
    StrctDiff,
    StrctBytesPipe,
    StrctRatePipe,
    StrctDurationPipe,
    StrctSiPipe,
  ],
  template: `
    <app-page-header
      title="Ops"
      subtitle="The monitoring-console trio — time-range picking, log tailing and config diffing — plus the unit formatting they all speak."
    />

    <app-demo
      anchor="time-range"
      heading="Time range"
      description="The control charts hang off: Grafana-conventional quick ranges plus an absolute from/to editor in one dialog popover. Presets stamp presetId so your refresh tick can re-resolve them against now."
      code='<strct-time-range [(range)]="range" (applied)="reload($event)" />'
    >
      <div class="ops-row">
        <strct-time-range [(range)]="range" />
        <span class="echo">· sm toolbar:</span>
        <strct-time-range size="sm" [(range)]="range" />
        <button strct-button size="sm" variant="neutral">Live</button>
        <button strct-button size="sm" variant="neutral">Refresh</button>
        @if (range(); as r) {
          <span class="echo">
            {{ r.from.toLocaleString() }} → {{ r.to.toLocaleString() }}
            @if (r.presetId) {
              <strct-badge status="accent">{{ r.presetId }}</strct-badge>
            }
            · {{ windowLabel() }}
          </span>
        } @else {
          <span class="echo">no range selected yet</span>
        }
      </div>
    </app-demo>

    <app-demo
      anchor="log-viewer"
      heading="Log viewer"
      description="A virtualized log tail: only the visible window is in the DOM, follow mode sticks to the tail (scroll up to pause, bottom or the button to resume), ANSI colors map to theme tokens and ERROR/WARN lines tint via status fills."
      code='<strct-log-viewer [lines]="lines()" [(follow)]="follow" [height]="300" />'
    >
      <div class="ops-stack">
        <div class="ops-row">
          <button
            strct-button
            size="sm"
            [variant]="streaming() ? 'primary' : 'neutral'"
            (click)="toggleStream()"
          >
            {{ streaming() ? 'Stop stream' : 'Start stream' }}
          </button>
          <button strct-button size="sm" variant="flat" (click)="seedBurst()">+5k lines</button>
          <span class="echo">follow: {{ follow() ? 'on' : 'paused' }}</span>
        </div>
        <strct-log-viewer
          style="width: 100%"
          [lines]="logLines()"
          [(follow)]="follow"
          [height]="280"
          title="hv-02 · kernel + services"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="diff"
      heading="Diff"
      description="Line diff for change-approval screens: unified or side-by-side split, +/− symbol marking (never color alone), add/del counts in the header and long unchanged runs folded behind an expandable row."
      code='<strct-diff [before]="running" [after]="draft" mode="split" beforeLabel="Running" afterLabel="Draft" />'
    >
      <div class="ops-stack">
        <div class="ops-row">
          <button
            strct-button
            size="sm"
            [variant]="diffMode() === 'unified' ? 'primary' : 'neutral'"
            (click)="diffMode.set('unified')"
          >
            Unified
          </button>
          <button
            strct-button
            size="sm"
            [variant]="diffMode() === 'split' ? 'primary' : 'neutral'"
            (click)="diffMode.set('split')"
          >
            Split
          </button>
        </div>
        <strct-diff
          style="width: 100%"
          [before]="runningConf"
          [after]="draftConf"
          [mode]="diffMode()"
          title="cluster-01.yaml"
          language="yaml"
          beforeLabel="Running"
          afterLabel="Draft"
          [maxHeight]="340"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="units"
      heading="Units & formatting"
      description="Bytes (binary KiB by default — what storage/memory actually mean), bit/s rates, two-unit durations and SI magnitudes; pure functions plus pipes, shared by charts and grids."
      [code]="unitsCode"
    >
      <table class="ops-units">
        <tbody>
          <tr>
            <td>memory</td>
            <td>{{ 68719476736 | strctBytes }}</td>
            <td class="ops-units__src">68719476736 | strctBytes</td>
          </tr>
          <tr>
            <td>datastore (decimal)</td>
            <td>{{ 2500000000000 | strctBytes: false }}</td>
            <td class="ops-units__src">2500000000000 | strctBytes: false</td>
          </tr>
          <tr>
            <td>nic rx</td>
            <td>{{ 2400000000 | strctRate }}</td>
            <td class="ops-units__src">2400000000 | strctRate</td>
          </tr>
          <tr>
            <td>uptime</td>
            <td>{{ 8215000 * 1000 | strctDuration }}</td>
            <td class="ops-units__src">8215000000 | strctDuration</td>
          </tr>
          <tr>
            <td>iops</td>
            <td>{{ 12400 | strctSi: 'IOPS' }}</td>
            <td class="ops-units__src">12400 | strctSi: 'IOPS'</td>
          </tr>
        </tbody>
      </table>
    </app-demo>
  `,
  styles: [
    `
      .ops-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .ops-stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
      }
      .echo {
        font-size: 12.5px;
        color: var(--t2);
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .ops-units {
        border-collapse: collapse;
        font-size: 13px;
      }
      .ops-units td {
        padding: 6px 18px 6px 0;
        color: var(--t1);
      }
      .ops-units td:first-child {
        color: var(--t2);
      }
      .ops-units__src {
        font-family: var(--mono);
        font-size: 11.5px;
        color: var(--t3);
      }
    `,
  ],
})
export class OpsPage {
  private readonly destroyRef = inject(DestroyRef);

  // Time range
  protected readonly range = signal<StrctTimeRange | null>(null);
  protected windowLabel(): string {
    const r = this.range();
    return r ? strctFormatDuration(r.to.getTime() - r.from.getTime()) : '';
  }

  // Log viewer
  protected readonly logLines = signal<(string | StrctLogLine)[]>(
    LOG_TEMPLATES.slice(0, 6).map((t) => stamp(t)),
  );
  protected readonly follow = signal(true);
  protected readonly streaming = signal(false);
  private timer: ReturnType<typeof setInterval> | undefined;

  protected toggleStream(): void {
    if (this.streaming()) {
      clearInterval(this.timer);
      this.streaming.set(false);
      return;
    }
    this.streaming.set(true);
    let i = 0;
    this.timer = setInterval(() => {
      const t = LOG_TEMPLATES[i++ % LOG_TEMPLATES.length];
      this.logLines.update((lines) => [...lines, stamp(t)]);
    }, 600);
  }

  protected seedBurst(): void {
    const burst: StrctLogLine[] = [];
    for (let i = 0; i < 5000; i++) burst.push(stamp(LOG_TEMPLATES[i % LOG_TEMPLATES.length]));
    this.logLines.update((lines) => [...lines, ...burst]);
  }

  constructor() {
    this.destroyRef.onDestroy(() => clearInterval(this.timer));
  }

  protected readonly unitsCode =
    "{{ vm.memBytes | strctBytes }} \u00b7 {{ nic.rxBps | strctRate }} \u00b7 {{ elapsedMs | strctDuration }} \u00b7 {{ iops | strctSi : 'IOPS' }}";

  // Diff
  protected readonly diffMode = signal<'unified' | 'split'>('unified');
  protected readonly runningConf = RUNNING_CONF;
  protected readonly draftConf = DRAFT_CONF;
}

function stamp(t: { text: string; level?: StrctLogLine['level'] }): StrctLogLine {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    text: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${t.text}`,
    level: t.level,
  };
}
