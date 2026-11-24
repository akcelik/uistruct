import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { ENABLED_LANGS, LangService } from './i18n/lang';

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

  it('opens in the first offered language, and says so on the root element', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(TestBed.inject(LangService).lang()).toBe(ENABLED_LANGS[0]);
    expect(el.textContent).toContain('UIStruct');
    expect(document.documentElement.getAttribute('lang')).toBe(ENABLED_LANGS[0]);
  });

  /**
   * Turkish is written and kept, but not offered while the reference pages
   * are still English. These two say what that means in practice, so turning
   * it back on is a visible change rather than a silent one.
   */
  it('offers only English for now, and hides the switcher', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect([...ENABLED_LANGS]).toEqual(['en']);
    expect(el.textContent).toContain('Component Library');
    expect(el.querySelector('.lang__btn')).toBeNull();
  });

  it('does not strand a reader who chose a language that is no longer offered', async () => {
    localStorage.setItem('uistruct-lang', 'tr');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(TestBed.inject(LangService).lang()).toBe('en');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Bileşen Kütüphanesi');
  });

  it('refuses a language it does not offer', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const lang = TestBed.inject(LangService);
    lang.set('tr');
    expect(lang.lang()).toBe('en');
  });
});
