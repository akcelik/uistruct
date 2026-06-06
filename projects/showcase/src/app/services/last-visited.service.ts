import { Injectable } from '@angular/core';

const STORAGE_KEY = 'dc-last-visited';

@Injectable({ providedIn: 'root' })
export class LastVisitedService {
  get(category: string): string | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw) as Record<string, string>;
      return map[category] ?? null;
    } catch {
      return null;
    }
  }

  set(category: string, objectId: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      map[category] = objectId;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      // silently fail in SSR / private mode
    }
  }
}
