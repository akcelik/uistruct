import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { LangService } from './i18n/lang';

describe('App', () => {
  beforeEach(async () => {
    try {
      localStorage.removeItem('uistruct-lang');
    } catch {
      /* a blocked store is the no-choice case, which is what these want */
    }
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('creates the shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('opens in Turkish, with no choice stored', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(TestBed.inject(LangService).lang()).toBe('tr');
    expect(el.textContent).toContain('UIStruct');
    expect(el.textContent).toContain('Bileşen Kütüphanesi');
    expect(el.textContent).toContain('bileşen');
    // The browser and assistive tech have to agree with the page.
    expect(document.documentElement.getAttribute('lang')).toBe('tr');
  });

  it('switches to English without a reload, and says so on the root element', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    TestBed.inject(LangService).set('en');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Component Library');
    expect(el.textContent).toContain('components');
    expect(el.textContent).not.toContain('Bileşen Kütüphanesi');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('keeps the choice for the next visit', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    TestBed.inject(LangService).set('en');
    expect(localStorage.getItem('uistruct-lang')).toBe('en');
  });
});
