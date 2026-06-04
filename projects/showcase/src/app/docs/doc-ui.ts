import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiRow } from './registry';

/** A single Inputs / Outputs / Methods reference table. */
@Component({
  selector: 'app-api-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rows().length) {
      <div class="api">
        <div class="api__cap">{{ title() }}</div>
        <div class="api__scroll">
          <table class="api__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                @if (showDefault()) {
                  <th>Default</th>
                }
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              @for (r of rows(); track r.name) {
                <tr>
                  <td><code class="api__name">{{ r.name }}</code></td>
                  <td><code class="api__type">{{ r.type }}</code></td>
                  @if (showDefault()) {
                    <td>
                      @if (r.default) {
                        <code class="api__def">{{ r.default }}</code>
                      } @else {
                        <span class="api__dash">—</span>
                      }
                    </td>
                  }
                  <td class="api__desc">{{ r.description }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
  styles: [
    `
    .api { margin-top: 14px; border: 1px solid var(--b2); border-radius: 9px; overflow: hidden; background: var(--bg-1); }
    .api__cap { padding: 10px 14px; font-size: 12px; font-weight: 600; color: var(--t1); border-bottom: 1px solid var(--b1); background: var(--bg-2); }
    .api__scroll { overflow-x: auto; }
    .api__table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .api__table th {
      text-align: left; padding: 9px 14px; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: .4px; color: var(--t3);
      border-bottom: 1px solid var(--b1); white-space: nowrap;
    }
    .api__table td { padding: 10px 14px; border-bottom: 1px solid var(--b1); vertical-align: top; color: var(--t2); }
    .api__table tr:last-child td { border-bottom: 0; }
    .api__name { font-family: var(--mono); font-size: 12px; color: var(--acc); }
    .api__type { font-family: var(--mono); font-size: 11.5px; color: var(--t1); white-space: pre-wrap; }
    .api__def { font-family: var(--mono); font-size: 11.5px; color: var(--t2); }
    .api__dash { color: var(--t3); }
    .api__desc { min-width: 220px; }
    `,
  ],
})
export class ApiTable {
  readonly title = input.required<string>();
  readonly rows = input.required<ApiRow[]>();
  readonly showDefault = input(true);
}

/** Do / Don't usage guidance, two columns. */
@Component({
  selector: 'app-usage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ug">
      @if (do().length) {
        <div class="ug__col ug__col--do">
          <div class="ug__head"><span class="ug__mark">✓</span> Do</div>
          <ul>
            @for (item of do(); track item) {
              <li>{{ item }}</li>
            }
          </ul>
        </div>
      }
      @if (dont().length) {
        <div class="ug__col ug__col--dont">
          <div class="ug__head"><span class="ug__mark">✕</span> Don't</div>
          <ul>
            @for (item of dont(); track item) {
              <li>{{ item }}</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: [
    `
    .ug { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-top: 14px; }
    .ug__col { border: 1px solid var(--b2); border-radius: 9px; padding: 14px 16px; background: var(--bg-1); border-top-width: 3px; }
    .ug__col--do { border-top-color: var(--ok); }
    .ug__col--dont { border-top-color: var(--crt); }
    .ug__head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--t1); margin-bottom: 8px; }
    .ug__mark { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; font-size: 11px; }
    .ug__col--do .ug__mark { color: var(--ok); background: var(--ok-bg); }
    .ug__col--dont .ug__mark { color: var(--crt); background: var(--crt-bg); }
    .ug ul { margin: 0; padding-left: 18px; }
    .ug li { font-size: 13px; color: var(--t2); margin: 4px 0; line-height: 1.5; }
    `,
  ],
})
export class UsageGuide {
  readonly do = input<string[]>([]);
  readonly dont = input<string[]>([]);
}

export interface Crumb {
  label: string;
  path?: string;
}

/** Breadcrumb trail. */
@Component({
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <nav class="bc" aria-label="Breadcrumb">
      @for (c of items(); track c.label; let last = $last) {
        @if (c.path && !last) {
          <a [routerLink]="c.path" class="bc__link">{{ c.label }}</a>
        } @else {
          <span class="bc__cur">{{ c.label }}</span>
        }
        @if (!last) {
          <span class="bc__sep">/</span>
        }
      }
    </nav>
  `,
  styles: [
    `
    .bc { display: flex; align-items: center; gap: 7px; font-size: 12px; margin-bottom: 10px; }
    .bc__link { color: var(--t3); text-decoration: none; }
    .bc__link:hover { color: var(--acc); }
    .bc__cur { color: var(--t2); }
    .bc__sep { color: var(--t4); }
    `,
  ],
})
export class Breadcrumb {
  readonly items = input.required<Crumb[]>();
}

export interface PageRef {
  id: string;
  title: string;
}

/** Previous / next component footer links. */
@Component({
  selector: 'app-prev-next',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <nav class="pn">
      @if (prev()) {
        <a class="pn__card pn__card--prev" [routerLink]="['/components', prev()!.id]">
          <span class="pn__dir">← Previous</span>
          <span class="pn__title">{{ prev()!.title }}</span>
        </a>
      } @else {
        <span></span>
      }
      @if (next()) {
        <a class="pn__card pn__card--next" [routerLink]="['/components', next()!.id]">
          <span class="pn__dir">Next →</span>
          <span class="pn__title">{{ next()!.title }}</span>
        </a>
      }
    </nav>
  `,
  styles: [
    `
    .pn { display: flex; justify-content: space-between; gap: 12px; margin-top: 32px; padding-top: 18px; border-top: 1px solid var(--b1); }
    .pn__card { display: flex; flex-direction: column; gap: 3px; padding: 12px 16px; border: 1px solid var(--b2); border-radius: 9px; text-decoration: none; background: var(--bg-1); min-width: 160px; transition: border-color .14s ease; }
    .pn__card:hover { border-color: var(--acc50); }
    .pn__card--next { text-align: right; }
    .pn__dir { font-size: 11px; color: var(--t3); }
    .pn__title { font-size: 14px; font-weight: 600; color: var(--t1); }
    `,
  ],
})
export class PrevNext {
  readonly prev = input<PageRef | null>(null);
  readonly next = input<PageRef | null>(null);
}

export interface TocItem {
  id: string;
  label: string;
}

/** Sticky "on this page" navigation, scrolls to the active section. */
@Component({
  selector: 'app-on-this-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length > 1) {
      <aside class="otp">
        <div class="otp__cap">On this page</div>
        <ul>
          @for (i of items(); track i.id) {
            <li>
              <a
                [class.is-active]="i.id === active()"
                (click)="select.emit(i.id); $event.preventDefault()"
                href="#{{ i.id }}"
                >{{ i.label }}</a
              >
            </li>
          }
        </ul>
      </aside>
    }
  `,
  styles: [
    `
    .otp { position: sticky; top: 8px; }
    .otp__cap { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: var(--t3); margin-bottom: 10px; }
    .otp ul { list-style: none; margin: 0; padding: 0; border-left: 1px solid var(--b1); }
    .otp li { margin: 0; }
    .otp a {
      display: block; padding: 5px 12px; margin-left: -1px;
      font-size: 12.5px; color: var(--t3); text-decoration: none;
      border-left: 2px solid transparent; cursor: pointer;
    }
    .otp a:hover { color: var(--t1); }
    .otp a.is-active { color: var(--acc); border-left-color: var(--acc); }
    `,
  ],
})
export class OnThisPage {
  readonly items = input.required<TocItem[]>();
  readonly active = input('');
  readonly select = output<string>();
}
