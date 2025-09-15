<img src="dom-selector.png" width="100%" alt="Notice" align="center" />


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
// or require it:
// const domSelector = require('@peter.naydenov/dom-selector');

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
    , selector: () => document.querySelectorAll ( 'li' )  
})

// Run a selection. Result is always an array
dom.run ( 'li' )

// Method 'use' will use the last result of the selection.
for ( let item of dom.use ( 'li' )) {
      // do something with the item
  }

// Example:
dom.define ({
              name: 'nav' // name of the selection
            , selector: ( ...extra ) => document.getElementById ( 'nav' )
            // ...extra   -> extra arguments coming from the 'run' function
           , direction : 'none'
           // Direction is a extra scan instruction applied to the result of the selector.
           // Values: 'up', 'down' or 'none'.
           // 'none' -> will not expand the result.
           // 'up'   -> will expand the result with all parent DOM nodes to the <body> tag.
           // 'down' -> will expand the result with all child DOM nodes.
           // If 'direction' is not specified, the default value is 'none'.
           , where : ({ item, i, END, length, up, down }, ...extra) => item.tagName === 'LI' ? item : null
            // `where` will be executed for each item of the result array.
            // item   -> selector element
            // i      -> index of the selector element
            // length -> length of the result array
            // END    -> Symbol to stop the scan
            // up     -> up() function returns a list of all parent DOM nodes.
            // down   -> down() function returns a list of all nested DOM nodes.
            // ...extra   -> extra argument coming from the 'run' function
            , final : ( result ) => result
            // `final` will be executed once on the result array
            // result -> the result of the selection. You can do extra work before returning the result
            })
// dom.run ( 'nav') -> will collect all <li> elements inside #nav
dom.run ( 'nav', extra ).map ( item => {
                // do something with the <li> element
            })
```



## Definition of Selection
```js
const selection = {
    name: 'mySelection' // *required. A unique name for the selection
  , selector: () => document.querySelector('div')   // *required. A function that returns a DOM node or list of DOM node references
  , direction : 'up' // optional. Values: 'none', 'up' or 'down'. Default: 'none'.
  , where : ({ item, i, END, length, up, down }) => item.classList.contains('myClass') ? item : null 
  // optional. A function that can filter nodes from selector function. Returns item to include it in selection, null for removing the item from the selection or END to stop the selection process. Use 'up' and 'down' arguments are functions to get the list of nodes in the current direction.
  , final ( result ) => { /** Do something with the result. Return the final result */}
  // optional. A function that can modify the result before returning it
  // 'final' is available after version 3.1.0
}


// Example:
// Select only <li> elements that has a <span> inside
const selection = { 
    name: 'li-span' 
  , selector: () => document.querySelectorAll ( 'li' ) 
  , where : ({ item, i, END, length, up, down }) => {
                                  let hasSpan = false;
                                  for ( let child of down(item) ) { // down(item) -> returns a list of all nested DOM nodes
                                          if ( child.tagName === 'SPAN' ) hasSpan = true;
                                      }
                                  return hasSpan ? item : null;
                          }
}
// Respectively 'up' function returns a list of all parent DOM nodes. 
```

- `selector` :  A function that returns a DOM node or list of DOM node references. If the function returns a list of DOM nodes, `DOM Selector` will use them as a result. If the function returns a single DOM node, `DOM Selector` will use it as a starting point for DOM scanning and will return a list of DOM nodes according to the `direction` property;
- `direction`: If the selector function returns a single DOM node, `DOM Selector` will use it as a starting point for DOM scanning and will return a list of DOM nodes according to the `direction` property. Value 'up' will scan the DOM tree parents up to <body> tag. Value 'down' will scan the DOM tree children down to the last child. Default: 'down'. This property is ignored if the selector function returns a list of DOM nodes;
- `where`: Optional. A function that can filter nodes from selector function. Returns the item to select, null to remove. Return END to stop the selection process;



## Examples



### Collect child elements of selected element

```js
dom.define ({   // Define a selector. Result should be filtered (only elements that are <li>)
            name: 'children'
          , selector: () => document.querySelector ( '.nav' )
          , direction: 'down' // Extends the selector result with all child DOM nodes
          , where: ({item, i, END, length, down, up }, selectedTagName ) => item.tagName === selectedTagName ? item : null
          // Function 'where' will recieve extra arguments from the 'run' function
    })
let r = null
r = dom.run ( 'children', 'LI' ) // 'LI' is a selectedTagName
// --> r will contain list of all <li> children of element with class 'nav'
// If I want to collect only span elements from the navigation menu:
r = dom.run ( 'children', 'SPAN' )
// --> r will contain list of all <span> children of element with class 'nav'

// Alternative way - don't use direction property:
dom.define ({
      name: 'children-span'
      , selector: () => document.querySelector ( '.nav' )
      , where: ({item, i, END, length, down, up }) => {
                // item here is a full navigation block
                const res = [];
                for ( let child of down(item) ) { // down(item) -> returns a list of all nested DOM nodes
                        if ( child.tagName === 'SPAN' )   res.push ( child )
                    }
                return res
           } // where func.
})
r = dom.run ( 'children-span' )
// --> r will contain list of all <span> children of element with class 'nav'
```



### Parameterized selector
Selector can recive parameters and can be parameterized. Here is an example:
```js
dom.define ({   // Define a parameterized selector. Result should be filtered (only elements that contains SPAN )
                              name: 'has-span'
                            , selector: ( target ) => document.querySelectorAll ( target )
                            , where: ({item, i, END, length, down, up }) => {
                                          let res =[];
                                          for ( let child of down(item) ) {
                                                    if ( child.tagName === 'SPAN' )   res.push ( item )
                                                  }
                                          return res
                                } // where
                        })
let r = null                        
r = dom.run ( 'has-span', 'a' )
//  --> r will contain list of all <a> elements that have <span> inside
r = dom.run ( 'has-span', 'li' )
// --> r will contain list of all <li> elements that have <span> inside
r = dom.run ( 'has-span', 'p' )
// --> r will contain list of all <p> elements that have <span> inside
```
Here is another example:
```js
dom.define ({   // Define a parameterized selector. Result should be filtered (only elements that contains SPAN )
                              name: 'siblings'
                            , selector: ( target ) => target.parentElement.children
                        })
let r = null
// let's have a reference to a single DOM element
const node = document.querySelector ( 'li' )
r = dom.run ( 'siblings', node )
// --> r will contain list of all <li> siblings of the selected <li> element  
```


## Links
- [History of changes](https://github.com/PeterNaydenov/dom-selector/blob/main/Changelog.md)
- [Migration guide](https://github.com/PeterNaydenov/dom-selector/blob/main/Migration.guide.md)


## Credits
'@peter.naydenov/dom-selector' was created and supported by Peter Naydenov.



## License
'@peter.naydenov/dom-selector' is released under the [MIT License](http://opensource.org/licenses/MIT).