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
  { path: '**', redirectTo: '' },
];
