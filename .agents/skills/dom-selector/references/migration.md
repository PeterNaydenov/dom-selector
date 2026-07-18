# Version Migration Notes

Behaviour and signatures that changed across major versions. If the
user is on an older version, write code that works for *their* version,
not the latest.

## Quick check

| version | `where` shape                                | `where` return contract       | `direction`            | `final` | `END` semantics |
| ------- | -------------------------------------------- | ----------------------------- | ---------------------- | ------- | --------------- |
| 1.x     | `(node, i)`                                  | `true` / `false`              | `'up'` / `'down'`      | no      | n/a             |
| 2.x     | `({item, i, END, length, up, down})`         | `Element \| null \| END`       | `'up'` / `'down'`      | no      | per-call        |
| 3.x     | `({item, i, END, length, up, down})`         | `Element \| null \| END \| Element[]` | `'up'` / `'down'` / `'none'` (default `'none'`) | yes (3.1.0+) | per-call |

## 1.x → 2.x

`where` was reshaped from positional args to a single context object,
and the return contract changed from boolean to "keep / skip / stop":

```js
// 1.x
define({
  name: 'cards',
  selector: () => document.querySelectorAll('.card'),
  where: (node, i) => node.classList.contains('active'),
})

// 2.x
define({
  name: 'cards',
  selector: () => document.querySelectorAll('.card'),
  where: ({ item, i }) => item.classList.contains('active') ? item : null,
})
```

The new shape unlocks the `END` symbol (stop the scan), `length` (how
many items already in the result), and `up` / `down` (walk ancestors /
descendants from inside `where`).

The standalone `stop(name, result) => boolean` function was removed in
2.x. Replace it with `where` returning `END`.

`function ( ) { stop ... }` was also removed in 2.x; use `where` and
return `END` to stop.

## 2.x → 3.x

Two main changes:

### `direction: 'none'`
3.0 added a third `direction` value, `'none'`, and made it the default.
In 2.x the default was `'down'` (inconsistent and surprising). In 3.x
the result is **not** auto-expanded unless you say so:

```js
// 2.x — silently expanded to all descendants
define({ name: 'cards', selector: () => document.querySelector('#cards') })

// 3.x — same shape, but the result is just the #cards element
define({ name: 'cards', selector: () => document.querySelector('#cards') })

// 3.x — to keep the 2.x behaviour
define({
  name: 'cards',
  selector: () => document.querySelector('#cards'),
  direction: 'down',
})
```

This is the most common silent break in 2.x → 3.x migrations. If the
user's code was relying on auto-expansion, add `direction: 'down'`.

### `final(result, ...args) => any` (3.1.0+)
Optional reshape hook. Runs once on the final array. Can return any
value. `run` and `use` return whatever `final` returns.

```js
// count without storing the array
define({
  name: 'link-count',
  selector: () => document.querySelectorAll('a'),
  final: (result) => result.length,
})
const n = dom.run('link-count')   // -> 42 (a number)
```

## 3.0 → 3.1.x

Additive only — no breaking changes between 3.0 and 3.1.x. New bits:
- **3.1.0**: `final` hook, `END` from context (was undocumented in
  older 2.x; the per-call symbol was already how it worked, the
  README now says so).
- **3.1.3**: `use` works after `remember` without `define` (previously
  threw). `run({selectorObject})` inline form now works (previously
  silently returned `[]`). `remember` normalises through
  `convertToArray` (previously double-wrapped empty NodeLists and
  mis-treated `<form>` / `<select>` as lists).
- **3.1.4**: `up` no longer throws on a detached element. `define`
  and `run` return `false` / `[]` instead of throwing on bad input.
  Re-`define` invalidates the cache (previously left stale results).

If the user is on 3.0 or 3.1.0–3.1.2 and writes code that uses 3.1.3+
behaviour, flag the upgrade. The 3.1.4 changes are mostly fixes for
things that already worked but produced surprising results.

## Common footguns when porting from tutorials

1. **Where name = "node" in old code, "item" in new code.** Some
   tutorials from 1.x → 2.x used the old name. Always destructure
   `item`, not `node`.
2. **Returning `true` / `false` from `where` in 2.x+.** The
   library coerces truthy values to the result, so `return true` would
   push the literal `true` into the result. Always return the element
   or `null`.
3. **Assuming `direction: 'down'` is the default.** It is in 2.x, not
   in 3.x. Code that "used to work" in 2.x will silently return just
   the root element after upgrading.
4. **Creating a homemade `END = Symbol('end___')`.** Only the
   per-call symbol from the `where` context stops the scan. This is
   the most common footgun in the library; the README and
   `references/api.md` both spell it out.

## Where the canonical types live

The `types/main.d.ts` file in the repo is auto-generated from the
JSDoc in `src/main.js` via `tsc`. If a type doesn't match what the
README says, the `.d.ts` is the source of truth for what consumers
actually get.
