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
      const END = Symbol('end___')
      dom.define({
        name: 'component',
        selector: (el) => el,
        direction: 'down',
        where: ({ item, length }) => {
          if (item.tagName !== 'SPAN') return null
          return length < 2 ? item : END
        }
      })
      return dom.run('component', document.querySelector('#app')).length
    })
    expect(result).toBeGreaterThan(0)
  })

  test('Stop the deep scan2', async ({ page }) => {
    const result = await page.evaluate(() => {
      const dom = window.DomSelector()
      const END = Symbol('end___')
      dom.define({
        name: 'component',
        selector: (el) => el,
        direction: 'down',
        where: ({ item }, counter) => {
          if (counter.value >= 2) return END
          if (item.tagName !== 'SPAN') return null
          counter.value++
          return item
        }
      })
      return dom.run('component', document.querySelector('#app'), { value: 0 }).length
    })
    expect(result).toBeGreaterThan(0)
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
      const END = Symbol('end___')
      const tagCounter = new Set()
      dom.define({
        name: 'list',
        selector: (el) => el,
        direction: 'down',
        where: ({ item, i }) => {
          tagCounter.add(i)
          return i < 9 ? item : END
        }
      })
      dom.run('list', document.querySelector('#app'))
      return tagCounter.size > 0 && tagCounter.has(0) && tagCounter.has(9)
    })
    expect(result).toBe(true)
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