# Common Patterns

Canonical shapes the library is built for. Match the user's question to
one of these and lift the code.

## 1. Simple named query
Use when: the same selector appears in more than one place, or you
want a cacheable result.

```js
dom.define({ name: 'titles', selector: () => document.querySelectorAll('h2') })
const all = dom.run('titles')
```

## 2. Parameterized selector
Use when: the same traversal shape applies to many different starting
queries (e.g. "find elements of tag X that contain a child of tag Y").

```js
dom.define({
  name: 'by-tag',
  selector: (tag) => document.querySelectorAll(tag),
})
dom.run('by-tag', 'a')   // -> [ <a>, <a>, ... ]
dom.run('by-tag', 'li')  // -> [ <li>, <li>, ... ]
```

The extra args go to `selector`, `where`, and `final` — design your
`where` to ignore them if it doesn't need them.

## 3. Tree walk + filter
Use when: you have a root container and want a subset of its descendants.

```js
dom.define({
  name: 'visible-cards',
  selector: () => document.querySelector('#app'),
  direction: 'down',                        // walk all descendants
  where: ({ item }) => item.offsetParent ? item : null,
})
```

If `selector` returns a list, `direction` is ignored — so the same
pattern works with `selector: () => document.querySelectorAll('.card')`
and no `direction`.

## 4. Subtree test inside `where`
Use when: you want to keep an element based on what's inside it
(without scanning the whole tree with `direction`).

```js
dom.define({
  name: 'li-with-badge',
  selector: () => document.querySelectorAll('li'),
  where: ({ item, down }) => {
    for (const child of down(item)) {
      if (child.classList && child.classList.contains('badge')) return item
    }
    return null
  },
})
```

Same idea with `up` — "is this `<a>` inside a `<nav>`?" — checks
ancestors without setting `direction: 'up'`.

## 5. Stop early
Use when: the user only cares about the first N matches, or wants
short-circuit evaluation (e.g. "is there at least one match?").

```js
const END = Symbol('end___')   // captured locally if needed for compare

dom.define({
  name: 'first-two',
  selector: () => document.querySelectorAll('span'),
  where: ({ item, length, END }) =>
    length < 2 ? item : END,
})
```

**Important:** the `END` you return must be the one from the `where`
context. A homemade `Symbol()` is a different symbol and won't stop
the scan. See `references/api.md` for the full `END` semantics.

## 6. Projection (count, group, sort)
Use when: the result isn't a list of elements but a derived value.

```js
dom.define({
  name: 'link-count',
  selector: () => document.querySelectorAll('a'),
  final: (result) => result.length,
})
const n = dom.run('link-count')      // -> 42 (a number, not an array)
```

`final` runs once on the array. It can return any value — not just
arrays — and that's what `run` / `use` will return.

## 7. Cached + cheap re-read
Use when: you do a heavy-ish selector once and re-read it many times
with a different projection.

```js
dom.define({
  name: 'links',
  selector: () => document.querySelectorAll('a'),
  final: (result, externalOnly) => externalOnly
    ? result.filter(a => a.host !== location.host)
    : result,
})
dom.run('links')                  // queries DOM once, caches
dom.use('links', true)            // re-runs final, no DOM work
dom.use('links', false)
```

Note: `use` forwards args to `final` only. If the same flag also needs
to influence the `where` filter, you'd pass it to `run` and design
`where` to read it.

## 8. Fixed / pre-existing reference
Use when: an element already exists in your hand (modal just created,
button just mounted) and you want it to participate in the same
naming system as your selectors.

```js
const okButton = document.querySelector('#ok')
dom.remember('ok', okButton)
dom.use('ok').forEach(btn => btn.addEventListener('click', onConfirm))
```

`remember` is normalised through `convertToArray`, so `use` always
returns an array. `<form>` and `<select>` are special — they have
their own `.length` — but `remember` handles them correctly because
it doesn't duck-type.

## 9. Per-section ownership
Use when: a vanilla-JS app has multiple sections (header, sidebar,
list, modal) that each own their own selectors. Each section calls
`dom.define` for what it needs; the rest of the app only sees
`dom.run('section.selector-name')`.

```js
// header.js
dom.define({ name: 'header.brand', selector: () => document.querySelector('.brand') })

// cart.js
dom.remember('cart.button', document.querySelector('.cart-btn'))

// somewhere else
dom.run('header.brand')             // -> [ <a.brand> ]
dom.use('cart.button')              // -> [ <button.cart-btn> ]
```

Namespacing the names (`header.brand`, `cart.button`) avoids collisions
across sections and makes the call site self-documenting.

## 10. Inline one-shot selector
Use when: you have a selector that won't be reused and don't want to
clutter the store.

```js
const links = dom.run({
  name: 'inline-links',
  selector: () => document.querySelectorAll('a'),
  where: ({ item }) => item.host !== location.host,
})
```

`run` accepts a `Selection` object directly — it `define`s it inline
and runs it once. Useful for one-offs in `init` functions.

## Anti-patterns to flag

- **Creating a homemade `END = Symbol('end___')`** and returning it from
  `where`. Always pull `END` from the `where` context. See
  `references/api.md` § END semantics.
- **Iterating with `use` and expecting a fresh DOM read.** `use`
  doesn't touch the DOM; it transforms the cached array via `final`.
  If the DOM has changed, call `run` again.
- **Re-defining a name expecting the cache to keep the old result.**
  Since 3.1.4 the cache is invalidated on re-define.
- **Calling `use` for a name that was only `remember`-ed with a
  custom `final` registered separately.** `remember` doesn't store a
  `final`; `use` falls back to identity. If you need a projection, use
  `define` with `selector: () => []` and just `final`, or store the
  result yourself.
