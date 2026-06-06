import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  StrctBadge,
  StrctContextMenu,
  StrctDropdownItem,
  StrctIcon,
  StrctStack,
  StrctStackItem,
  StrctTab,
  StrctTabs,
} from 'strct';
import { LastVisitedService } from '../services/last-visited.service';
import { MockDataService } from '../services/mock-data.service';
import type { DcObject } from '../services/mock-data.service';

function badgeFor(status: DcObject['status']) {
  switch (status) {
    case 'running':
      return 'success';
    case 'warning':
      return 'warning';
    case 'stopped':
      return 'neutral';
    case 'maintenance':
      return 'neutral';
    default:
      return 'neutral';
  }
}

@Component({
  selector: 'app-category-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    StrctIcon,
    StrctBadge,
    StrctStack,
    StrctStackItem,
    StrctTabs,
    StrctTab,
    StrctContextMenu,
    StrctDropdownItem,
  ],
  template: `
    <div class="category-page">
      <aside class="object-list">
        <div class="object-list__header">{{ categoryLabel() }}</div>
        <nav class="object-list__nav">
          @for (obj of objectsWithStatus(); track obj.id) {
            <strct-context-menu>
              <a
                class="object-list__item"
                [routerLink]="['/', category(), obj.id]"
                [class.is-active]="obj.id === activeId()"
              >
                <strct-icon
                  [name]="obj.id === 'default-appliance' ? 'box' : 'server'"
                  [size]="16"
                  [strokeWidth]="1.6"
                />
                <span class="object-list__name">{{ obj.name }}</span>
                <span
                  class="object-list__status"
                  [class.is-running]="obj.status === 'running'"
                  [class.is-warning]="obj.status === 'warning'"
                  [class.is-stopped]="obj.status === 'stopped'"
                  [class.is-maintenance]="obj.status === 'maintenance'"
                ></span>
              </a>

              <ng-container strctContextMenuItems>
                @if (obj.status === 'maintenance') {
                  <strct-dropdown-item (click)="toggleMaintenance(obj.id, false)">
                    Exit Maintenance
                  </strct-dropdown-item>
                } @else {
                  <strct-dropdown-item (click)="toggleMaintenance(obj.id, true)">
                    Enter Maintenance
                  </strct-dropdown-item>
                }
              </ng-container>
            </strct-context-menu>
          }
        </nav>
      </aside>

      <div class="object-detail">
        <strct-tabs>
          <strct-tab label="Datacenters">
            @if (activeObjectWithStatus(); as obj) {
              <div class="detail-header">
                <h1 class="detail-title">{{ obj.name }}</h1>
                <strct-badge [status]="badgeFor(obj.status)">{{ obj.status }}</strct-badge>
              </div>
              <p class="detail-desc">{{ obj.description }}</p>
              @if (specEntries().length) {
                <div class="detail-card">
                  <div class="detail-card__title">Specifications</div>
                  <strct-stack style="width: 100%; max-width: 480px;">
                    @for (entry of specEntries(); track entry.key) {
                      <strct-stack-item [label]="entry.key">{{ entry.value }}</strct-stack-item>
                    }
                  </strct-stack>
                </div>
              }
            }
          </strct-tab>

          <strct-tab label="Overview">
            <div class="overview">
              <h1 class="detail-title">{{ categoryLabel() }} Overview</h1>
              <p class="detail-desc">
                Welcome to the {{ categoryLabel() }} category. This is the default appliance landing
                page. Use the object list on the left to explore individual resources, or review the
                summary below.
              </p>
              <div class="detail-card">
                <div class="detail-card__title">Category Summary</div>
                <strct-stack style="width: 100%; max-width: 480px;">
                  <strct-stack-item label="Total objects">{{ objectsWithStatus().length }}</strct-stack-item>
                  <strct-stack-item label="Running">{{ runningCount() }}</strct-stack-item>
                  <strct-stack-item label="Warnings">{{ warningCount() }}</strct-stack-item>
                  <strct-stack-item label="Stopped">{{ stoppedCount() }}</strct-stack-item>
                  <strct-stack-item label="In Maintenance">{{ maintenanceCount() }}</strct-stack-item>
                </strct-stack>
              </div>
            </div>
          </strct-tab>
        </strct-tabs>
      </div>
    </div>
  `,
  styles: [
    `
      .category-page {
        display: flex;
        gap: 24px;
        height: 100%;
        min-height: 0;
      }
      .object-list {
        display: flex;
        flex-direction: column;
        width: 240px;
        min-width: 240px;
        border-right: 1px solid var(--b2);
        padding-right: 16px;
      }
      .object-list__header {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--t3);
        padding: 0 8px 12px;
        border-bottom: 1px solid var(--b2);
        margin-bottom: 8px;
      }
      .object-list__nav {
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow-y: auto;
      }
      .object-list__item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 6px;
        color: var(--t2);
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
        transition: background 0.12s ease, color 0.12s ease;
      }
      .object-list__item:hover {
        background: var(--surface-hover, var(--b1));
        color: var(--t1);
      }
      .object-list__item.is-active {
        background: var(--acc-muted, var(--b2));
        color: var(--acc);
      }
      .object-list__name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .object-list__status {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .object-list__status.is-running {
        background: var(--success);
      }
      .object-list__status.is-warning {
        background: var(--warning);
      }
      .object-list__status.is-stopped {
        background: var(--t4);
      }
      .object-list__status.is-maintenance {
        background: var(--accent);
      }

      .object-detail {
        flex: 1;
        min-width: 0;
        padding-top: 4px;
      }
      .detail-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }
      .detail-title {
        font-size: 20px;
        font-weight: 700;
        color: var(--t1);
        margin: 0;
      }
      .detail-desc {
        font-size: 13px;
        line-height: 1.6;
        color: var(--t2);
        margin: 0 0 20px;
        max-width: 720px;
      }
      .detail-card {
        background: var(--surface, var(--b1));
        border: 1px solid var(--b2);
        border-radius: 8px;
        padding: 16px;
        max-width: 520px;
      }
      .detail-card__title {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--t3);
        margin-bottom: 12px;
      }
    `,
  ],
})
export class CategoryPage {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(MockDataService);
  private readonly lastVisited = inject(LastVisitedService);

