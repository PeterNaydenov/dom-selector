import { test, expect } from 'vitest'
import DomSelector from '../src/main.js'

test.describe('DOM Selector', () => {
  test('Define simpliest selector', () => {
    const dom = new DomSelector()
    dom.define({
      name: 'ul',
      selector: (el) => el.getElementsByTagName('ul')
    })
    const result = dom.run('ul', document.querySelector('#app')).length
    expect(result).toBe(2)
  })

  test('Scan deep', () => {
    const dom = new DomSelector()
    dom.define({
      name: 'component',
      selector: (el) => el,
      direction: 'down'
    })
    const result = dom.run('component', document.querySelector('#app')).length
    expect(result).toBe(31)
  })

  test('Scan deep and filter', () => {
    const dom = new DomSelector()
    dom.define({
      name: 'component',
      selector: (el) => el,
      direction: 'down',
      where: ({ item }) => item.tagName === 'SPAN' ? true : false
    })
    const result = dom.run('component', document.querySelector('#app')).length
    expect(result).toBe(4)
  })

  test('Stop the deep scan', () => {
    const dom = new DomSelector()
    dom.define({
      name: 'component',
      selector: (el) => el,
      direction: 'down',
      where: ({ item, length, END }) => {
        if (item.tagName !== 'SPAN') return null
        return length < 2 ? item : END
      }
    })
    const result = dom.run('component', document.querySelector('#app')).length
    expect(result).toBe(2)
  })

  test('Stop the deep scan2', () => {
    const app = document.querySelector('#app')
    const dom = new DomSelector()
    dom.define({
      name: 'component',
      selector: () => app,
      direction: 'down',
      where: ({ item, END }, counter) => {
        if (counter.value >= 2) return END
        if (item.tagName !== 'SPAN') return null
        counter.value++
        return item
      }
    })
    const result = dom.run('component', { value: 0 }).length
    expect(result).toBe(2)
  })

  test('Back scan to the body', () => {
    const dom = new DomSelector()
    dom.define({
      name: 'component',
      selector: (el) => el,
      direction: 'up'
    })
    const result = dom.run('component', document.querySelector('ul')).length
    expect(result).toBeGreaterThan(0)
  })

  test('Selector index', () => {
    const dom = new DomSelector()
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
    const result = {
      size: tagCounter.size,
      hasZero: tagCounter.has(0),
      hasNine: tagCounter.has(9),
      hasTen: tagCounter.has(10)
    }
    expect(result).toEqual({ size: 10, hasZero: true, hasNine: true, hasTen: false })
  })

  test('Find span elements inside a list', () => {
    const dom = new DomSelector()
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
    const result = dom.run('ul-span', document.querySelector('#app')).length
    expect(result).toBe(2)
  })

  test('Find only li that have span', () => {
    const dom = new DomSelector()
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
    const result = dom.run('li-span', document.querySelector('#app')).length
    expect(result).toBe(2)
  })

  test('Arguments for method Run', () => {
    const dom = new DomSelector()
    dom.define({
      name: 'li-span',
      selector: (root, tag) => root.querySelectorAll(tag)
    })
    const result = dom.run('li-span', document.querySelector('#app'), 'li').length
    expect(result).toBe(9)
  })

  test('Parameterized selector with filter', () => {
    const dom = new DomSelector()
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
    const result = dom.run('li-span', document.querySelector('#app'), '.nav').length
    expect(result).toBe(1)
  })

  test('Selector.final', () => {
    const dom = new DomSelector()
    dom.define({
      name: 'li-span',
      selector: (root, selector) => root.querySelectorAll(selector),
      final: (result) => result.length
    })
    const result = dom.run('li-span', document.querySelector('#app'), 'li')
    expect(result).toBe(9)
  })

  test('Dom.use & selector.final', () => {
    const dom = new DomSelector()
    dom.define({
      name: 'li-span',
      selector: (root, selector) => root.querySelectorAll(selector),
      final: (result) => result.length
    })
    dom.run('li-span', document.querySelector('#app'), 'li')
    const result = dom.use('li-span')
    expect(result).toBe(9)
  })
})
