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

## Shipped in 7.16.0 (2026-11-14)

`routerLink?: string | readonly unknown[] | UrlTree` on `StrctProductItem`,
`StrctMenuLink` and `StrctRailItem`, and the same on `strct-desc`'s own
`routerLink` input — one rule across the library, as asked.

### Against the acceptance

| asked                                                              | measured                                                                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| a row with `router.parseUrl('/a/b?x=1&y=2#f')` renders that `href` | `/migrate/runs?run=9&view=log#last` in the switcher's own row                                                     |
| a plain click navigates there                                      | `router.url` is that address after the click                                                                      |
| a modified click is still the browser's                            | unchanged: the guard that returns on a modified or non-primary click asks only whether the item has a destination |
| string and command rows behave as today                            | the rest of the suites — 1403 specs — pass unchanged                                                              |

These are specs rather than a browser gate: the claim is an `href` string and
a router state, both of which a spec holds exactly.

### What the report did not have

- **The typing was not the whole change.** `RouterLink` has accepted a
  `UrlTree` since 17.1, which is why the cast worked for rendering — but the
  menu and the rail do not only bind the value. They ask the router whether
  the entry is the active one, and they did that by building a tree out of it:
  `createUrlTree(Array.isArray(link) ? link : [link])`. Handed a `UrlTree`,
  that wraps a tree in an array of commands, and the entry never matched. The
  spec that navigates to the address and expects the entry to be marked active
  **fails on 7.15.0** — verified by reverting the hunk and running the suite:
  1 failed, 1402 passed.
- **`strct-desc` keeps `queryParams` and `fragment` as well.** They were added
  for FR-60-01 and still work; a `UrlTree` is the other way to say the same
  thing, and it is the one a consumer that remembers an address already holds.
