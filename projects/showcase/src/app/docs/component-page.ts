import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  NgZone,
  Type,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { DemoFilter } from '../ui/demo';
import { ApiTable, Breadcrumb, Crumb, OnThisPage, PageRef, PrevNext, TocItem, UsageGuide } from './doc-ui';
import { ALL_COMPONENTS, DocCategory, PACKAGE_NAME, findComponent } from './registry';

interface CategoryHost {
  filter: DemoFilter;
  injector: Injector;
  component: Type<unknown>;
}

/** Dynamic documentation page for /components/:id. */
@Component({
  selector: 'app-component-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, ApiTable, UsageGuide, Breadcrumb, PrevNext, OnThisPage],
  template: `
    @let c = component();
    @if (c) {
      <div class="doc">
        <article class="doc__main">
          <app-breadcrumb [items]="crumbs()" />
          <h1 class="doc__title">{{ c.title }}</h1>
          <p class="doc__lead">{{ c.lead }}</p>

          <div class="doc__import">
            <div class="doc__import-head">
              <span class="doc__import-cap">Import</span>
              <code class="doc__selector">{{ c.selector }}</code>
            </div>
            <pre class="doc__import-code"><code>{{ importLine() }}</code></pre>
          </div>

          <section id="examples" data-toc data-toc-label="Examples" class="doc__examples">
            <h2 class="doc__h2">Examples</h2>
            @if (examplesComponent()) {
              <ng-container
                [ngComponentOutlet]="examplesComponent()!"
                [ngComponentOutletInjector]="examplesInjector()!"
              />
            }
          </section>

          @if (hasApi()) {
            <section id="api" data-toc data-toc-label="API reference" class="doc__section">
              <h2 class="doc__h2">API reference</h2>
              @if (c.inputs?.length) {
                <app-api-table title="Inputs" [rows]="c.inputs!" />
              }
              @if (c.outputs?.length) {
                <app-api-table title="Outputs" [rows]="c.outputs!" [showDefault]="false" />
              }
              @if (c.methods?.length) {
                <app-api-table title="Methods" [rows]="c.methods!" [showDefault]="false" />
              }
            </section>
          }

          @if (hasUsage()) {
            <section id="usage" data-toc data-toc-label="Usage" class="doc__section">
              <h2 class="doc__h2">Usage</h2>
              <app-usage [do]="c.do ?? []" [dont]="c.dont ?? []" />
              @if (c.a11y?.length) {
                <div class="doc__a11y">
                  <div class="doc__a11y-cap">Accessibility</div>
                  <ul>
                    @for (a of c.a11y!; track a) {
                      <li>{{ a }}</li>
                    }
                  </ul>
                </div>
              }
            </section>
          }

          <app-prev-next [prev]="prev()" [next]="next()" />
        </article>

        <div class="doc__aside">
          <app-on-this-page [items]="toc()" [active]="activeSection()" (select)="scrollTo($event)" />
        </div>
      </div>
    } @else {
      <p class="doc__missing">Unknown component.</p>
    }
  `,
  styles: [
    `
    .doc { display: grid; grid-template-columns: minmax(0, 1fr) 200px; gap: 36px; align-items: start; }
    .doc__main { min-width: 0; max-width: 880px; }
    .doc__title { margin: 0; font-size: 28px; font-weight: 650; color: var(--t1); letter-spacing: -0.01em; }
    .doc__lead { margin: 10px 0 0; font-size: 15px; line-height: 1.6; color: var(--t2); max-width: 72ch; }

    .doc__import { margin: 20px 0 28px; border: 1px solid var(--b2); border-radius: 9px; overflow: hidden; background: var(--bg-1); }
    .doc__import-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 14px; border-bottom: 1px solid var(--b1); background: var(--bg-2); }
    .doc__import-cap { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; color: var(--t3); }
    .doc__selector { font-family: var(--mono); font-size: 11.5px; color: var(--t2); overflow-x: auto; }
    .doc__import-code { margin: 0; padding: 12px 14px; font-family: var(--mono); font-size: 12.5px; color: var(--t1); overflow-x: auto; }

    .doc__h2 { margin: 0 0 14px; font-size: 17px; font-weight: 600; color: var(--t1); }
    .doc__section { margin-top: 38px; scroll-margin-top: 16px; }
    .doc__examples { scroll-margin-top: 16px; }

    .doc__a11y { margin-top: 16px; border: 1px solid var(--b2); border-radius: 9px; padding: 14px 16px; background: var(--bg-1); }
    .doc__a11y-cap { font-size: 12px; font-weight: 600; color: var(--t1); margin-bottom: 6px; }
    .doc__a11y ul { margin: 0; padding-left: 18px; }
    .doc__a11y li { font-size: 13px; color: var(--t2); margin: 4px 0; line-height: 1.5; }

    .doc__aside { display: block; }
    .doc__missing { color: var(--t2); }

    @media (max-width: 1100px) {
      .doc { grid-template-columns: 1fr; }
      .doc__aside { display: none; }
    }
    `,
  ],
})
export class ComponentPage {
  private readonly route = inject(ActivatedRoute);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);
  private readonly zone = inject(NgZone);

  private readonly id = signal('');
  protected readonly activeSection = signal('');
  protected readonly toc = signal<TocItem[]>([]);

  protected readonly examplesComponent = signal<Type<unknown> | null>(null);
  protected readonly examplesInjector = signal<Injector | null>(null);

  /** One filter + injector per category, reused so the hosted page is not recreated. */
  private readonly hosts = new Map<string, CategoryHost>();

  protected readonly component = computed(() => findComponent(this.id()));

  protected readonly crumbs = computed<Crumb[]>(() => {
    const c = this.component();
    if (!c) return [];
    return [
      { label: 'Components' },
      { label: c.category.label },
      { label: c.title },
    ];
  });

  protected readonly importLine = computed(() => {
    const c = this.component();
    if (!c) return '';
    return `import { ${c.importNames.join(', ')} } from '${PACKAGE_NAME}';`;
  });

  protected readonly hasApi = computed(() => {
    const c = this.component();
    return !!(c?.inputs?.length || c?.outputs?.length || c?.methods?.length);
  });
  protected readonly hasUsage = computed(() => {
    const c = this.component();
    return !!(c?.do?.length || c?.dont?.length || c?.a11y?.length);
  });

  protected readonly prev = computed<PageRef | null>(() => {
    const i = ALL_COMPONENTS.findIndex((c) => c.id === this.id());
    return i > 0 ? { id: ALL_COMPONENTS[i - 1].id, title: ALL_COMPONENTS[i - 1].title } : null;
  });
  protected readonly next = computed<PageRef | null>(() => {
    const i = ALL_COMPONENTS.findIndex((c) => c.id === this.id());
    return i >= 0 && i < ALL_COMPONENTS.length - 1
      ? { id: ALL_COMPONENTS[i + 1].id, title: ALL_COMPONENTS[i + 1].title }
      : null;
  });

  private readonly onScroll = () => this.updateActive();

  constructor() {
    this.route.paramMap
      .pipe(
        map((p) => p.get('id') ?? ''),
        takeUntilDestroyed(),
      )
      .subscribe((id) => this.id.set(id));

    // Resolve the right category page + filter whenever the component changes.
    effect(() => {
      const c = this.component();
      if (!c) {
        this.examplesComponent.set(null);
        return;
      }
      this.activate(c.category, c.id);
    });

    // Rebuild the TOC after the (async) examples render.
    effect(() => {
      this.examplesComponent();
      this.id();
      this.scheduleToc();
    });

    this.zone.runOutsideAngular(() => {
      this.scrollParent()?.addEventListener('scroll', this.onScroll, { passive: true });
    });
  }

  private async activate(category: DocCategory, id: string): Promise<void> {
    let host = this.hosts.get(category.id);
    if (!host) {
      const filter = new DemoFilter();
      const childInjector = Injector.create({
        providers: [{ provide: DemoFilter, useValue: filter }],
        parent: this.injector,
      });
      const component = await category.loadExamples();
      host = { filter, injector: childInjector, component };
      this.hosts.set(category.id, host);
    }
    host.filter.only.set(id);
    this.examplesInjector.set(host.injector);
    this.examplesComponent.set(host.component);
    this.scheduleToc();
  }

  private scheduleToc(): void {
    setTimeout(() => this.buildToc(), 0);
    setTimeout(() => this.buildToc(), 90);
  }

  private buildToc(): void {
    const nodes = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>('[data-toc]'),
    );
    const items: TocItem[] = nodes
      .filter((n) => n.id)
      .map((n) => ({ id: n.id, label: n.dataset['tocLabel'] || n.id }));
    this.toc.set(items);
    this.updateActive();
  }

  private scrollParent(): HTMLElement | null {
    let el = this.host.nativeElement.parentElement;
    while (el) {
      const oy = getComputedStyle(el).overflowY;
      if (oy === 'auto' || oy === 'scroll') return el;
      el = el.parentElement;
    }
    return null;
  }

  private updateActive(): void {
    const parent = this.scrollParent();
    if (!parent) return;
    const top = parent.getBoundingClientRect().top + 80;
    let current = this.toc()[0]?.id ?? '';
    for (const item of this.toc()) {
      const el = this.host.nativeElement.querySelector<HTMLElement>(`#${CSS.escape(item.id)}`);
      if (el && el.getBoundingClientRect().top <= top) current = item.id;
    }
    if (current !== this.activeSection()) {
      this.zone.run(() => this.activeSection.set(current));
    }
  }

  protected scrollTo(id: string): void {
    const el = this.host.nativeElement.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeSection.set(id);
  }
}