  private readonly params = toSignal(
    this.route.paramMap.pipe(map((p) => ({ category: p.get('category')!, id: p.get('id') }))),
    { initialValue: { category: 'compute', id: null as string | null } },
  );

  readonly category = computed(() => this.params().category);
  readonly activeId = computed(() => this.params().id ?? 'default-appliance');

  readonly categoryLabel = computed(() => {
    const c = this.category();
    const map: Record<string, string> = {
      compute: 'Compute',
      vm: 'Virtual Machines',
      network: 'Network',
      storage: 'Storage',
    };
    return map[c] ?? c;
  });

  /** Set of object IDs currently forced into maintenance mode. */
  private readonly maintenanceIds = signal<Set<string>>(new Set());

  private overrideStatus(obj: DcObject): DcObject {
    if (this.maintenanceIds().has(obj.id)) {
      return { ...obj, status: 'maintenance' as const };
    }
    return obj;
  }

  readonly objectsWithStatus = computed(() =>
    this.dataService.getObjects(this.category()).map((o) => this.overrideStatus(o)),
  );

  readonly activeObjectWithStatus = computed(() => {
    const id = this.activeId();
    return this.objectsWithStatus().find((o) => o.id === id);
  });

  readonly objects = computed(() => this.dataService.getObjects(this.category()));
  readonly activeObject = computed(() =>
    this.dataService.getObject(this.category(), this.activeId()),
  );

  readonly specEntries = computed(() => {
    const obj = this.activeObjectWithStatus();
    if (!obj?.specs) return [];
    return Object.entries(obj.specs).map(([key, value]) => ({ key, value }));
  });

  readonly runningCount = computed(
    () => this.objectsWithStatus().filter((o) => o.status === 'running').length,
  );
  readonly warningCount = computed(
    () => this.objectsWithStatus().filter((o) => o.status === 'warning').length,
  );
  readonly stoppedCount = computed(
    () => this.objectsWithStatus().filter((o) => o.status === 'stopped').length,
  );
  readonly maintenanceCount = computed(
    () => this.objectsWithStatus().filter((o) => o.status === 'maintenance').length,
  );

  constructor() {
    effect(() => {
      const id = this.activeId();
      const cat = this.category();
      if (id && id !== 'default-appliance') {
        this.lastVisited.set(cat, id);
      }
    });
  }

  toggleMaintenance(id: string, enter: boolean): void {
    this.maintenanceIds.update((set) => {
      const next = new Set(set);
      if (enter) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  protected badgeFor = badgeFor;
}
