# FR-80-07 — `StrctProductItem.routerLink` cannot carry a query

**Filed by:** HyperStruct, 2026-11-14, against **7.14.0**. The operator, moving between Manager,
Backup and Migrate: "every time it sends me to the product's default page". HyperStruct's switcher now
opens the page left in each product, as it was left: `/objects/host-3?tab=configure`,
`/migrate/runs?run=9`. A page's tab and filters live in its query.

## What happens today

`StrctProductItem.routerLink` is typed `string | unknown[]`, and the row binds it to
`[routerLink]="item.routerLink"`.

- A **string** is one path: `'/migrate/runs?run=9'` becomes `href="/migrate/runs%3Frun%3D9"`. Angular
  encodes the `?`, and the route does not match.
- **Commands** (`['/migrate/runs']`) carry no query either. The row has no `queryParams` slot.

Angular's `RouterLink` has accepted a `UrlTree` since 17.1, and the row works with one: measured in
HyperStruct's spec, `href="/migrate/runs?run=9&view=log"` and a click lands there. HyperStruct passes
one through a cast (`as unknown as string`), marked in `product-switcher.ts`.

## Ask

- **`routerLink?: string | readonly unknown[] | UrlTree`** on `StrctProductItem`, bound as today.
- Or `queryParams?: Params` and `fragment?: string` beside it, bound to the row's `RouterLink`.
  The `UrlTree` form is the smaller change, and it is what a consumer that remembers an address
  already holds.
- The same for any other item type that renders a router link (`StrctRailItem`, `StrctMenuLink`), so
  one rule holds across the library.

## Acceptance

- A row with `routerLink: router.parseUrl('/a/b?x=1&y=2#f')` renders `href="/a/b?x=1&y=2#f"`, and a
  plain click navigates there.
- A modified click (Ctrl/⌘, middle) is still the browser's: a new tab at the same address.
- String and command rows behave as today.
