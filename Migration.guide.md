# Migration Guides



## From 1.x.x to 2.x.x

### Arguments for `where` function were changed. 
- Before : Function `where` accepts two arguments: `node` and `i`. The function `run` extra arguments are follow.  The `node` argument is the current node from the selection. The `i` argument is the index of the current node in the selection. The `where` function should return `true` or `false` to filter the node from the selection.
- After: Function `where` accepts a single argument - object with properties `node`, `i`, `END`, `length`. The `node` property is the current node from the selection. The `i` property is the index of the current node in the selection. The `END` property should be returned from the `where` function if you want to stop the search process. The `length` property is the length of the result until the current evocation of the `where` function.

```js
// Before
const selection = {
    name: 'mySelection'
  , selector: () => document.querySelector('div')
  , where : ( item, i ) => node.classList.contains('myClass')
}

// After
const selection = {
    name: 'mySelection'
  , selector: () => document.querySelector('div')
  , where : ( { item, i, END, length } ) => node.classList.contains('myClass')
}
// item   -> selector element
// i      -> index of the selector element
// length -> length of the result array
// END    -> Symbol to stop the scan
```

### Function `stop` was removed.
- Before: Function `stop` accepts two arguments: `node` and `result`. The function `stop` should return `true` or `false` to stop the selection process.
- After: Function `stop` was removed. Use `where` function instead. Parameter `END` should be returned from the `where` function if you want to stop the search process. Size of the result is available in the `length` property.