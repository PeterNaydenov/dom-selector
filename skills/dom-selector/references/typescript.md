# TypeScript Usage

The library ships its own type declarations: `types/main.d.ts` for
ESM (auto-generated from the JSDoc on `src/main.js`) and
`types/main.d.cts` for CommonJS. Both are wired through the `exports`
map, so they resolve under `moduleResolution` `node16`, `nodenext` and
`bundler`. The named types `Selection`, `WhereContext`, `WalkFn`, and
`DomSelector` are exported.

This file collects the patterns that come up most often when writing
typed code against the library.

## Contents
- Importing (ESM and CommonJS)
- Typing a `where` callback
- Typing `final`
- A fully-typed `define`
- Common typed patterns
- Things the types do not tell you

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

In a CommonJS project (`.cts` files, or `"type": "commonjs"` with
`module: node16`/`nodenext`), `require` returns the factory itself.
The named types live on the same identifier:

```ts
import domSelector = require('@peter.naydenov/dom-selector')

const dom: domSelector.DomSelector = domSelector()
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
const onlyExternal: NonNullable<Selection['where']> = ({ item }) => {
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
// `run` returns `any`; the annotation is what makes `count` a number
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
const visible: NonNullable<Selection['where']> = ({ item }) =>
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
- The `result` argument to `final` is always `any[]` at the type
  level, even if your `where` narrows the items. Annotate or cast it
  inside `final` if you need element types.
