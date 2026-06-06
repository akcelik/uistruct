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

interface NavGroup {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const CATEGORIES: NavGroup[] = [
  { id: 'compute', label: 'Compute', icon: 'cpu', path: '/compute/default-appliance' },
  { id: 'vm', label: 'VM', icon: 'container', path: '/vm/default-appliance' },
  { id: 'network', label: 'Network', icon: 'network', path: '/network/default-appliance' },
  { id: 'storage', label: 'Storage', icon: 'database', path: '/storage/default-appliance' },
];

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

  protected readonly groups = CATEGORIES;

  private readonly url = signal(this.router.url);
  private readonly path = computed(() => this.url().split('#')[0].split('?')[0]);

  protected readonly showSidebar = computed(() => true);

  protected readonly activeGroup = computed<NavGroup>(() => {
    const p = this.path();
    const parts = p.split('/').filter(Boolean);
    if (parts.length > 0) {
      const cat = this.groups.find((g) => g.id === parts[0]);
      if (cat) return cat;
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
}
