import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import {
  StrctFooter,
  StrctHeader,
  StrctIcon,
  StrctNavItem,
  StrctShell,
  StrctThemeService,
  StrctThemeSwitcher,
  StrctToastOutlet,
  StrctVerticalNav,
} from 'strct';
import { COMPONENT_COUNT, DOCS, GUIDES } from './docs/registry';

interface NavItem {
  label: string;
  path: string;
}
interface NavGroup {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
}

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
    StrctNavItem,
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

  protected readonly count = COMPONENT_COUNT;
  protected readonly version = '0.5.30';

  /** Icon strip + secondary panel source. Foundations first, then component categories. */
  protected readonly groups: NavGroup[] = [
    { id: GUIDES.id, label: GUIDES.label, icon: GUIDES.icon, items: GUIDES.items },
    ...DOCS.map((cat) => ({
      id: cat.id,
      label: cat.label,
      icon: cat.icon,
      items: cat.components.map((c) => ({ label: c.title, path: `/components/${c.id}` })),
    })),
  ];

  private readonly url = signal(this.router.url);
  private readonly path = computed(() => this.url().split('#')[0].split('?')[0]);

  protected readonly showSidebar = computed(() => this.path() !== '/');

  protected readonly activeGroup = computed<NavGroup>(() => {
    const p = this.path();
    if (p.startsWith('/components/')) {
      const id = p.split('/')[2] ?? '';
      const cat = DOCS.find((c) => c.components.some((x) => x.id === id));
      if (cat) return this.groups.find((g) => g.id === cat.id)!;
    }
    if (p.startsWith('/foundations') || p.startsWith('/get-started')) {
      return this.groups[0];
    }
    return this.groups[0];
  });

  protected readonly themeLabel = computed(() => {
    const pal = this.theme.palettes.find((x) => x.id === this.theme.palette());
    return `${pal?.label ?? ''} · ${this.theme.isDark() ? 'Dark' : 'Light'}`;
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.url.set(e.urlAfterRedirects));
  }

  protected isActiveGroup(id: string): boolean {
    return this.activeGroup().id === id;
  }

  protected isActiveItem(path: string): boolean {
    return this.path() === path;
  }
}
