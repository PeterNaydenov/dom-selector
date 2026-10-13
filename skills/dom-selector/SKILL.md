---
name: dom-selector
description: Writes, explains, debugs, and migrates code that uses the `@peter.naydenov/dom-selector` library (named, cached DOM selections). Covers `domSelector()`, `define` / `run` / `use` / `remember`, `direction` tree walks, `where` filtering and the per-call `END` symbol, `final` projections, the `Selection` / `WhereContext` / `WalkFn` / `DomSelector` types, framework setup (Vue, Svelte, Node/JSDOM), and 1.x → 2.x → 3.x migration. Use whenever the user's code imports `@peter.naydenov/dom-selector` or calls `dom.define` / `dom.run` / `dom.use` / `dom.remember`, or they ask to cache DOM lookups by name, walk ancestors or descendants, stop a scan early, or reshape a selection result with this library — even if they don't name the package. Do not use for plain `document.querySelector` questions or other `@peter.naydenov/*` packages.
---

# DOM Selector

## Inputs to collect
- **Library version.** Read `@peter.naydenov/dom-selector` from the user's `package.json`; ask only if it's unavailable. Defaults and contracts differ across 1.x, 2.x and 3.x (`where` shape, `direction` default, `final`).
- **The DOM being queried.** A file, an HTML snippet, or a description. Without it, examples can't be grounded.
- **Desired output shape.** Elements, a count, one element, a derived value? This decides between `where`, `final`, or a bare `selector`.
- **Environment.** Browser, Node/JSDOM, or a framework (Vue / Svelte). Decides whether `document` exists when `selector` runs.

## Procedure
1. **Read `references/api.md`** for the full surface: 4 methods, 5 `Selection` properties, the `WhereContext` object, `END` semantics. The defaults (`direction: 'none'`, identity `where`) produce silently empty or unexpected results when misunderstood.
2. **Read `references/patterns.md`** and match the question to one of its ten patterns. Most real usage is one of them.
3. **TypeScript user?** Also read `references/typescript.md` (ESM vs CommonJS imports, typing `where` and `final`).
4. **Vue, Svelte, or Node/JSDOM?** Also read `references/framework-integration.md` (when to `define` vs `run`, one instance per feature, SSR).
5. **Older version or upgrading?** Read `references/migration.md`. Old tutorial code fails silently on 3.x rather than throwing.
6. **Draft the answer** with the rules below in mind — these are what people get wrong:
   - `run(name, ...args)` forwards extra args to `selector`, `where`, **and** `final`. `use(name, ...args)` forwards them to `final` **only** and never touches the DOM.
   - `direction` defaults to `'none'`: nothing is expanded. `'up'` / `'down'` expand **every** `HTMLElement` the selector returns — a single element or each item of a list — and drop anything that isn't an `HTMLElement`. Expanding a list of nested elements yields duplicates.
   - `where` returns the element (keep), `null` (skip), an `Element[]` (keep each), or `END` (stop). Any other truthy value is kept as-is, so `return item.matches('a')` fills the result with `true`.
   - `END` is a fresh `Symbol` per `run`, delivered as `ctx.END`. A homemade `Symbol()` never stops the scan.
   - `final` runs once on the result array and may return anything, so `run` / `use` don't always return an array.
   - Re-`define` overwrites the selector and wipes its cached result (3.1.4+). `use` then returns `[]` until the next `run`.
   - `domSelector()` and `new domSelector()` both work; prefer the bare call, which is what the types advertise.
7. **When in doubt, check the installed types** at `node_modules/@peter.naydenov/dom-selector/types/main.d.ts`. They are generated from the source JSDoc; if a reference file disagrees, the types win.
8. **Call out non-obvious behaviour** in the reply (cache invalidation, `END`, arg forwarding, `final` returning a non-array) so the user doesn't have to rediscover it.

## Output contract
- **Code that runs:** include the import and `const dom = domSelector()`, at least one `define` (or inline `run({...})`), and a `run` call. No `...` placeholders hiding structure.
- **One recommendation.** If several approaches work, pick one and say why in a sentence or two.
- **Version stamps** where behaviour is version-specific: `// 3.1.0+: final`, `// 3.1.4+: re-define clears the cache`.
- **Summarise, don't dump.** For deep topics (migration, `END`), give the relevant rule and a snippet; the user can't see this skill's reference files.

## Failure handling
- **User is on 1.x/2.x and asks about a 3.x feature** (`final`, `Element[]` from `where`, `direction: 'none'`): say so first and write code for *their* version, or show the upgrade path from `references/migration.md`.
- **"The scan doesn't stop"** → they returned a homemade `Symbol` instead of `ctx.END`. The most common footgun.
- **"`run` returns `[]` / nothing happens"** → `define` returned `false` (missing `name`, non-function `selector`, `null` input; 3.1.4+ returns instead of throwing), or the name was never defined.
- **"`use` returns `[]`"** → `run` was never called, or `define` ran after the last `run` / `remember` and wiped the cache.
- **"Too many / duplicate results with `direction`"** → the selector returns a list and `direction` expands each item. Return a single root, or drop `direction` and filter the list in `where`.
- **"`where` never sees my item"** → with `direction: 'up' | 'down'`, non-`HTMLElement` values (`window`, `document`, text nodes, plain objects) are dropped before `where` runs. Use `direction: 'none'` or return an element.

## Examples

**Input:** "How do I find every `<li>` inside `.nav` that has a `<span>` somewhere in it?"
**Output:**
```js
import domSelector from '@peter.naydenov/dom-selector'
const dom = domSelector()

dom.define({
  name: 'nav-li-with-span',
  selector: () => document.querySelectorAll('.nav li'),   // a list: no direction needed
  where: ({ item }) => item.querySelector('span') ? item : null,
})
const lis = dom.run('nav-li-with-span')
```
`direction: 'down'` from `.nav` would also visit the `<ul>`, `<a>` and `<span>` elements, so `where` would have to check the tag name too.

**Input:** "I return `END` from `where` but the scan doesn't stop. I declared `const END = Symbol()` at the top."
**Output:** Your `END` is a different symbol from the one the library checks. Each `run` creates its own and passes it in the context:
```js
where: ({ item, END }) => item.tagName === 'A' ? END : item
//                 ^^^ the per-call symbol from the context
```

**Input:** "I want to reuse the last result without re-querying the DOM, but the projection depends on a flag."
**Output:** `run` once to cache, then `use` for cheap reads. `use` forwards args to `final` only:
```js
dom.define({
  name: 'links',
  selector: () => document.querySelectorAll('a'),
  final: (result, externalOnly) => externalOnly
    ? result.filter(a => a.host !== location.host)
    : result,
})
dom.run('links')            // queries the DOM once, caches
dom.use('links', true)      // no DOM work, just final
dom.use('links', false)
```
