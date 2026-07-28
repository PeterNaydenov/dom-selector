# Framework Integration

`dom-selector` is framework-agnostic — it doesn't import or assume
anything. The integration is "create an instance, register selectors,
call `run` / `use`". This file collects the patterns that come up in
the most common frameworks: Vue 3, Svelte, and Node/JSDOM (server-side
or test).

The mental model is the same in all of them: **one `dom` instance per
setup boundary, never shared across boundaries**. Each `define`
belongs to one feature; `use` reads back what that feature cached.

---

## Vue 3 (Composition API, Vite)

The repo ships a `test/vue-example-01.vue` that uses the same
shape. The pattern that scales is a **composable per feature**, each
one owning its own `dom` instance.

```ts
// composables/useDomHeader.ts
import { onMounted, onUnmounted } from 'vue'
import domSelector from '@peter.naydenov/dom-selector'

export function useDomHeader() {
  const dom = domSelector()

  onMounted(() => {
    dom.define({ name: 'brand',    selector: () => document.querySelector('.brand') })
    dom.remember('cart-btn', document.querySelector('.cart-btn'))
  })

  onUnmounted(() => {
    // Optional: clear caches if the component is long-lived
    // The instance is GC'd on unmount anyway
  })

  return {
    brand:    () => dom.use('brand'),
    cartBtn:  () => dom.use('cart-btn'),
  }
}
```

```vue
<!-- Header.vue -->
<script setup>
import { useDomHeader } from './composables/useDomHeader'
const { brand, cartBtn } = useDomHeader()
</script>

<template>
  <a class="brand" href="/">Logo</a>
  <button class="cart-btn" @click="openCart">Cart</button>
</template>
```

Two things to watch in Vue specifically:

1. **`onMounted` is the only safe place to call `define`** for
   selectors that touch `document.querySelector(...)`. The component
   template is in the DOM by then.
2. **Don't put `domSelector()` at module top-level** in a Vue SFC
   project — Vite's HMR will reload the module and re-`define`
   everything, which invalidates every cache. Keep the `domSelector()`
   call inside the composable function so it runs per component
   instance.

### A cross-feature pattern: a `dom` "registry" store

For apps with many features, expose a `dom` instance through a Pinia
store or `provide`/`inject`:

```ts
// stores/dom.ts
import { defineStore } from 'pinia'
import domSelector from '@peter.naydenov/dom-selector'

export const useDomStore = defineStore('dom', () => {
  // One instance for the whole app — shared by every component.
  // Use this when features genuinely need to share selectors.
  const dom = domSelector()
  return { dom }
})
```

Then anywhere in the app:

```ts
import { useDomStore } from '@/stores/dom'
const { dom } = useDomStore()
dom.run('header.brand')
```

The trade-off: a shared store means a shared cache, which means
re-`define` from one feature invalidates the cache for every
component. For most apps, **per-feature composables are safer**.

---

## Svelte 4 / 5

The shape is the same as Vue — a per-component instance created in
`onMount`:

```svelte
<!-- Header.svelte -->
<script>
  import { onMount } from 'svelte'
  import domSelector from '@peter.naydenov/dom-selector'

  const dom = domSelector()

  onMount(() => {
    dom.define({ name: 'brand', selector: () => document.querySelector('.brand') })
  })

  function getBrand() {
    return dom.use('brand')
  }
</script>

<button on:click={getBrand}>Get brand</button>
```

For Svelte 5 with runes, the same pattern works — there's nothing
svelte-specific to wire up. The instance is just a regular variable
scoped to the component.

---

## Node / JSDOM (SSR or tests)

The library is pure DOM — it does not import `document` itself. Your
`selector` function does, so any environment that provides a DOM-like
`document` works. The simplest is to install `jsdom` and pin
`document` to it.

`package.json`:
```json
{
  "devDependencies": {
    "jsdom": "^30.0.0"
  }
}
```

Minimal setup (this is exactly the pattern `test/setup.js` uses):

```js
// dom-bootstrap.js
import { JSDOM } from 'jsdom'
import domSelector from '@peter.naydenov/dom-selector'

const html = '<!doctype html><html><body><div id="app"><a href="/">Home</a></div></body></html>'
const { window } = new JSDOM(html)
globalThis.document = window.document
globalThis.HTMLElement = window.HTMLElement
globalThis.NodeList = window.NodeList
globalThis.HTMLCollection = window.HTMLCollection

const dom = domSelector()
dom.define({ name: 'links', selector: () => document.querySelectorAll('a') })

export { dom }
```

```js
// app.js (uses the bootstrap)
import { dom } from './dom-bootstrap.js'
console.log(dom.run('links').length)   // -> 1
```

### Vitest / Playwright tests

`vitest` with `jsdom`:

```js
// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
})
```

Then in your spec:

```js
import { test, expect } from 'vitest'
import domSelector from '@peter.naydenov/dom-selector'

test('counts visible cards', () => {
  document.body.innerHTML = `
    <div class="card">A</div>
    <div class="card" hidden>B</div>
  `
  const dom = domSelector()
  dom.define({
    name: 'visible-cards',
    selector: () => document.querySelectorAll('.card'),
    where: ({ item }) => !item.hidden ? item : null,
  })
  expect(dom.run('visible-cards').length).toBe(1)
})
```

`playwright` doesn't need any extra setup — `page.evaluate(() => ...)`
runs in a real browser and has `document` natively. Pass the library
into the page via `addScriptTag` or import it in your test fixture.

### Server-side rendering (Next.js, Nuxt, SvelteKit, ...)

You can `run` selectors on the server, but only if you have a DOM
there. Two cases:

1. **You build the HTML with a server template, then parse it with
   JSDOM** to extract what you need. This is the only safe way to use
   `dom-selector` in SSR — you never query the live `document` on
   the server (there isn't one).
2. **You skip selectors on the server** and only call `run` / `use`
   after hydration. The composable / hook pattern above already
   handles this — `onMount` doesn't fire on the server, so
   `define` only happens client-side, and the cached reads are
   already there by the time a component needs them.

Don't try to call `run` during SSR unless you've explicitly set up a
JSDOM-backed `document`. The library will throw `document is not
defined` from inside your `selector`, not from inside the library.

---

## Things to watch in any framework

- **One instance per setup boundary.** Don't share a `dom` between
  unrelated features; cache invalidation gets confusing.
- **`define` after mount, not at module top-level.** SFC/HMR will
  re-run module code; you want `define` to fire after the component's
  DOM is in the document.
- **Cache invalidation is per-instance.** Re-`define`-ing a name
  wipes the cache for *that* instance only. If you have two
  composables that both `define` a selector named `'brand'`, they're
  independent.
- **`use` returns the cached array, not the live DOM.** If the DOM
  changed since `run` (a child was added, a class toggled), `use`
  won't see it. Call `run` again to re-read.
