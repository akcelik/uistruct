# strct-icon — UIStruct sanallaştırma ikonları

`@akcelik/strct` için host / VM ikon ailesi: Angular bileşeni, component-tier token'lar ve statik SVG'ler.

## Kural seti

| Kural                 | Uygulama                                                                 |
| --------------------- | ------------------------------------------------------------------------ |
| Kimlik çerçevede      | Düz çerçeve = fiziksel (`host`), kesikli çerçeve = sanal (`vm*`)         |
| Türev nesne rozetle   | `vm-template`, `vm-snapshot`, `vm-clone`, `vm-migration` → sağ alt rozet |
| Renk yalnızca durumda | Gövde daima `currentColor`; renk sadece `state` rozetinde                |
| 16px ayrı çizilir     | Köşe parantezli sade gövde; tip rozeti yok, state yalnızca nokta         |

## Dosyalar

```
src/lib/icon/
  icon.component.ts     standalone <strct-icon>, signal input'lar, OnPush
  icon.component.scss   semantic token'lara bağlı stiller + forced-colors desteği
  _icon.tokens.scss     component tier token'lar (semantic eşlemesi yapılacak)
  icon.types.ts         StrctIconName / StrctIconState / StrctIconSize
scripts/build-svg.mjs   statik SVG üretici (Figma, doküman, Angular dışı kullanım)
svg/{16,24,32,48}/      üretilmiş SVG'ler (36 dosya)
```

## Projeye ekleme

1. `src/lib/icon/` klasörünü strct kütüphanesine kopyalayın, `public-api.ts`'e ekleyin:
   ```ts
   export * from './lib/icon';
   ```
2. `_icon.tokens.scss`'i token katmanınıza dahil edin ve sağ taraftaki
   `--strct-color-*` adlarını UIStruct'taki gerçek semantic token adlarıyla değiştirin
   (Arctic / Ember / Sage paletlerinin her biri kendi semantic değerlerini verdiği sürece
   bileşen tarafında değişiklik gerekmez).

Gereksinim: Angular 17.1+ (signal `input()` ve `@if/@switch` control flow).
Angular 19 + `strictTemplates` ile derlenerek doğrulandı.

## Kullanım

```html
<strct-icon name="host" />
<strct-icon name="vm" state="running" label="Çalışıyor" />
<strct-icon name="vm-snapshot" [size]="48" />
<strct-icon name="vm" [size]="16" state="error" />
```

| Input   | Tip                                                                    | Varsayılan |
| ------- | ---------------------------------------------------------------------- | ---------- |
| `name`  | `host \| vm \| vm-template \| vm-snapshot \| vm-clone \| vm-migration` | `vm`       |
| `size`  | `16 \| 24 \| 32 \| 48`                                                 | `24`       |
| `state` | `running \| off \| suspended \| error \| null`                         | `null`     |
| `label` | `string` — verilirse `role="img"` + `aria-label`, yoksa dekoratif      | `''`       |

Notlar:

- `state` ile tip rozeti aynı anda istenirse yalnızca state gösterilir (dev modda uyarı verir).
- 16px'te tip rozetleri çizilmez (dev modda uyarı). Nesne tipinin önemli olduğu yerde 24px kullanın.
- Çizgi kalınlığı boyuta göre sabit tutulur: 24px → 1.5px, 32px → 1.75px, 48px → 2px.
- Renk durum için tek başına bilgi taşımaz: kapalı = boş halka + soluk gövde,
  askıda = pause işareti, hata = ünlem. `forced-colors` modunda sistem renklerine düşer.

## Teknik not: neden maske yok

Kesikli çerçeve rozet alanında maskeyle oyulduğunda, maskenin yumuşak kenarı
kesik uçlarını yarı saydam bırakıyor ve Chrome dahil tarayıcılarda soluk "hayalet"
izler oluşuyordu. Bu yüzden rozetli sanal varyantlarda çerçeve, rozet çemberinin
(r = 9.5) dışında biten açık bir yol olarak çizilir. `pathLength` + `stroke-dashoffset`
ayarı iki uçta eşit boşluk bırakır. Maske yalnızca düz çerçeveli `host` + `state`
durumunda kullanılır; düz çizgide bu sorun oluşmaz.

## SVG'leri yeniden üretme

```bash
node scripts/build-svg.mjs svg
```
