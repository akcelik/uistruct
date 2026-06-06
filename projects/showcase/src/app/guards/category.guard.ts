import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { LastVisitedService } from '../services/last-visited.service';

export const categoryGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const lastVisited = inject(LastVisitedService);
  const category = route.paramMap.get('category')!;
  const last = lastVisited.get(category);

  if (last) {
    return router.createUrlTree(['/', category, last]);
  }
  return router.createUrlTree(['/', category, 'default-appliance']);
};
