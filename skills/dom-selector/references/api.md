# API Reference

Source of truth for the library surface. Mirrors `types/main.d.ts` (3.1.4+).
If a discrepancy exists between this file and the generated `.d.ts`, the
`.d.ts` wins — it is what consumers actually get.

## Contents
- Public surface and calling the factory
- `Selection`: `name`, `selector`, `where`, `direction`, `final`
- `WhereContext`, `END` semantics, `up` / `down`
- Method behaviour: `define`, `remember`, `run`, `use`
- Things that look like bugs but aren't

## Public surface

The factory function returns an object with four methods:

```ts
declare function domSelector(): DomSelector;

type DomSelector = {
  define:    (selection: Selection) => boolean;
  remember:  (name: string, value: any) => void;
  run:       (name: string | Selection, ...args: any[]) => any;
  use:       (name: string, ...args: any[]) => any;
};
```

Each `domSelector()` call returns a **fresh, isolated instance** — stores
are not shared between instances.

### Calling the factory

Both forms work and produce the same result:

```js
const dom = domSelector()       // recommended
const dom = new domSelector()   // also fine
```

The factory explicitly returns an object literal, so `new` changes
nothing. Match the project's existing style; for fresh code prefer
`domSelector()` — that's the signature the TypeScript types advertise.

## `Selection`

The object passed to `define` (or to `run` for the inline form).

```ts
type Selection = {
  name:      string;                                                  // required, truthy
  selector:  (...args: any[]) =>
                Element | NodeList | HTMLCollection | any[] | null | undefined;
  where?:    (ctx: WhereContext, ...args: any[]) =>
                Element | Element[] | symbol | null | undefined;      // default: ({item}) => item
  direction?: 'up' | 'down' | 'none';                                // default: 'none'
  final?:    (result: any[], ...args: any[]) => any;                  // default: identity
};
```

### `name`
Required and must be truthy. Empty string, `0`, `null` → `define` returns
`false`. Re-defining an existing name **overwrites the selector and
invalidates the cache** (3.1.4+).

### `selector`
Required and must be a function. Called with whatever extra args you pass
to `run`. Can return a single element, a `NodeList`, an `HTMLCollection`,
any array, or `null` / `undefined` (nothing selected) — so
`() => document.querySelector('.x')` type-checks under `strict` (3.1.8+).

### `where`
Optional. Called once per candidate with a `WhereContext`. Return values:
- the element → add to result
- `null` → skip
- `Element[]` → add each element
- `END` (the symbol from the context) → stop the scan

Any other truthy value is added to the result as-is, and any other falsy
value skips. So a predicate like `({ item }) => item.matches('a')` fills
the result with `true` — return `item` or `null` instead.

If you omit `where`, the library installs a default that returns the item
unchanged.

### `direction`
Optional, default `'none'`. Controls whether the selector's output is
expanded before `where` runs:
- `'up'` — each element plus its ancestors, up to and including `<body>`
- `'down'` — each element plus all its descendants, depth-first
- `'none'` — no expansion; the selector's output reaches `where` as-is

With `'up'` / `'down'`, expansion applies to **every** `HTMLElement` the
selector returns — a single element or each item of a list. Values that
are not `HTMLElement` (`window`, `document`, text nodes, plain objects)
are **dropped** and never reach `where`. Expanding a list whose items are
nested inside each other produces duplicates. (In 2.x lists were never
expanded; that changed in 3.0.)

`up()` and `down()` are also exposed **inside the where context** (see
`WhereContext` below), so you can do a subtree test from a where callback
without setting `direction` on the selection.

### `final`
Optional. Called once on the final array **after** `where` has done its
filtering. Default is identity. Can return any value — `run` and `use`
return whatever `final` returns, not necessarily an array.

## `WhereContext`

Passed as the first argument to `where`.

```ts
type WhereContext = {
  item:   any;            // current element from the source list
  i:      number;         // 0-based index in the source list
  length: number;         // result.length *before* `item` is considered
  END:    symbol;         // per-call Symbol; return from where to stop
  up:     WalkFn;         // ancestors of `item` (up to and including <body>)
  down:   WalkFn;         // `item` + all descendants (depth-first)
};

type WalkFn = (startingElement: HTMLElement) =>
                 Generator<HTMLElement, void, void>;
```

### `END` semantics — read this carefully
- `_select` creates a fresh `Symbol('end___')` for every `run` call.
- It hands that symbol to your `where` callback as `ctx.END`.
- The only way to stop the scan is to return that *exact* symbol from
  `where`. A self-made `Symbol('end___')` is a different symbol and the
  `r === END` check inside the library will not fire.
- The symbol never escapes the call boundary (you can't compare against
  it from outside `where`).

### `up` and `down` inside `where`
Both are generators. `down(item)` yields `item` and all descendants;
`up(item)` yields `item` and all ancestors up to and including `<body>`.
Use them when you need to check the subtree of a candidate without
expanding the whole selection with `direction`.

Detached elements: `up(detachedElement)` yields just itself and stops
(3.1.4+; previously threw `TypeError` on `null.tagName`).

## Method behaviour

### `define(selection): boolean`
- Returns `true` if stored.
- Returns `false` (no throw) if: `selection` is `null` / `undefined` /
  non-object, `name` is missing/empty, `selector` is missing or not a
  function.
- Re-defining an existing name overwrites and invalidates the cache.

### `remember(name, value): void`
- Stores `value` (normalised via `convertToArray`) under `name` for
  `use` to read back later.
- Single element → wrapped in `[element]`. `NodeList` / `HTMLCollection`
  / `Array` → kept as-is. `null` / `undefined` → `[]`.
- `<form>` and `<select>` have a numeric `.length` of their own; do not
  try to normalise by hand, just call `remember`.

### `run(name, ...args): any`
- Looks up the selector under `name` (or registers a `Selection` object
  inline) and executes it.
- Forwards `...args` to `selector`, `where`, **and** `final`.
- Returns whatever `final` returns (an array by default).
- Returns `[]` for: a missing name, a bad inline `Selection`, bad input
  (`undefined`, `null`, non-string non-object).

### `use(name, ...args): any`
- Re-reads the cached result of the last `run` or `remember` for `name`.
- Does **not** call the `selector` — zero DOM work, just `final`.
- Forwards `...args` to `final` only (not to `selector` or `where`).
- Returns `[]` for an unknown name.
- Falls back to identity `final` if the name is only `remember`-ed (no
  `final` registered).

## Things that look like bugs but aren't

- **`run` returns a number, not an array** — the selection has
  `final: result => result.length`. `run` returns `final(result)`, not
  `result`. Document this in the answer if relevant.
- **Re-define + `use` returns `[]`** — since 3.1.4, re-`define` wipes
  the cache. Call `run` first if you want `use` to read.
- **`use` does not re-run** — by design. If the user wants fresh DOM
  data, they need `run`.
- **`remember` + `final`: order matters.** `use` applies the `final`
  registered under the same name. `define` → `remember` → `use` runs
  `final` over the remembered value; `remember` → `define` → `use`
  returns `[]`, because `define` wiped the remembered value.
- **`direction` with a list returns more than expected** — each list
  item is expanded (see `direction`).
