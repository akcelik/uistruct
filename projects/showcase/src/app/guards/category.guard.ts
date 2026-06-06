import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { LastVisitedService } from '../services/last-visited.service';

export const categoryGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const lastVisited = inject(LastVisitedService);
  const category = route.paramMap.get('category')!;
  const last = lastVisited.get(category);
  const currentUrl = state.url;

  if (last) {
    const target = `/${category}/${last}`;
    if (currentUrl !== target) {
      return router.createUrlTree(['/', category, last]);
    }
  } else {
    const target = `/${category}/default-appliance`;
    if (currentUrl !== target) {
      return router.createUrlTree(['/', category, 'default-appliance']);
    }
  }
  return true;
};
