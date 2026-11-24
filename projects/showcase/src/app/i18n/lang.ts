import { Injectable, computed, signal } from '@angular/core';

/** The site's two languages. Turkish is the default. */
export type Lang = 'tr' | 'en';

const KEY = 'uistruct-lang';

/**
 * What the site says in each language.
 *
 * This covers the **chrome and the pages a visitor lands on**: the header,
 * the navigation, the footer, the landing page and Get started. The 104
 * component reference pages stay in English — their prose is 35,372 words
 * carrying measured claims, and the API they describe (`strct-datagrid`,
 * `health`, `badge`) is English in the code. A reader who crosses from the
 * translated part into the reference is told so once, rather than meeting
 * an untranslated page with no explanation.
 */
export interface Dict {
  code: Lang;
  /** Header and shell. */
  brandSub: string;
  getStarted: string;
  components: string;
  search: string;
  theme: string;
  language: string;
  closeNav: string;
  componentsCount: string;
  /** Navigation groups. */
  groups: Record<string, string>;
  /** The reference-is-English note. */
  refNote: string;
  /** The measured-facts section. */
  measured: { heading: string; lede: string };
  /** Landing page. */
  landing: {
    kicker: string;
    title: string;
    tagline: string;
    browse: string;
    hint: string;
    consoleLabel: string;
    facts: { components: string; icons: string; schemes: string; measured: string };
    featuresHeading: string;
    features: { title: string; body: string }[];
    catsTitle: string;
    catsBody: string;
    catComponents: string;
  };
  /** Get started page. */
  started: {
    title: string;
    lead: string;
    requirements: string;
    reqAngular: string;
    reqPeers: string;
    install: string;
    importTheme: string;
    importThemeBody: string;
    scheme: string;
    schemeBody: string;
    schemeOr: string;
    first: string;
    firstBody: string;
    next: string;
    browse: string;
    theming: string;
    icons: string;
  };
}

const EN: Dict = {
  code: 'en',
  brandSub: 'Component Library',
  getStarted: 'Get started',
  components: 'Components',
  search: 'Search',
  theme: 'Theme',
  language: 'Language',
  closeNav: 'Close navigation',
  componentsCount: 'components',
  groups: {
    foundations: 'Foundations',
    scenarios: 'Scenarios',
    controls: 'Controls',
    forms: 'Forms',
    surfaces: 'Surfaces',
    navigation: 'Navigation',
    data: 'Data',
    ops: 'Ops',
    charts: 'Charts',
    feedback: 'Feedback',
    patterns: 'Patterns',
  },
  refNote:
    'The component reference is written in English, like the API it describes. The rest of the site follows the language you choose here.',
  measured: {
    heading: 'Measured',
    lede: 'What a browser read off this component, and when. Each line is a dated fact from the release it shipped in, taken by the gate named beside it \u2014 not a counter claiming to be today.',
  },
  landing: {
    kicker: 'Angular · infrastructure UI',
    title: '104 components for the screens that run a datacenter.',
    tagline:
      'Host and VM trees, grids of two thousand rows, wiring maps, alarm axes. The console on the right is not a picture — it is this library, running on this page.',
    browse: 'Browse 104 components',
    hint: 'Change the palette — the console changes with it.',
    consoleLabel: 'A live inventory console built from this library',
    facts: {
      components: 'components',
      icons: 'icons',
      schemes: 'schemes — 3 palettes × 2 themes',
      measured: 'specs and 19 measurement gates, every release',
    },
    featuresHeading: 'Why UIStruct',
    features: [
      {
        title: 'One token system',
        body: 'Every color comes from CSS custom properties — three palettes (Arctic, Ember, Sage) × light & dark, no hard-coded hex anywhere.',
      },
      {
        title: 'Standalone & signal-based',
        body: 'Standalone components with signal inputs and OnPush change detection throughout. Drop in only what you use.',
      },
      {
        title: 'Form-ready',
        body: 'Every control implements ControlValueAccessor, so it works with ngModel and reactive forms out of the box.',
      },
      {
        title: 'Accessible, measured',
        body: 'WCAG AA contrast in all six schemes, keyboard-complete trees/charts/grids, shape-coded status for color-vision safety, reduced-motion everywhere.',
      },
    ],
    catsTitle: '104 components, organised',
    catsBody: 'categories — from buttons to datagrids, charts and full page patterns.',
    catComponents: 'components',
  },
  started: {
    title: 'Get started',
    lead: 'UIStruct is a standalone Angular component library. Add the package, import the theme once, and start dropping components in. No runtime CSS framework, no global module to register.',
    requirements: 'Requirements',
    reqAngular: 'or newer (standalone APIs & signals).',
    reqPeers: 'are peer dependencies.',
    install: '1 · Install',
    importTheme: '2 · Import the theme',
    importThemeBody:
      'Add the theme stylesheet once in your global styles. It ships the design tokens, a base reset and the form-control styles.',
    scheme: '3 · Choose a scheme',
    schemeBody: 'Set the palette and mode on the document root — or let',
    schemeOr: 'Or drop in the ready-made switcher anywhere:',
    first: '4 · Use your first component',
    firstBody: 'Every component is standalone — import just what you use.',
    next: 'Next steps',
    browse: 'Browse components',
    theming: 'Explore theming',
    icons: 'See the icon set',
  },
};

