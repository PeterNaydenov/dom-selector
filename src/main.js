'use strict'

function domSelector () {

    const 
          store = new Map() // Storage for selector definitions
        , last  = new Map() // Storage for last selected elements and remembered elements
        ;

    /**
     * @typedef {Object} Selection
     * @property {string} name - Name of the selection
     * @property {Function} selector - Function that returns DOM element as the starting point of the selection or list of DOM elements
     * @property {Function} [where] - Function that returns DOM element or null if the element should be filtered out. Returns END symbol if the selection should be stopped
     * @property {'up'|'down'} [direction] - Direction of DOM scan if selector returns a single DOM element
     */


    /**
     * @function define
     * @description Define a new selection
     * @param {Selection} selection - Selection definition
     * @returns {boolean} - True if the selection was defined successfully
     */
    function define ( selection ) {
                let { name, selector, where, direction } = selection;
                if ( !name || !selector || !(selector instanceof Function) )   return false                
                if ( !where     )   where = ({item}) => item  // Default where
                if ( !direction )   direction = 'none'  // Default direction. Possible values: 'up', 'down' and 'none'
                
                store.set ( name, { name, selector, where, direction })
                return true
        } // define func.



    function* up ( startingElement, end=false ) {
                yield startingElement
                if ( end ) return
                const parent = startingElement.parentElement
                if ( parent.tagName === 'BODY' ) end = true
                yield* up ( parent , end )
        } // up func.



    function* down ( startingElement ) {
                yield startingElement
                const children = startingElement.children
                if ( children.length === 0 ) return
                for ( let child of children ) {
                            yield* down ( child )
                    }
        } // down func.



        /**
         * Converts a value to an array.
         * @param {*} value - The value to convert to an array
         * @returns {Array} - The converted array
         */
    function convertToArray ( value ) {
            if ( 
                        value instanceof NodeList ||
                        value instanceof HTMLCollection
            ) {
                    // If starting point is a NodeList or HTMLCollection, we need to convert it to an array
                    return Array.from ( value )
                }
            else if ( value instanceof Array ) {
                    // If starting point is an array, we need to convert it to an array
                    return value
                }
            else if ( value == null ) {
                    // If starting point is null, we need to convert it to an empty array
                    return []
                }
            else {
                    return [ value ]
                }
        } // convertToArray func.


    
    /**
     * @function _select
     * @description Run a selection
     * @param {HTMLElement|Array<HTMLElement>} startingPoint - Starting point of the selection or list of DOM elements
     * @param {'up'|'down'|'none'} [direction] - Direction of DOM scan if selector returns a single DOM element
     * @param {Function} [where] - Function that returns DOM element or null if the element should be filtered out. Returns END symbol if the selection should be stopped
     * @param {...*} [args] - Aditional arguments provided to where function
     * @returns {Array<HTMLElement>} - List of DOM elements
     */
    function _select ( startingPoint, direction, where, ...args ) {
                const 
                      isforScan = ( direction !== 'none' )
                    , hasWhereFunc = ( where instanceof Function )  
                    , result = []
                    , END = Symbol ( 'end___' )
                    ;

                let source = convertToArray ( startingPoint );
                if ( source.length === 0 )   return result

                // Add to source elements of extra scan if direction is defined as up or down
                if ( isforScan ) {
                        source = source.reduce ( ( res, item) => {
                                            if ( item instanceof HTMLElement ) {
                                                    if ( direction === 'up' ) res.push( ...up ( item ) )
                                                    else if ( direction === 'down' ) res.push( ...down ( item ) )
                                                }
                                            return res
                                        }, [] )
                    }

                if ( hasWhereFunc ) {
                            let i = 0;
                            for ( let item of source ) {
                                        let r = where ( {item, i, END, length:result.length, down, up}, ...args );
                                        i++
                                        if ( r === END )  break
                                        if ( r )   result.push ( ...convertToArray ( r ))
                                }
                    }
                else    result == source
                return result
        } // _select func.

    
    /**
     * @function run
     * @description Run a selection
     * @param {string|Selection} name - Name of the selection or selection definition
     * @param {...*} [args] - Aditional arguments provided to where function
     * @returns {Array} - List of DOM elements
     */
    function run ( name, ...args ) {
                    if ( typeof name !== 'string') {   // When we want to register a new selector and run it immediately
                                    let check = define ( name )
                                    if ( !check ) return []
                            }
                                        
                    let record = store.get( name );
                    if ( record == null ) return []

                    let { name:nm, selector, direction, where } = record;
                    let result = _select ( selector(...args), direction, where, ...args );
                    last.set ( name, result )
                    return result
        } // run func.


    /**
     * @function use
     * @description Use the last result of the selector or remembered DOM reference(s)
     * @param {string} name - Name of the selection
     * @returns {Array} - List of DOM elements. Empty array if the selection was not found.
     */
    function use ( name ) {
                const record = last.get( name );
                if ( record == null ) return []
                return record
        }  // use func.


    /**
     * @function remember
     * @description Store a DOM reference(s) directly as last result without creating a selector. Useful for fixed elements.
     * @param {string} name - Name of the selection
     * @param {HTMLElement|HTMLCollection|NodeList|Array<HTMLElement>} domElement - DOM element or list of DOM elements
     * @returns {void}
     */
    function remember ( name, domElement ) {
            // Add to last domElement if is an array, otherwise but it in an array
             if ( domElement?.length ) {
                        last.set ( name, domElement )
                        return
                }
            last.set ( name, [ domElement ] )
        } // add func.



    return {
                  define     // Define a new selector
                , remember  // Store a DOM reference(s) directly as last result without creating a selector. Useful for fixed elements.
                , run       // Run a selector
                , use       // Use the last result of the selector or remembered reference(s)
            }

} // dom-selector func.



export default domSelector


