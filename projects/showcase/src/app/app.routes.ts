import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'get-started',
    loadComponent: () => import('./pages/get-started.page').then((m) => m.GetStartedPage),
  },
  {
    path: 'foundations/theming',
    loadComponent: () => import('./pages/overview.page').then((m) => m.OverviewPage),
  },
  {
    path: 'foundations/icons',
    loadComponent: () => import('./pages/icons.page').then((m) => m.IconsPage),
  },
  {
    path: 'components/:id',
    loadComponent: () => import('./docs/component-page').then((m) => m.ComponentPage),
  },
  {
    path: 'scenarios/dashboard',
    loadComponent: () => import('./scenarios/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'scenarios/inventory',
    loadComponent: () => import('./scenarios/inventory.page').then((m) => m.InventoryPage),
  },
  {
    path: 'scenarios/host',
    loadComponent: () => import('./scenarios/host-detail.page').then((m) => m.HostDetailPage),
  },
  {
    path: 'scenarios/new-cluster',
    loadComponent: () => import('./scenarios/cluster-wizard.page').then((m) => m.ClusterWizardPage),
  },
  { path: 'scenarios', pathMatch: 'full', redirectTo: 'scenarios/dashboard' },
  { path: '**', redirectTo: '' },
];
