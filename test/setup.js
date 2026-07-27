import { beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'

const fixture = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
const appMarkup = new JSDOM(fixture).window.document.querySelector('#app').outerHTML

beforeEach(() => {
  document.body.innerHTML = appMarkup
})
