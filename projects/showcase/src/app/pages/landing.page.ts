import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StrctButton, StrctIcon, StrctThemeSwitcher } from 'strct';
import { COMPONENT_COUNT, DOCS, PACKAGE_NAME } from '../docs/registry';

interface Feature {
  icon: string;
  title: string;
  body: string;
}

@Component({
  selector: 'app-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StrctButton, StrctIcon, StrctThemeSwitcher],
  template: `
    <section class="hero">
      <div class="hero__mark"><strct-icon name="hexagon" [size]="40" [strokeWidth]="1.3" /></div>
      <h1 class="hero__title">UIStruct</h1>
      <p class="hero__tagline">
        A standalone Angular component library for infrastructure &amp; datacenter UIs.
        One token system, three palettes, light and dark — re-skin everything with a single attribute.
      </p>

      <div class="hero__install">
        <code>npm install {{ pkg }}</code>
        <button strct-button size="sm" iconOnly aria-label="Copy install command" (click)="copy()">
          <strct-icon [name]="copied() ? 'check' : 'copy'" [size]="15" />
        </button>
      </div>

      <div class="hero__cta">
        <button strct-button variant="primary" solid routerLink="/get-started">Get started</button>
        <button strct-button routerLink="/components/button">Browse components</button>
        <a strct-button variant="flat" href="https://github.com/akcelik/uistruct" target="_blank" rel="noreferrer">
          <strct-icon name="code" [size]="15" /> GitHub
        </a>
      </div>

      <div class="hero__switch">
        <strct-theme-switcher />
        <span class="hero__hint">Try a palette — the whole page re-skins live.</span>
      </div>
    </section>

    <section class="features">
      @for (f of features; track f.title) {
        <div class="feat">
          <span class="feat__icon"><strct-icon [name]="f.icon" [size]="20" [strokeWidth]="1.4" /></span>
          <h3 class="feat__title">{{ f.title }}</h3>
          <p class="feat__body">{{ f.body }}</p>
        </div>
      }
    </section>

    <section class="cats">
      <div class="cats__head">
        <h2>{{ count }} components, organised</h2>
        <p>Eight categories — from buttons to datagrids, charts and full page patterns.</p>
      </div>
      <div class="cats__grid">
        @for (cat of cats; track cat.id) {
          <a class="cat" [routerLink]="['/components', cat.components[0].id]">
            <span class="cat__icon"><strct-icon [name]="cat.icon" [size]="18" [strokeWidth]="1.4" /></span>
            <span class="cat__text">
              <span class="cat__label">{{ cat.label }}</span>
              <span class="cat__count">{{ cat.components.length }} components</span>
            </span>
            <strct-icon name="chevronRight" [size]="15" class="cat__go" />
          </a>
        }
      </div>
    </section>
  `,
  styles: [
    `
    :host { display: block; }
    .hero { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 48px 20px 40px; }
    .hero__mark { display: inline-flex; padding: 16px; border-radius: 18px; color: var(--acc); background: var(--acc-s); border: 1px solid var(--acc30); margin-bottom: 18px; }
    .hero__title { margin: 0; font-size: 44px; font-weight: 700; letter-spacing: -0.02em; color: var(--t1); }
    .hero__tagline { margin: 14px 0 0; max-width: 60ch; font-size: 16px; line-height: 1.6; color: var(--t2); }
    .hero__install { display: inline-flex; align-items: center; gap: 8px; margin-top: 26px; padding: 6px 6px 6px 14px; border: 1px solid var(--b2); border-radius: 8px; background: var(--bg-1); }
    .hero__install code { font-family: var(--mono); font-size: 13px; color: var(--t1); }
    .hero__cta { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 22px; }
    .hero__switch { display: flex; align-items: center; gap: 14px; margin-top: 30px; flex-wrap: wrap; justify-content: center; }
    .hero__switch strct-theme-switcher { padding: 8px 12px; border-radius: 8px; background: var(--hdr); }
    .hero__hint { font-size: 12.5px; color: var(--t3); }

    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin: 30px auto 0; max-width: 980px; }
    .feat { padding: 18px; border: 1px solid var(--b2); border-radius: 11px; background: var(--bg-1); }
    .feat__icon { display: inline-flex; padding: 9px; border-radius: 9px; color: var(--acc); background: var(--acc-s); margin-bottom: 10px; }
    .feat__title { margin: 0 0 5px; font-size: 14px; font-weight: 600; color: var(--t1); }
    .feat__body { margin: 0; font-size: 13px; line-height: 1.55; color: var(--t2); }

    .cats { max-width: 980px; margin: 44px auto 20px; }
    .cats__head { text-align: center; margin-bottom: 18px; }
    .cats__head h2 { margin: 0; font-size: 22px; font-weight: 650; color: var(--t1); }
    .cats__head p { margin: 6px 0 0; font-size: 14px; color: var(--t2); }
    .cats__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
    .cat { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid var(--b2); border-radius: 10px; background: var(--bg-1); text-decoration: none; transition: border-color .14s ease, transform .14s ease; }
    .cat:hover { border-color: var(--acc50); transform: translateY(-1px); }
    .cat__icon { display: inline-flex; padding: 8px; border-radius: 8px; color: var(--acc); background: var(--acc-s); }
    .cat__text { display: flex; flex-direction: column; flex: 1; }
    .cat__label { font-size: 14px; font-weight: 600; color: var(--t1); }
    .cat__count { font-size: 12px; color: var(--t3); }
    .cat__go { color: var(--t3); }
    .cat:hover .cat__go { color: var(--acc); }
    `,
  ],
})
export class LandingPage {
  protected readonly pkg = PACKAGE_NAME;
  protected readonly count = COMPONENT_COUNT;
  protected readonly cats = DOCS;
  protected readonly copied = signal(false);

  protected readonly features: Feature[] = [
    { icon: 'palette', title: 'One token system', body: 'Every color comes from CSS custom properties — three palettes (Arctic, Ember, Sage) × light & dark, no hard-coded hex anywhere.' },
    { icon: 'layers', title: 'Standalone & signal-based', body: 'Standalone components with signal inputs and OnPush change detection throughout. Drop in only what you use.' },
    { icon: 'form', title: 'Form-ready', body: 'Every control implements ControlValueAccessor, so it works with ngModel and reactive forms out of the box.' },
    { icon: 'universalAccess', title: 'Accessible by default', body: 'Native elements, focus traps, ARIA roles and prefers-reduced-motion handling baked in.' },
    { icon: 'chart', title: 'Datacenter-flavoured', body: 'A stroke icon set with object-state badges, plus datagrids, timelines and charts built for infrastructure dashboards.' },
    { icon: 'code', title: 'No framework lock-in', body: 'No runtime CSS framework dependency. Just Angular, the token stylesheet, and the components you import.' },
  ];

  protected copy(): void {
    void navigator.clipboard?.writeText(`npm install ${this.pkg}`);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1600);
  }
}