const TR: Dict = {
  code: 'tr',
  brandSub: 'Bileşen Kütüphanesi',
  getStarted: 'Başlarken',
  components: 'Bileşenler',
  search: 'Ara',
  theme: 'Tema',
  language: 'Dil',
  closeNav: 'Menüyü kapat',
  componentsCount: 'bileşen',
  groups: {
    foundations: 'Temeller',
    scenarios: 'Senaryolar',
    controls: 'Kontroller',
    forms: 'Formlar',
    surfaces: 'Yüzeyler',
    navigation: 'Gezinme',
    data: 'Veri',
    ops: 'Operasyon',
    charts: 'Grafikler',
    feedback: 'Geri bildirim',
    patterns: 'Desenler',
  },
  refNote:
    'Bileşen referansı, anlattığı API gibi İngilizce yazıldı. Sitenin geri kalanı burada seçtiğiniz dili izler.',
  measured: {
    heading: 'Ölçülenler',
    lede: 'Bir tarayıcının bu bileşenden okuduğu değerler ve ne zaman okunduğu. Her satır, yayınlandığı sürümden kalma tarihli bir olgudur ve yanında adı yazan kapı tarafından alınmıştır \u2014 bugünü iddia eden bir sayaç değil.',
  },
  landing: {
    kicker: 'Angular · altyapı arayüzü',
    title: 'Bir veri merkezini yöneten ekranlar için 104 bileşen.',
    tagline:
      'Host ve VM ağaçları, iki bin satırlık ızgaralar, kablolama haritaları, alarm eksenleri. Sağdaki konsol bir resim değil — bu kütüphanenin kendisi, bu sayfada çalışıyor.',
    browse: '104 bileşene göz atın',
    hint: 'Paleti değiştirin — konsol da onunla birlikte değişir.',
    consoleLabel: 'Bu kütüphaneyle kurulmuş, çalışan bir envanter konsolu',
    facts: {
      components: 'bileşen',
      icons: 'ikon',
      schemes: 'şema — 3 palet × 2 tema',
      measured: 'spec ve 19 ölçüm kapısı, her sürümde',
    },
    featuresHeading: 'Neden UIStruct',
    features: [
      {
        title: 'Tek token sistemi',
        body: 'Her renk CSS özel değişkenlerinden gelir — üç palet (Arctic, Ember, Sage) × açık ve koyu; hiçbir yerde sabit yazılmış renk yok.',
      },
      {
        title: 'Standalone ve signal tabanlı',
        body: 'Baştan sona signal girdileri ve OnPush değişiklik denetimiyle standalone bileşenler. Yalnızca kullandığınızı projeye alırsınız.',
      },
      {
        title: 'Formlara hazır',
        body: 'Her kontrol ControlValueAccessor uygular; ngModel ve reactive forms ile ek iş yapmadan çalışır.',
      },
      {
        title: 'Erişilebilir, ölçülmüş',
        body: 'Altı şemanın hepsinde WCAG AA kontrast, klavyeyle tam gezilebilen ağaçlar/grafikler/ızgaralar, renk körlüğüne karşı şekille kodlanmış durumlar ve her yerde azaltılmış hareket desteği.',
      },
    ],
    catsTitle: '104 bileşen, düzenli',
    catsBody: 'kategori — düğmelerden veri ızgaralarına, grafiklere ve tam sayfa desenlerine.',
    catComponents: 'bileşen',
  },
  started: {
    title: 'Başlarken',
    lead: 'UIStruct standalone bir Angular bileşen kütüphanesidir. Paketi ekleyin, temayı bir kez içe aktarın ve bileşenleri kullanmaya başlayın. Çalışma zamanında CSS çatısı yok, kaydedilecek global bir modül yok.',
    requirements: 'Gereksinimler',
    reqAngular: 've üzeri (standalone API’ler ve signal’lar).',
    reqPeers: 'peer bağımlılıklardır.',
    install: '1 · Kurulum',
    importTheme: '2 · Temayı içe aktarın',
    importThemeBody:
      'Tema stil dosyasını global stillerinize bir kez ekleyin. İçinde tasarım token’ları, bir temel sıfırlama ve form kontrolü stilleri gelir.',
    scheme: '3 · Bir şema seçin',
    schemeBody: 'Paleti ve modu belge kökünde ayarlayın — ya da yönetmesini ve saklamasını',
    schemeOr: 'Veya hazır anahtarı istediğiniz yere koyun:',
    first: '4 · İlk bileşeninizi kullanın',
    firstBody: 'Her bileşen standalone — yalnızca kullandığınızı içe aktarın.',
    next: 'Sonraki adımlar',
    browse: 'Bileşenlere göz atın',
    theming: 'Temalandırmayı keşfedin',
    icons: 'İkon setini görün',
  },
};

const DICTS: Record<Lang, Dict> = { tr: TR, en: EN };

function initial(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'tr' || saved === 'en') return saved;
  } catch {
    /* a private window or blocked storage is not a reason to fail */
  }
  return 'tr';
}

/**
 * The site's language, switched at runtime the way the palette is — no
 * second bundle and no reload, because a reload would lose the palette and
 * the page you were reading.
 */
@Injectable({ providedIn: 'root' })
export class LangService {
  private readonly current = signal<Lang>(initial());

  readonly lang = this.current.asReadonly();
  /** The whole dictionary for the current language. */
  readonly t = computed<Dict>(() => DICTS[this.current()]);

  constructor() {
    this.apply(this.current());
  }

  set(lang: Lang): void {
    this.current.set(lang);
    this.apply(lang);
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* the choice still holds for this visit */
    }
  }

  /** `lang` on the root element, so screen readers and the browser agree. */
  private apply(lang: Lang): void {
    if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', lang);
  }
}
