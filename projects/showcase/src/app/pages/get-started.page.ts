import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StrctButton } from 'strct';
import { PACKAGE_NAME } from '../docs/registry';
import { LangService } from '../i18n/lang';

@Component({
  selector: 'app-get-started-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StrctButton],
  template: `
    <article class="gs">
      <h1 class="gs__title">{{ t().started.title }}</h1>
      <p class="gs__lead">{{ t().started.lead }}</p>

      <section class="gs__sec">
        <h2>{{ t().started.requirements }}</h2>
        <ul class="gs__list">
          <li>Angular <code>21.2</code> {{ t().started.reqAngular }}</li>
          <li>
            <code>&#64;angular/common</code>, <code>core</code>, <code>forms</code> and
            <code>platform-browser</code> {{ t().started.reqPeers }}
          </li>
        </ul>
      </section>

      <section class="gs__sec">
        <h2>{{ t().started.install }}</h2>
        <pre class="gs__code"><code>npm install {{ pkg }}</code></pre>
      </section>

      <section class="gs__sec">
        <h2>{{ t().started.importTheme }}</h2>
        <p>{{ t().started.importThemeBody }}</p>
        <pre class="gs__code"><code>{{ themeImport }}</code></pre>
      </section>

      <section class="gs__sec">
        <h2>{{ t().started.scheme }}</h2>
        <p>{{ t().started.schemeBody }} <code>StrctThemeService</code>.</p>
        <pre class="gs__code"><code>{{ htmlAttr }}</code></pre>
        <pre class="gs__code"><code>{{ serviceUse }}</code></pre>
        <p>{{ t().started.schemeOr }}</p>
        <pre class="gs__code"><code>&lt;strct-theme-switcher /&gt;</code></pre>
      </section>

      <section class="gs__sec">
        <h2>{{ t().started.first }}</h2>
        <p>{{ t().started.firstBody }}</p>
        <pre class="gs__code"><code>{{ firstComponent }}</code></pre>
      </section>

      <section class="gs__sec">
        <h2>{{ t().started.next }}</h2>
        <div class="gs__next">
          <button strct-button variant="primary" routerLink="/components/button">
            {{ t().started.browse }}
          </button>
          <button strct-button routerLink="/foundations/theming">{{ t().started.theming }}</button>
          <button strct-button routerLink="/foundations/icons">{{ t().started.icons }}</button>
        </div>
      </section>
    </article>
  `,
  styles: [
    `
      .gs {
        max-width: 760px;
      }
      .gs__title {
        margin: 0;
        font-size: 28px;
        font-weight: 650;
        color: var(--t1);
        letter-spacing: -0.01em;
      }
      .gs__lead {
        margin: 10px 0 0;
        font-size: 15px;
        line-height: 1.6;
        color: var(--t2);
      }
      .gs__sec {
        margin-top: 34px;
      }
      .gs__sec h2 {
        margin: 0 0 10px;
        font-size: 17px;
        font-weight: 600;
        color: var(--t1);
      }
      .gs__sec p {
        margin: 0 0 12px;
        font-size: 14px;
        line-height: 1.6;
        color: var(--t2);
      }
      .gs__list {
        margin: 0;
        padding-left: 20px;
      }
      .gs__list li {
        font-size: 14px;
        line-height: 1.7;
        color: var(--t2);
      }
      .gs code {
        font-family: var(--mono);
        font-size: 12.5px;
        color: var(--acc);
      }
      .gs__code {
        margin: 0 0 12px;
        padding: 13px 16px;
        border-radius: 4px;
        overflow-x: auto;
        font-family: var(--mono);
        font-size: 13px;
        line-height: 1.6;
        color: var(--t1);
        background: var(--bg-0);
        border: 1px solid var(--b2);
      }
      .gs__code code {
        color: inherit;
        font-size: inherit;
      }
      .gs__next {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
    `,
  ],
})
export class GetStartedPage {
  private readonly langService = inject(LangService);
  protected readonly t = this.langService.t;
  protected readonly pkg = PACKAGE_NAME;
  protected readonly themeImport = `// styles.scss\n@use '${PACKAGE_NAME}/styles/theme';`;
  protected readonly htmlAttr = `<html data-palette="arctic" data-theme="dark">`;
  protected readonly serviceUse = `import { StrctThemeService } from '${PACKAGE_NAME}';

const theme = inject(StrctThemeService);
theme.setPalette('ember');   // 'arctic' | 'ember' | 'sage'
theme.setMode('light');      // 'dark' | 'light'  (persisted)
theme.toggleMode();`;
  protected readonly firstComponent = `import { Component } from '@angular/core';
import { StrctButton } from '${PACKAGE_NAME}';

@Component({
  selector: 'app-demo',
  imports: [StrctButton],
  template: \`<button strct-button variant="primary">Save</button>\`,
})
export class Demo {}`;
}
