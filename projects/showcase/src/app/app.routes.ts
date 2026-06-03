import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  {
    path: 'overview',
    loadComponent: () => import('./pages/overview.page').then((m) => m.OverviewPage),
  },
  {
    path: 'icons',
    loadComponent: () => import('./pages/icons.page').then((m) => m.IconsPage),
  },
  {
    path: 'controls',
    loadComponent: () => import('./pages/controls.page').then((m) => m.ControlsPage),
  },
  {
    path: 'forms',
    loadComponent: () => import('./pages/forms.page').then((m) => m.FormsPage),
  },
  {
    path: 'surfaces',
    loadComponent: () => import('./pages/surfaces.page').then((m) => m.SurfacesPage),
  },
  {
    path: 'navigation',
    loadComponent: () => import('./pages/navigation.page').then((m) => m.NavigationPage),
  },
  {
    path: 'data',
    loadComponent: () => import('./pages/data.page').then((m) => m.DataPage),
  },
  {
    path: 'charts',
    loadComponent: () => import('./pages/charts.page').then((m) => m.ChartsPage),
  },
  {
    path: 'feedback',
    loadComponent: () => import('./pages/feedback.page').then((m) => m.FeedbackPage),
  },
  {
    path: 'patterns',
    loadComponent: () => import('./pages/patterns.page').then((m) => m.PatternsPage),
  },
  { path: '**', redirectTo: 'overview' },
];
