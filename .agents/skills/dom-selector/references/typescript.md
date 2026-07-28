# TypeScript Usage

The library ships its own type declarations at `types/main.d.ts`
(auto-generated from the JSDoc on `src/main.js`). The named types
`Selection`, `WhereContext`, `WalkFn`, and `DomSelector` are exported.

This file collects the patterns that come up most often when writing
typed code against the library.

## Importing

```ts
import domSelector, {
  type Selection,
  type WhereContext,
  type WalkFn,
  type DomSelector,
} from '@peter.naydenov/dom-selector'

const dom: DomSelector = domSelector()
```

If your project is CJS or your bundler is strict about default imports,
use the namespace import:

```ts
import * as domSelectorNs from '@peter.naydenov/dom-selector'
const dom = domSelectorNs.default()
```

## Typing a `where` callback

The `WhereContext` type is what `where` receives. Importing it gives
you full autocomplete on `item`, `i`, `END`, `length`, `up`, `down`:

```ts
import type { WhereContext } from '@peter.naydenov/dom-selector'

const isVisible = ({ item, length, END }: WhereContext): Element | symbol | null => {
  if (length >= 10) return END          // stop after 10 results
  return item.offsetParent ? item : null
}
```

`item` is typed as `any` in the shipped types, because the selector
return is loose. If you know your selector returns a narrower type
(e.g. `HTMLAnchorElement`), you can refine it inside `where`:

```ts
const onlyExternal: WhereContext['where'] = ({ item }) => {
  const a = item as HTMLAnchorElement
  return a.host && a.host !== location.host ? a : null
}
```

## Typing `final`

`final` is `(result: any[], ...args: any[]) => any`. If you want
`run` to return a typed value (e.g. a `number` for a count), declare
it on the variable that receives the return:

```ts
const count: number = dom.run('link-count')
//   ^? number — inferred from `final: result => result.length`
```

For a typed array result, narrow the variable:

```ts
const anchors: HTMLAnchorElement[] = dom.run('links') as HTMLAnchorElement[]
```

There is no built-in way to "lock" the result type to a `Selection`
declaration — `final` is intentionally `any` to allow projections.
Type the call site instead.

## A fully-typed `define`

```ts
import domSelector, { type Selection, type WhereContext } from '@peter.naydenov/dom-selector'

const dom = domSelector()

const links: Selection = {
  name: 'links',
  selector: () => document.querySelectorAll<HTMLAnchorElement>('a'),
  where: ({ item }: WhereContext) =>
    item.host !== location.host ? item : null,
  final: (result) => result.length,
}

dom.define(links)   // -> true
const n = dom.run('links')   // -> number (typed at the call site)
```

## Common typed patterns

### Parameterized selector with a typed arg

```ts
const byTag: Selection = {
  name: 'by-tag',
  selector: (tag: keyof HTMLElementTagNameMap) =>
    document.querySelectorAll(tag),
}
dom.run('by-tag', 'a')   // typed argument
```

### Generic `where` that narrows the element type

```ts
function onlyOfType<T extends Element>(predicate: (el: Element) => el is T) {
  return ({ item }: WhereContext) => (predicate(item) ? item : null)
}

dom.define({
  name: 'anchors',
  selector: () => document.querySelectorAll('a'),
  where: onlyOfType((el): el is HTMLAnchorElement => el.tagName === 'A'),
})
// dom.run('anchors') is Element[] at the type level; cast to HTMLAnchorElement[] if you need it
```

### Reusing a single `where` for many selectors

```ts
const visible: WhereContext['where'] = ({ item }) =>
  item instanceof HTMLElement && item.offsetParent ? item : null

dom.define({ name: 'cards',     selector: () => document.querySelectorAll('.card'),     where: visible })
dom.define({ name: 'modals',    selector: () => document.querySelectorAll('.modal'),    where: visible })
```

## Things the types do **not** tell you

- `END` is a `symbol` in the types, but every `run` call creates a
  *different* `Symbol('end___')`. The type system can't express that
  the `END` you return must be the one from the context — read the
  `END` semantics section in `references/api.md` to internalise it.
- `where` can return `Element[]`, but the result array will be flat —
  no nested arrays survive. The type doesn't say so, but the runtime
  spreads the return.
- The `result` argument to `final` is always an `Array<unknown>` at
  the type level, even if your `where` narrows the items. Cast at the
  call site.
