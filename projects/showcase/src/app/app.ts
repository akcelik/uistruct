import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import {
  StrctFooter,
  StrctHeader,
  StrctIcon,
  StrctNav,
  StrctNavItem,
  StrctShell,
  StrctThemeService,
  StrctThemeSwitcher,
  StrctToastOutlet,
  StrctTree,
  StrctTreeNode,
  StrctVerticalNav,
} from 'strct';
import { COMPONENT_COUNT, NAV } from './ui/nav.model';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    StrctShell,
    StrctHeader,
    StrctFooter,
    StrctVerticalNav,
    StrctNav,
    StrctNavItem,
    StrctTree,
    StrctTreeNode,
    StrctThemeSwitcher,
    StrctToastOutlet,
    StrctIcon,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly theme = inject(StrctThemeService);

  protected readonly nav = NAV;
  protected readonly count = COMPONENT_COUNT;

  private readonly url = signal(this.router.url);

  protected readonly activeCategory = computed(() => {
    const segment = this.url().split('#')[0].split('/').filter(Boolean)[0] ?? 'overview';
    return NAV.find((c) => c.route === segment) ?? NAV[0];
  });
  protected readonly activeFragment = computed(() => this.url().split('#')[1] ?? '');

  protected readonly themeLabel = computed(() => {
    const p = this.theme.palettes.find((x) => x.id === this.theme.palette());
    return `${p?.label ?? ''} · ${this.theme.isDark() ? 'Dark' : 'Light'}`;
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.url.set(e.urlAfterRedirects));
  }

  protected go(route: string, fragment: string): void {
    this.router.navigate(['/', route], { fragment });
  }
}
