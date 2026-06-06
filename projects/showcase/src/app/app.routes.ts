import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'compute/default-appliance',
  },
  {
    path: ':category/:id',
    loadComponent: () => import('./pages/category.page').then((m) => m.CategoryPage),
  },
];
