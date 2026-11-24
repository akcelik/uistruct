/** Sanallaştırma nesne ikonları. */
export type StrctIconName =
  'host' | 'vm' | 'vm-template' | 'vm-snapshot' | 'vm-clone' | 'vm-migration';

/** Power state rozeti. */
export type StrctIconState = 'running' | 'off' | 'suspended' | 'error';

/** Desteklenen boyutlar (px). 16 kendi ızgarasında çizilir, diğerleri 36'lık master'dan ölçeklenir. */
export type StrctIconSize = 16 | 24 | 32 | 48;

/** Boyuta göre ekranda görünecek gerçek çizgi kalınlığı (px). */
export const STRCT_ICON_STROKE_PX: Record<Exclude<StrctIconSize, 16>, number> = {
  24: 1.5,
  32: 1.75,
  48: 2,
};
