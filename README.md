<img src="dom-selector.png" width="100%" alt="Notice" align="center" />


# DOM Selector ( @peter.naydenov/dom-selector )

![version](https://img.shields.io/github/package-json/v/peterNaydenov/dom-selector)
![GitHub License](https://img.shields.io/github/license/peterNaydenov/dom-selector)
![GitHub issues](https://img.shields.io/github/issues-raw/peterNaydenov/dom-selector)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40peter.naydenov%2Fdom-selector)



## Description
Keep all DOM selections and DOM references organized in a single space. Avoid long and difficult-to-read select operations in your code by using simple and meaningful names instead.

Framework agnostic. No dependencies.



## Why DOM Selector?
DOM Selector is for **vanilla-JS apps that talk to the DOM a lot** — single-page apps, widget libraries, interactive sites without a heavy framework layer.

- **One place for every selector.** Stop repeating `document.querySelector('.user-card .title')` in five files. Register it once, call it by name.
- **Cached, named results.** `run('foo')` executes; `use('foo')` returns the last result without re-querying the DOM.
- **Tree walking built in.** `direction: 'up'` and `direction: 'down'` walk to `<body>` and back without you writing a recursion.
- **Filter, stop, transform.** The `where` callback can filter, the `END` symbol can stop early, the `final` hook can reshape the array.
- **Tiny.** ~1.5 KB minified. Zero runtime dependencies. Works in the browser and Node (via JSDOM).

If you're using React/Vue/Svelte, their refs and component scope already do this job. If you're writing vanilla JS and the same selector appears in more than one place, this is for you.



## Installation
```
npm install @peter.naydenov/dom-selector
```

```js
import domSelector from '@peter.naydenov/dom-selector';
// or
// const domSelector = require('@peter.naydenov/dom-selector');

const dom = domSelector();   // Each call returns a fresh, isolated instance
```



## Quick start
Five lines. Define a selector, run it, iterate the result.
```js
import domSelector from '@peter.naydenov/dom-selector';
const dom = domSelector();

dom.define ({
      name     : 'links'
    , selector : () => document.querySelectorAll ( 'a' )
});

for ( const a of dom.run ( 'links' )) {
      console.log ( a.href );
}
```
Result is always an array. That's the whole shape — the rest of the API is "what to do between `selector` and the array you get back".



## The six things you can do
Read this section in order. Each method adds one capability on top of the previous one.

### 1. `define` + `run` — the basics
`define` registers a selector by name. `run` executes it and returns an array.
```js
dom.define ({
      name     : 'titles'
    , selector : () => document.querySelectorAll ( 'h2' )
});

dom.run ( 'titles' );   // -> [ <h2>, <h2>, ... ]
```
`run` is also a no-op safety net: a name that wasn't `define`-d returns `[]` instead of throwing.



### 2. `where` — filter the result
`where` is a callback called once per candidate. Return the item to keep it, `null` to skip, an array to add several, or the `END` symbol to stop the scan.
```js
dom.define ({
      name     : 'visible-cards'
    , selector : () => document.querySelectorAll ( '.card' )
    , where    : ({ item }) => item.offsetParent !== null ? item : null
});
dom.run ( 'visible-cards' );
```
The callback receives a context object:
| key      | meaning                                            |
| -------- | -------------------------------------------------- |
| `item`   | current element                                    |
| `i`      | its index in the source list                       |
| `length` | how many items the result already holds            |
| `END`    | a `Symbol` — return it from `where` to stop early  |
| `up`     | function — returns ancestors up to `<body>`        |
| `down`   | function — returns descendants                     |

`END` and `up`/`down` are what make `where` more than a filter. With `down(item)` you can test an element's subtree inside `where`:
```js
dom.define ({
      name     : 'cards-with-badge'
    , selector : () => document.querySelectorAll ( '.card' )
    , where    : ({ item, down }) => {
            for ( const child of down ( item )) {
                  if ( child.classList && child.classList.contains ( 'badge' ))   return item;
              }
            return null;
        }
});
dom.run ( 'cards-with-badge' );
```
`up(item)` does the same in the opposite direction — handy when you want to know "is this `<a>` inside a `<nav>`?" without writing your own parent walk.



### 3. `direction` — walk the DOM tree
If `selector` returns a *single* element, `direction` tells DOM Selector to expand it into a list before `where` runs.
```js
dom.define ({
      name      : 'nav-links'
    , selector  : () => document.getElementById ( 'nav' )      // single element
    , direction : 'down'                                        // expand descendants
    , where     : ({ item }) => item.tagName === 'A' ? item : null
});
dom.run ( 'nav-links' );   // -> [ <a>, <a>, <a>, ... ]
```
Values: `'none'` (default — don't expand), `'up'` (ancestors to `<body>`), `'down'` (all descendants). Ignored if `selector` already returns a list.



### 4. `final` — reshape the result
`final` runs once on the final array. Use it to project, sort, count, or return a totally different value.
```js
dom.define ({
      name     : 'link-count'
    , selector : () => document.querySelectorAll ( 'a' )
    , final    : ( result ) => result.length                  // return a number, not an array
});
dom.run ( 'link-count' );   // -> 42
```
`final` is also called by `use` (see next) — so the same projection applies whether you re-run or read the cache.



### 5. `use` — read the last result (no re-query)
`run` executes the selector, caches the result, then runs `final`. `use` returns the *cached* result and runs `final` on it again. It's the cheap path: zero DOM work, just transformation.
```js
dom.run ( 'link-count' );   // executes, caches, runs final
dom.use ( 'link-count' );   // skips the selector, re-runs final
// -> 42  in both cases
```
`use` is also how `remember`ed references are read back (next section). Any extra arguments you pass to `use` are forwarded to `final` — handy when the projection depends on a runtime flag:
```js
dom.define ({
      name     : 'links'
    , selector : () => document.querySelectorAll ( 'a' )
    , final    : ( result, onlyExternal ) => onlyExternal
        ? result.filter ( a => a.host !== location.host )
        : result
});
dom.run   ( 'links' );
dom.use   ( 'links', true );   // external-only list, no re-query
```



### 6. `remember` — cache a reference directly
Sometimes the element is already in your hand — a modal that's mounted on demand, a button that was just created. Register it under a name and `use` it later without re-querying.
```js
const okButton = document.querySelector ( '#ok' );
dom.remember ( 'ok', okButton );

dom.use ( 'ok' ).forEach ( btn => btn.addEventListener ( 'click', onConfirm ));
```
Accepts a single element, a `NodeList`, an `HTMLCollection`, or an array. The value is normalized to an array internally so `use` always returns an array.



## A real-world example
A small product page that registers selectors per concern. Notice each module owns its own selectors; nothing is global, nothing leaks.
```js
import domSelector from '@peter.naydenov/dom-selector';
const dom = domSelector();


// --- Header module: a brand and a cart button that always exist ---
function setupHeader () {
      dom.define ({
              name     : 'brand'
            , selector : () => document.querySelector ( '.brand' )
      });
      dom.remember ( 'cart-btn', document.querySelector ( '.cart-btn' ));
}


// --- Product list: scan the list once, filter visible items ---
function setupProducts () {
      dom.define ({
              name      : 'products'
            , selector  : () => document.querySelector ( '#products' )   // single node
            , direction : 'down'                                          // walk descendants
            , where     : ({ item }) => item.classList.contains ( 'product' ) && item.offsetParent
                                                ? item
                                                : null
            , final     : ( result ) => result.length                     // project to a count
      });
}


// --- Modal: a node that doesn't exist yet, but is cached for later use ---
let modalNode = null;
function showModal ( html ) {
      modalNode = document.createElement ( 'div' );
      modalNode.className = 'modal';
      modalNode.innerHTML = html;
      document.body.appendChild ( modalNode );

      dom.remember ( 'modal', modalNode );        // hand the node straight to dom-selector
      dom.use      ( 'modal' ).forEach ( m => m.classList.add ( 'open' ));
}

function hideModal () {
      dom.use ( 'modal' ).forEach ( m => m.remove ());
      modalNode = null;
}


// --- Wire it up ---
setupHeader ();
setupProducts ();
showModal ( '<p>Welcome!</p>' );

console.log ( dom.run  ( 'products' ));   // -> 7        (count of visible products)
console.log ( dom.use  ( 'brand'     ));   // -> [ <a.brand> ]
dom.use ( 'cart-btn' ).forEach ( b => b.classList.add ( 'ready' ));
```
Three modules, three concerns, one shared `dom`. Each call to `run` or `use` is short, named, and self-documenting.



## API reference
### Selection properties
| key         | required | type                                       | default       |
| ----------- | -------- | ------------------------------------------ | ------------- |
| `name`      | yes      | `string`                                   | —             |
| `selector`  | yes      | `( ...args ) => Element \| NodeList \| Array` | —          |
| `where`     | no       | `({item,i,END,length,up,down}, ...args) => Element \| null \| END \| Element[]` | `item => item` |
| `direction` | no       | `'none' \| 'up' \| 'down'`                 | `'none'`      |
| `final`     | no       | `( result, ...args ) => any`               | `result => result` |

### Methods
| method                                  | returns                              |
| --------------------------------------- | ------------------------------------ |
| `define ( selection )`                  | `boolean` (false if `name`/`selector` missing) |
| `run ( name \| selection, ...args )`    | result of `final` (or the array if no `final`) |
| `use ( name, ...args )`                 | result of `final` on the cached array (or `[]` if `name` was never `run`/`remember`ed) |
| `remember ( name, element \| list )`    | `void`                               |

`run` accepts either a string name (look up an existing `define`-d selector) or a selection object (register it inline and run it once).



## Tips & gotchas
- **Re-defining a selector overwrites silently.** Calling `define({ name: 'foo', ... })` twice replaces the first definition. If you want versioning, namespace the names yourself.
- **`run` and `use` never throw on a missing name.** Both return `[]`, which is the same shape as a successful empty result. Check `length` if you need to distinguish "nothing matched" from "you forgot to `define` it".
- **`where` and `final` are not async.** Keep them synchronous. If you need to wait on something, do the await outside, then `remember` the result.
- **`use` forwards extra args to `final`, not to `selector`.** If you need to pass runtime data to the `where` callback instead, use `run` and design `where` to read what you pass.
- **The `END` symbol comes from the context.** Each `run` creates a fresh `Symbol` and hands it to your `where` callback as `END`. Return *that* value (not your own `Symbol()` — every `Symbol` is unique, so a homemade one won't match and the scan won't stop):
    ```js
    where: ({ item, END }) => {
        if ( item.tagName === 'FOO' )   return END;   // stop here
        return item;                                   // otherwise keep
    }
    ```
    `END` is also a valid value to return from `use`'s chain because `use` calls `final` on the cached result — but the symbol itself never escapes the call boundary.



## AI tooling 

The skill is useful inside this very repo as a contributor reference. The procedure tells the model to cross-check the installed `types/main.d.ts` rather than this repo's test files, so the same skill works for both library users and library authors without modification.

```
.agents/skills/dom-selector
```




## Links
- [History of changes](https://github.com/PeterNaydenov/dom-selector/blob/main/Changelog.md)
- [Migration guide](https://github.com/PeterNaydenov/dom-selector/blob/main/Migration.guide.md)



## Credits
'@peter.naydenov/dom-selector' was created and supported by Peter Naydenov.



## License
'@peter.naydenov/dom-selector' is released under the [MIT License](http://opensource.org/licenses/MIT).
