import { Routes } from '@angular/router';
import { categoryGuard } from './guards/category.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'compute',
  },
  {
    path: ':category',
    canActivate: [categoryGuard],
    children: [
      {
        path: ':id',
        loadComponent: () => import('./pages/category.page').then((m) => m.CategoryPage),
      },
    ],
  },
];
