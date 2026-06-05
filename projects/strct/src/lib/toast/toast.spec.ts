import { TestBed } from '@angular/core/testing';
import { StrctToastOutlet, StrctToastService } from './toast';

describe('StrctToastOutlet', () => {
  it('creates the component', () => {
    const fixture = TestBed.createComponent(StrctToastOutlet);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});

describe('StrctToastService', () => {
  it('injects via TestBed', () => {
    const service = TestBed.inject(StrctToastService);
    expect(service).toBeTruthy();
  });

  it('queues a toast and clears it', () => {
    const service = TestBed.inject(StrctToastService);
    const id = service.show('Hello');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Hello');
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });
});
