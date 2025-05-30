# Release History

### 3.0.0 ( 2025-04-23)
- [x] Selectoin property 'direction' was extended with value 'none' - means that the result will not be expanded by default. Expanding the result of selection should be explicitly triggered by using the 'direction' property;



## 2.2.0 ( 2025-04-19)
- [x] Extra arguments for method "Run" available as arguments for the selector function;



### 2.1.2 ( 2024-12-15)
- [x] TypeScript definition files .d.ts was added to the project;



### 2.1.1 ( 2024-12-14)
- [x] Fix: Cannot use method 'use', because is definition of the selector is not properly saved; 





## 2.1.0 ( 2024-02-06)
- [x] Folder 'dist' was added to the project. Includes commonjs, umd and esm versions of the library;
- [x] Package.json: "exports" section was added. Allows you to use package as commonjs or es6 module without additional configuration;
- [x] Rollup was added to the project. Used to build the library versions;
- [ ] Bug: Cannot use method 'use', because is definition of the selector is not properly saved;





## 2.0.0 ( 2023-11-26)
- [x] Function `where` accepts a single argument - object with properties { `node`, `i`, `END`, `length`, `up`,`down` }. The `node` property is the current node from the selection. The `i` property is the index of the current node in the selection. The `END` property should be returned from the `where` function if you want to stop the search process. The `length` property is the length of the result until the current evocation of the `where` function. The `up` property is a function that returns a list of all parent DOM nodes. The `down` property is a function that returns a list of all nested DOM nodes;
- [x] Function `where` is extensible with extra arguments from second parameter. Provide extra arguments in the `run` function;
- [x] Function `stop` was removed. Use `where` function instead. Parameter `END` should be returned from the `where` function if you want to stop the search process. Size of the result is available in the `length` property;
- [x] Test cases were updated;
- [x] Return from `where` function was changed. In previeous versions the `where` function should return `true` or `false`. Now the `where` function can return DOM element, null or 'END' constant. Return DOM element if you want to add it to the result. Return null if you want to skip the current node. Return 'END' constant if you want to stop the search process;



## 1.0.1 ( 2023-11-19)
- [x] Just small code optimization;




## 1.0.0 ( 2023-11-17 )
- [x] Initial release