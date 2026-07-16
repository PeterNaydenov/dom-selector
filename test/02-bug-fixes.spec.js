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
})
