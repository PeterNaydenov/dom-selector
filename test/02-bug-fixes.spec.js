import { test, expect } from 'vitest'
import DomSelector from '../src/main.js'

test.describe('DOM Selector - bug fix regression tests', () => {
  test('use() works after remember() without prior define()', () => {
    const dom = new DomSelector()
    const el = document.querySelector('#app')
    dom.remember('saved', el)
    const r = dom.use('saved')
    const result = { length: r.length, tag: r[0] ? r[0].tagName : null }
    expect(result).toEqual({ length: 1, tag: 'DIV' })
  })

  test('use() works after remember() with an array', () => {
    const dom = new DomSelector()
    const navItems = document.querySelectorAll('ul.nav li')
    dom.remember('nav-items', Array.from(navItems))
    const r = dom.use('nav-items')
    const result = { length: r.length, tags: r.map((el) => el.tagName) }
    expect(result.length).toBe(4)
    expect(result.tags).toEqual(['LI', 'LI', 'LI', 'LI'])
  })

  test('use() works after remember() with a NodeList', () => {
    const dom = new DomSelector()
    const listItems = document.querySelectorAll('ul.list li')
    dom.remember('list-items', listItems)
    const r = dom.use('list-items')
    const result = { length: r.length }
    expect(result.length).toBe(5)
  })

  test('use() after remember() with a NodeList returns a real Array', () => {
    const dom = new DomSelector()
    dom.remember('list-items-arr', document.querySelectorAll('ul.list li'))
    const r = dom.use('list-items-arr')
    const result = { isArray: Array.isArray(r), length: r.length }
    expect(result).toEqual({ isArray: true, length: 5 })
  })

  test('remember() wraps a single <select> element despite its own .length', () => {
    const dom = new DomSelector()
    const select = document.createElement('select')
    select.appendChild(document.createElement('option'))
    select.appendChild(document.createElement('option'))
    dom.remember('picker', select)
    const r = dom.use('picker')
    const result = { length: r.length, tag: r[0] ? r[0].tagName : null }
    expect(result).toEqual({ length: 1, tag: 'SELECT' })
  })

  test('remember() with an empty NodeList yields an empty array', () => {
    const dom = new DomSelector()
    dom.remember('nothing', document.querySelectorAll('.does-not-exist'))
    const r = dom.use('nothing')
    const result = { length: r.length, isArray: Array.isArray(r) }
    expect(result).toEqual({ length: 0, isArray: true })
  })

  test('run() can register a selector inline and run it (object form)', () => {
    const dom = new DomSelector()
    const r = dom.run({
      name: 'inline-lis',
      selector: () => document.querySelectorAll('li')
    })
    const result = { length: r.length }
    expect(result.length).toBe(9)
  })

  test('run() inline form respects where filter', () => {
    const dom = new DomSelector()
    const r = dom.run({
      name: 'inline-nav-lis',
      selector: () => document.querySelectorAll('li'),
      where: ({ item }) => item.closest('ul.nav') ? item : null
    })
    const result = { length: r.length }
    expect(result.length).toBe(4)
  })

  test('use() with unknown name returns []', () => {
    const dom = new DomSelector()
    const r = dom.use('does-not-exist')
    const result = { length: r.length, isArray: Array.isArray(r) }
    expect(result).toEqual({ length: 0, isArray: true })
  })

  test('define() without where returns the selector result', () => {
    const dom = new DomSelector()
    dom.define({
      name: 'all-spans',
      selector: () => document.querySelectorAll('span')
    })
    const r = dom.run('all-spans')
    const result = { length: r.length }
    expect(result.length).toBe(4)
  })

  test('define() returns false on null / undefined / non-object', () => {
    const dom = new DomSelector()
    const result = {
      undef: dom.define(undefined),
      nul: dom.define(null),
      num: dom.define(42),
      str: dom.define('not-an-object')
    }
    expect(result).toEqual({ undef: false, nul: false, num: false, str: false })
  })

  test('define() returns false on missing or invalid fields', () => {
    const dom = new DomSelector()
    const result = {
      noName: dom.define({ selector: () => 1 }),
      noSelector: dom.define({ name: 'x' }),
      stringSel: dom.define({ name: 'x', selector: 'not-a-fn' }),
      objectSel: dom.define({ name: 'x', selector: {} })
    }
    expect(result).toEqual({ noName: false, noSelector: false, stringSel: false, objectSel: false })
  })

  test('run() with bad input returns [] instead of throwing', () => {
    const dom = new DomSelector()
    const result = {
      noArgs: dom.run(),
      withNull: dom.run(null),
      withNum: dom.run(42),
      withStr: dom.run('not-registered')
    }
    expect(result).toEqual({ noArgs: [], withNull: [], withNum: [], withStr: [] })
  })

  test('run() with invalid selection object returns []', () => {
    const dom = new DomSelector()
    const result = {
      empty: dom.run({}),
      noName: dom.run({ selector: () => 1 }),
      noSelector: dom.run({ name: 'x' })
    }
    expect(result).toEqual({ empty: [], noName: [], noSelector: [] })
  })

  test('up() on a detached element does not throw', () => {
    const dom = new DomSelector()
    const detached = document.createElement('div')
    dom.define({
      name: 'detached',
      selector: () => detached,
      direction: 'up'
    })
    let result
    try {
      const r = dom.run('detached')
      result = { ok: true, length: r.length, isSelf: r[0] === detached }
    } catch (e) {
      result = { ok: false, error: String(e) }
    }
    expect(result.ok).toBe(true)
    expect(result.length).toBe(1)
    expect(result.isSelf).toBe(true)
  })

  test('up() on a detached element reached via down() does not throw', () => {
    const dom = new DomSelector()
    const detached = document.createElement('span')
    dom.define({
      name: 'find-detached',
      selector: () => document.querySelector('#app'),
      direction: 'down',
      where: ({ item, up }) => {
        if (item !== detached) return null
        for (const _ of up(item)) {}
        return item
      }
    })
    let result
    try {
      const app = document.querySelector('#app')
      app.appendChild(detached)
      const r = dom.run('find-detached')
      app.removeChild(detached)
      result = { ok: true, length: r.length, found: r[0] === detached }
    } catch (e) {
      result = { ok: false, error: String(e) }
    }
    expect(result.ok).toBe(true)
    expect(result.length).toBe(1)
    expect(result.found).toBe(true)
  })

  test('re-define invalidates the cached result', () => {
    const dom = new DomSelector()
    dom.define({ name: 'x', selector: () => [1, 2, 3] })
    dom.run('x')
    dom.define({ name: 'x', selector: () => [4, 5, 6] })
    const result = {
      useImmediately: dom.use('x'),
      runNew: dom.run('x'),
      useAfterRun: dom.use('x')
    }
    expect(result.useImmediately).toEqual([])
    expect(result.runNew).toEqual([4, 5, 6])
    expect(result.useAfterRun).toEqual([4, 5, 6])
  })

  test('a throwing selector propagates the error', () => {
    const dom = new DomSelector()
    dom.define({
      name: 'broken',
      selector: () => { throw new Error('boom from selector') }
    })
    let result
    try {
      dom.run('broken')
      result = { threw: false }
    } catch (e) {
      result = { threw: true, message: e.message }
    }
    expect(result.threw).toBe(true)
    expect(result.message).toBe('boom from selector')
  })
})
