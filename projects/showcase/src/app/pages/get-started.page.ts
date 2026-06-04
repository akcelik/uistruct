import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StrctButton } from 'strct';
import { PACKAGE_NAME } from '../docs/registry';

@Component({
  selector: 'app-get-started-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StrctButton],
  template: `
    <article class="gs">
      <h1 class="gs__title">Get started</h1>
      <p class="gs__lead">
        UIStruct is a standalone Angular component library. Add the package, import the theme once,
        and start dropping components in. No runtime CSS framework, no global module to register.
      </p>

      <section class="gs__sec">
        <h2>Requirements</h2>
        <ul class="gs__list">
          <li>Angular <code>21.2</code> or newer (standalone APIs &amp; signals).</li>
          <li><code>&#64;angular/common</code>, <code>core</code>, <code>forms</code> and
            <code>platform-browser</code> are peer dependencies.</li>
        </ul>
      </section>

      <section class="gs__sec">
        <h2>1 · Install</h2>
        <pre class="gs__code"><code>npm install {{ pkg }}</code></pre>
      </section>

      <section class="gs__sec">
        <h2>2 · Import the theme</h2>
        <p>Add the theme stylesheet once in your global styles. It ships the design tokens, a base
          reset and the form-control styles.</p>
        <pre class="gs__code"><code>{{ themeImport }}</code></pre>
      </section>

      <section class="gs__sec">
        <h2>3 · Choose a scheme</h2>
        <p>Set the palette and mode on the document root — or let <code>StrctThemeService</code>
          manage and persist it.</p>
        <pre class="gs__code"><code>{{ htmlAttr }}</code></pre>
        <pre class="gs__code"><code>{{ serviceUse }}</code></pre>
        <p>Or drop in the ready-made switcher anywhere:</p>
        <pre class="gs__code"><code>&lt;strct-theme-switcher /&gt;</code></pre>
      </section>

      <section class="gs__sec">
        <h2>4 · Use your first component</h2>
        <p>Every component is standalone — import just what you use.</p>
        <pre class="gs__code"><code>{{ firstComponent }}</code></pre>
      </section>

      <section class="gs__sec">
        <h2>Next steps</h2>
        <div class="gs__next">
          <button strct-button variant="primary" routerLink="/components/button">Browse components</button>
          <button strct-button routerLink="/foundations/theming">Explore theming</button>
          <button strct-button routerLink="/foundations/icons">See the icon set</button>
        </div>
      </section>
    </article>
  `,
  styles: [
    `
    .gs { max-width: 760px; }
    .gs__title { margin: 0; font-size: 28px; font-weight: 650; color: var(--t1); letter-spacing: -0.01em; }
    .gs__lead { margin: 10px 0 0; font-size: 15px; line-height: 1.6; color: var(--t2); }
    .gs__sec { margin-top: 34px; }
    .gs__sec h2 { margin: 0 0 10px; font-size: 17px; font-weight: 600; color: var(--t1); }
    .gs__sec p { margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: var(--t2); }
    .gs__list { margin: 0; padding-left: 20px; }
    .gs__list li { font-size: 14px; line-height: 1.7; color: var(--t2); }
    .gs code { font-family: var(--mono); font-size: 12.5px; color: var(--acc); }
    .gs__code {
      margin: 0 0 12px; padding: 13px 16px; border-radius: 9px; overflow-x: auto;
      font-family: var(--mono); font-size: 13px; line-height: 1.6; color: var(--t1);
      background: var(--bg-0); border: 1px solid var(--b2);
    }
    .gs__code code { color: inherit; font-size: inherit; }
    .gs__next { display: flex; flex-wrap: wrap; gap: 10px; }
    `,
  ],
})
export class GetStartedPage {
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
