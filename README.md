# DOM Selector ( @peter.naydenov/dom-selector )

![version](https://img.shields.io/github/package-json/v/peterNaydenov/dom-selector)
![GitHub License](https://img.shields.io/github/license/peterNaydenov/dom-selector)
![GitHub issues](https://img.shields.io/github/issues-raw/peterNaydenov/dom-selector)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40peter.naydenov%2Fdom-selector)



## Description
Keep all DOM selections and DOM references organized in a single space. Avoid long and difficult-to-read select operations in your code by using simple and meaningful names instead.

Framework agnostic. No dependencies.



## Methods
`DOM Selector` provides only 4 methods:
```js
  define    : 'Define a new selection'
, remember : 'Store a DOM reference directly as a last result without creating a selection.'
, run      : 'Run a selection'
, use      : 'Use the last result of the selection or remembered DOM reference'
```

## Installation
```
npm install @peter.naydenov/dom-selector
```

From the project:
```js
import domSelector from '@peter.naydenov/dom-selector';

const dom = domSelector();
// Ready to use
```

## How to use it

```js
import domSelector from '@peter.naydenov/dom-selector';
const dom = domSelector();

// Define a selection
dom.define ({
      name: 'li'
    , selector: () => document.querySelector('li')  
})

// Run a selection
const navItems = dom.run ('li');

// use the last result of the selection. Do not trigger a selection again.
for ( let item of dom.use ( 'li' )) {
      // do something with the item
  }

// Example:
dom.define ({
              name: 'nav'
            , selector: () => document.getElementById('nav')
            , where : ( node, i ) => node.tagName === 'LI'
            })
// dom.run ( 'nav') -> will collect all <li> elements inside #nav
dom.run ( 'nav' ).map ( item => {
                // do something with the <li> element
            })
```



## Definition of Selection
```js
const selection = {
    name: 'mySelection' // *required. A unique name for the selection
  , selector: () => document.querySelector('div')   // *required. A function that returns a DOM node or list of DOM node references
  , direction : 'up' // optional. Values: 'up' or 'down'. Default: 'down'.
  , where : ( node, i ) => node.classList.contains('myClass') // optional. A function that can filter nodes from selector function. Returns true or false. Default: true
  , stop : ( node, result ) => result.length === 1 // optional. A function that can stop the selection process. Returns true or false. Default: false
}
```

- `selector` :  A function that returns a DOM node or list of DOM node references. If the function returns a list of DOM nodes, `DOM Selector` will use them as a result. If the function returns a single DOM node, `DOM Selector` will use it as a starting point for DOM scanning and will return a list of DOM nodes according to the `direction` property;
- `direction`: If the selector function returns a single DOM node, `DOM Selector` will use it as a starting point for DOM scanning and will return a list of DOM nodes according to the `direction` property. Value 'up' will scan the DOM tree parents up to <body> tag. Value 'down' will scan the DOM tree children down to the last child. Default: 'down'. This property is ignored if the selector function returns a list of DOM nodes;
- `where`: Optional. A function that can filter nodes from selector function. Returns true or false. Default: true;
- `stop` : Optional. A function that can stop the selection process. Received arguments are current DOM node and current result. You can stop the selection process if you have found what you are looking for or number of results is enough for you. Returns true or false. Default: false;


## Links
- [History of changes](https://github.com/PeterNaydenov/dom-selector/blob/main/Changelog.md)


## Credits
'@peter.naydenov/dom-selector' was created and supported by Peter Naydenov.



## License
'@peter.naydenov/dom-selector' is released under the [MIT License](http://opensource.org/licenses/MIT).