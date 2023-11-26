# Release History

## 2.0.0 ( 2023-11-26)
- [x] Function `where` accepts a single argument - object with properties { `node`, `i`, `END`, `length`, `up`,`down` }. The `node` property is the current node from the selection. The `i` property is the index of the current node in the selection. The `END` property should be returned from the `where` function if you want to stop the search process. The `length` property is the length of the result until the current evocation of the `where` function. The `up` property is a function that returns a list of all parent DOM nodes. The `down` property is a function that returns a list of all nested DOM nodes;
- [x] Function `where` is extensible with extra arguments from second parameter. Provide extra arguments in the `run` function;
- [x] Function `stop` was removed. Use `where` function instead. Parameter `END` should be returned from the `where` function if you want to stop the search process. Size of the result is available in the `length` property;
- [x] Test cases were updated;



## 1.0.1 ( 2023-11-19)
- [x] Just small code optimization;




## 1.0.0 ( 2023-11-17 )
- [x] Initial release