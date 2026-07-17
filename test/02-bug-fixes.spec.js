import { test, expect } from '@playwright/test'

test.describe('DOM Selector - bug fix regression tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html')
    await page.waitForLoadState('domcontentloaded')
  })

  // Regression for: use() crashed with TypeError when called for a name that
  // was only stored via remember() (no matching selector in the store).
  // Fix: use() now falls back to identity when no selector record is found.
  test('use() works after remember() without prior define()', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      const el = document.querySelector('#app')
      dom.remember('saved', el)
      const r = dom.use('saved')
      return { length: r.length, tag: r[0] ? r[0].tagName : null }
    })
    expect(result).toEqual({ length: 1, tag: 'DIV' })
  })

  // Same bug, but with a list-like value passed to remember().
  test('use() works after remember() with an array', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      const navItems = document.querySelectorAll('ul.nav li')
      dom.remember('nav-items', Array.from(navItems))
      const r = dom.use('nav-items')
      return { length: r.length, tags: r.map((el) => el.tagName) }
    })
    expect(result.length).toBe(4)
    expect(result.tags).toEqual(['LI', 'LI', 'LI', 'LI'])
  })

  // Same bug, but with a NodeList (which is list-like and has .length).
  test('use() works after remember() with a NodeList', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      const listItems = document.querySelectorAll('ul.list li')
      dom.remember('list-items', listItems)
      const r = dom.use('list-items')
      return { length: r.length }
    })
    expect(result.length).toBe(5)
  })

  // remember() must normalize to a real Array, not store list-likes as-is.
  test('use() after remember() with a NodeList returns a real Array', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.remember('list-items-arr', document.querySelectorAll('ul.list li'))
      const r = dom.use('list-items-arr')
      return { isArray: Array.isArray(r), length: r.length }
    })
    expect(result).toEqual({ isArray: true, length: 5 })
  })

  // <form> and <select> elements carry a numeric `.length` of their own
  // (number of controls/options), so a bare `.length` check mistakes a
  // single element for a list. remember() must still wrap it in an array.
  test('remember() wraps a single <select> element despite its own .length', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      const select = document.createElement('select')
      select.appendChild(document.createElement('option'))
      select.appendChild(document.createElement('option'))
      dom.remember('picker', select)
      const r = dom.use('picker')
      return { length: r.length, tag: r[0] ? r[0].tagName : null }
    })
    expect(result).toEqual({ length: 1, tag: 'SELECT' })
  })

  // An empty NodeList has `.length === 0` (falsy) and used to get
  // double-wrapped as [NodeList(0)]. It must come back as [].
  test('remember() with an empty NodeList yields an empty array', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.remember('nothing', document.querySelectorAll('.does-not-exist'))
      const r = dom.use('nothing')
      return { length: r.length, isArray: Array.isArray(r) }
    })
    expect(result).toEqual({ length: 0, isArray: true })
  })

  // Regression for: run(selectionObject) silently returned [] because
  // `define` stored the selection under selection.name but `run` then
  // tried to look it up using the whole object as the key.
  // Fix: run() now re-assigns `name` to `name.name` after the inline define.
  test('run() can register a selector inline and run it (object form)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      const r = dom.run({
        name: 'inline-lis',
        selector: () => document.querySelectorAll('li')
      })
      return { length: r.length }
    })
    // 5 from .list + 4 from .nav
    expect(result.length).toBe(9)
  })

  // The inline form should also respect a `where` filter.
  test('run() inline form respects where filter', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      const r = dom.run({
        name: 'inline-nav-lis',
        selector: () => document.querySelectorAll('li'),
        where: ({ item }) => item.closest('ul.nav') ? item : null
      })
      return { length: r.length }
    })
    expect(result.length).toBe(4)
  })

  // Sanity check: a missing name still returns an empty array (not a crash).
  test('use() with unknown name returns []', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      const r = dom.use('does-not-exist')
      return { length: r.length, isArray: Array.isArray(r) }
    })
    expect(result).toEqual({ length: 0, isArray: true })
  })

  // Sanity check: define() with no `where` still returns the elements
  // (covered by the original tests, but re-asserted here to lock in the
  // removal of the dead `result == source` comparison branch).
  test('define() without where returns the selector result', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({
        name: 'all-spans',
        selector: () => document.querySelectorAll('span')
      })
      const r = dom.run('all-spans')
      return { length: r.length }
    })
    // 4 spans in the test fixture (sit, possimus, third, about)
    expect(result.length).toBe(4)
  })

  // -------------------------------------------------------------------------
  // Bad-input edge cases (define / run with null, undefined, missing fields).
  // -------------------------------------------------------------------------

  // Regression: define() used to throw on null / undefined input because
  // it tried to destructure the argument without a guard. Now it returns
  // false like the other "bad input" paths.
  test('define() returns false on null / undefined / non-object', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      return {
        undef:   dom.define(undefined),
        nul:     dom.define(null),
        num:     dom.define(42),
        str:     dom.define('not-an-object')
      }
    })
    expect(result).toEqual({ undef: false, nul: false, num: false, str: false })
  })

  // Regression: define() returns false when required fields are missing
  // or selector isn't a function. Locks in the documented return value.
  test('define() returns false on missing or invalid fields', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      return {
        noName:      dom.define({ selector: () => 1 }),
        noSelector:  dom.define({ name: 'x' }),
        stringSel:   dom.define({ name: 'x', selector: 'not-a-fn' }),
        objectSel:   dom.define({ name: 'x', selector: { } })
      }
    })
    expect(result).toEqual({ noName: false, noSelector: false, stringSel: false, objectSel: false })
  })

  // Regression: run() with no args / null / non-string non-object used to
  // crash inside the inline-define path. Now it returns [] like a missing
  // name would.
  test('run() with bad input returns [] instead of throwing', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      return {
        noArgs:  dom.run(),
        withNull: dom.run(null),
        withNum:  dom.run(42),
        withStr:  dom.run('not-registered')
      }
    })
    expect(result).toEqual({ noArgs: [], withNull: [], withNum: [], withStr: [] })
  })

  // run() with a missing or invalid selection object must also return [].
  test('run() with invalid selection object returns []', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      return {
        empty: dom.run({}),
        noName: dom.run({ selector: () => 1 }),
        noSelector: dom.run({ name: 'x' })
      }
    })
    expect(result).toEqual({ empty: [], noName: [], noSelector: [] })
  })

  // -------------------------------------------------------------------------
  // up() on a detached element.
  // -------------------------------------------------------------------------

  // Regression: up() used to crash with `TypeError: Cannot read properties
  // of null (reading 'tagName')` when the starting element had no parent
  // (i.e. a detached node). Now it returns the element itself and stops.
  test('up() on a detached element does not throw', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      const detached = document.createElement('div')   // never appended
      dom.define({
        name: 'detached',
        selector: () => detached,
        direction: 'up'
      })
      try {
        const r = dom.run('detached')
        return { ok: true, length: r.length, isSelf: r[0] === detached }
      } catch (e) {
        return { ok: false, error: String(e) }
      }
    })
    expect(result.ok).toBe(true)
    expect(result.length).toBe(1)
    expect(result.isSelf).toBe(true)
  })

  // Same edge case but `up` is called *inside* a `where` filter — the
  // iterable must also tolerate a starting element with no parent.
  test('up() on a detached element reached via down() does not throw', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      const detached = document.createElement('span')   // never appended
      dom.define({
        name: 'find-detached',
        selector: () => document.querySelector('#app'),
        direction: 'down',
        where: ({ item, up }) => {
          if (item !== detached) return null
          // Force `up` to evaluate on a node with no parent. Before the
          // fix this would throw `Cannot read properties of null
          // (reading 'tagName')` from inside the up() generator.
          for (const _ of up(item)) { /* noop */ }
          return item
        }
      })
      try {
        // Inject the detached element into the live tree for this test
        // so the down() scan actually visits it.
        const app = document.querySelector('#app')
        app.appendChild(detached)
        const r = dom.run('find-detached')
        app.removeChild(detached)
        return { ok: true, length: r.length, found: r[0] === detached }
      } catch (e) {
        return { ok: false, error: String(e) }
      }
    })
    expect(result.ok).toBe(true)
    expect(result.length).toBe(1)
    expect(result.found).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Re-define must invalidate the cached result.
  // -------------------------------------------------------------------------

  // Regression: re-define used to leave the previous run's result in the
  // cache, so `use(name)` returned the stale array. Now define() deletes
  // the cache entry; the next run() re-populates it with the new selector.
  test('re-define invalidates the cached result', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({ name: 'x', selector: () => [1, 2, 3] })
      dom.run('x')                                            // caches [1, 2, 3]
      dom.define({ name: 'x', selector: () => [4, 5, 6] })     // overwrites + invalidates
      return {
        useImmediately: dom.use('x'),   // cache empty -> []
        runNew:         dom.run('x'),   // re-runs, caches, returns [4, 5, 6]
        useAfterRun:    dom.use('x')    // now reads the fresh cache
      }
    })
    expect(result.useImmediately).toEqual([])
    expect(result.runNew).toEqual([4, 5, 6])
    expect(result.useAfterRun).toEqual([4, 5, 6])
  })

  // -------------------------------------------------------------------------
  // Selector that throws — the error should propagate, not be swallowed.
  // -------------------------------------------------------------------------

  // A selector throwing inside run() is propagated to the caller. This
  // pins down the behaviour so a future change can't silently swallow
  // selector errors.
  test('a throwing selector propagates the error', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({
        name: 'broken',
        selector: () => { throw new Error('boom from selector') }
      })
      try {
        dom.run('broken')
        return { threw: false }
      } catch (e) {
        return { threw: true, message: e.message }
      }
    })
    expect(result.threw).toBe(true)
    expect(result.message).toBe('boom from selector')
  })
})
