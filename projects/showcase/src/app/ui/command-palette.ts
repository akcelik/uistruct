import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StrctCommandItem, StrctCommandPalette } from 'strct';
import { ALL_COMPONENTS, GUIDES, SCENARIOS } from '../docs/registry';

/** Shared open-state so any trigger (header button, ⌘K) can summon the palette. */
@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  readonly open = signal(false);
}

/**
 * The docs site's ⌘/Ctrl-K spotlight — a thin wrapper that feeds the library's
 * `strct-command-palette` every component, scenario and guide page and navigates
 * on pick. Dogfood: the showcase runs on the shipped component.
 */
@Component({
  selector: 'app-command-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StrctCommandPalette],
  template: `
    <strct-command-palette
      [items]="items"
      [open]="svc.open()"
      (openChange)="svc.open.set($event)"
      (picked)="go($event)"
      placeholder="Search components, scenarios, pages…"
    />
  `,
})
export class CommandPalette {
  protected readonly svc = inject(CommandPaletteService);
  private readonly router = inject(Router);

  protected readonly items: StrctCommandItem[] = [
    ...GUIDES.items.map((i) => ({
      id: i.path,
      label: i.label,
      group: 'Foundations',
      icon: GUIDES.icon,
    })),
    ...SCENARIOS.items.map((i) => ({
      id: i.path,
      label: i.label,
      group: 'Scenarios',
      icon: SCENARIOS.icon,
    })),
    ...ALL_COMPONENTS.map((c) => ({
      id: `/components/${c.id}`,
      label: c.title,
      group: c.category.label,
      icon: c.category.icon,
      keywords: [c.selector],
    })),
  ];

  protected go(item: StrctCommandItem): void {
    void this.router.navigate([item.id]);
  }
}
