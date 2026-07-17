import { test, expect } from '@playwright/test'

test.describe('DOM Selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)
  })

  test('Define simpliest selector', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({
        name: 'ul',
        selector: (el) => el.getElementsByTagName('ul')
      })
      return dom.run('ul', document.querySelector('#app')).length
    })
    expect(result).toBe(2)
  })

  test('Scan deep', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({
        name: 'component',
        selector: (el) => el,
        direction: 'down'
      })
      return dom.run('component', document.querySelector('#app')).length
    })
    expect(result).toBe(31)
  })

  test('Scan deep and filter', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({
        name: 'component',
        selector: (el) => el,
        direction: 'down',
        where: ({ item }) => item.tagName === 'SPAN' ? true : false
      })
      return dom.run('component', document.querySelector('#app')).length
    })
    expect(result).toBe(4)
  })

  test('Stop the deep scan', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      // END is provided per-call by `_select` via the where context.
      // Returning a self-made Symbol would not match and the scan would
      // never stop — see the "Tips & gotchas" section in README.md.
      dom.define({
        name: 'component',
        selector: (el) => el,
        direction: 'down',
        where: ({ item, length, END }) => {
          if (item.tagName !== 'SPAN') return null
          return length < 2 ? item : END
        }
      })
      return dom.run('component', document.querySelector('#app')).length
    })
    // Without END the scan would collect all 4 spans. With END, we stop
    // after the 2nd span, so the result holds exactly 2 elements.
    expect(result).toBe(2)
  })

  test('Stop the deep scan2', async ({ page }) => {
    const result = await page.evaluate(() => {
      const app = document.querySelector('#app')
      const dom = window.DomSelector()
      dom.define({
        name: 'component',
        selector: () => app,                 // capture the root via closure
        direction: 'down',
        where: ({ item, END }, counter) => {
          // `counter` is now correctly bound to the second positional arg
          // of where, which is the first extra arg passed to `run` below.
          if (counter.value >= 2) return END
          if (item.tagName !== 'SPAN') return null
          counter.value++
          return item
        }
      })
      return dom.run('component', { value: 0 }).length
    })
    // Counter stops the scan at 2 spans. With a non-matching END the scan
    // would walk all 31 descendants and the assertion below would fail.
    expect(result).toBe(2)
  })

  test('Back scan to the body', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({
        name: 'component',
        selector: (el) => el,
        direction: 'up'
      })
      return dom.run('component', document.querySelector('ul')).length
    })
    expect(result).toBeGreaterThan(0)
  })

  test('Selector index', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      const tagCounter = new Set()
      dom.define({
        name: 'list',
        selector: (el) => el,
        direction: 'down',
        where: ({ item, i, END }) => {
          tagCounter.add(i)
          return i < 9 ? item : END
        }
      })
      dom.run('list', document.querySelector('#app'))
      // With END working, the scan stops as soon as the where returns END
      // (at i === 9). tagCounter should hold exactly { 0..9 } = 10 entries.
      // With the old homemade-Symbol bug, the scan would walk all 31
      // descendants and tagCounter.size would be 31.
      return {
        size: tagCounter.size,
        hasZero: tagCounter.has(0),
        hasNine: tagCounter.has(9),
        hasTen: tagCounter.has(10)
      }
    })
    expect(result).toEqual({ size: 10, hasZero: true, hasNine: true, hasTen: false })
  })

  test('Find span elements inside a list', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({
        name: 'ul-span',
        selector: (el) => el.querySelectorAll('span'),
        where: ({ item, up }) => {
          for (let parent of up(item)) {
            if (parent && parent.tagName === 'LI') return item
          }
          return null
        }
      })
      return dom.run('ul-span', document.querySelector('#app')).length
    })
    expect(result).toBe(2)
  })

  test('Find only li that have span', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({
        name: 'li-span',
        selector: (el) => el.querySelectorAll('li'),
        where: ({ item, down }) => {
          for (let child of down(item)) {
            if (child && child.tagName === 'SPAN') return item
          }
          return null
        }
      })
      return dom.run('li-span', document.querySelector('#app')).length
    })
    expect(result).toBe(2)
  })

  test('Arguments for method Run', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({
        name: 'li-span',
        selector: (root, tag) => root.querySelectorAll(tag)
      })
      return dom.run('li-span', document.querySelector('#app'), 'li').length
    })
    expect(result).toBe(9)
  })

  test('Parameterized selector with filter', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({
        name: 'li-span',
        selector: (root, target) => document.querySelectorAll(target),
        where: ({ item, down }) => {
          for (let child of down(item)) {
            if (child && child.tagName === 'SPAN') return [child.parentElement]
          }
          return null
        }
      })
      return dom.run('li-span', document.querySelector('#app'), '.nav').length
    })
    expect(result).toBe(1)
  })

  test('Selector.final', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({
        name: 'li-span',
        selector: (root, selector) => root.querySelectorAll(selector),
        final: (result) => result.length
      })
      return dom.run('li-span', document.querySelector('#app'), 'li')
    })
    expect(result).toBe(9)
  })

  test('Dom.use & selector.final', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      dom.define({
        name: 'li-span',
        selector: (root, selector) => root.querySelectorAll(selector),
        final: (result) => result.length
      })
      dom.run('li-span', document.querySelector('#app'), 'li')
      return dom.use('li-span')
    })
    expect(result).toBe(9)
  })
})