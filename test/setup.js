import { JSDOM } from 'jsdom'

const dom = new JSDOM()
globalThis.Node = dom.window.Node
globalThis.NodeList = dom.window.NodeList
globalThis.Element = dom.window.Element
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.Document = dom.window.Document
globalThis.HTMLCollection = dom.window.HTMLCollection
globalThis.NamedNodeMap = dom.window.NamedNodeMap