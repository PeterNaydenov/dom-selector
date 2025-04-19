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
                if ( !direction )   direction = 'down'  // Default direction
                
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


    
    function _select ( startingPoint, direction, where, ...args ) {
                const 
                      // If startingPoint is HTMLCollection, nodeList or Array, we don't need to scan the DOM.
                      forScan = ( startingPoint?.length ) ? false : true   
                    , result = []
                    , END = Symbol ( 'end___' )
                    ;
                let source;
                if ( forScan ) source = ( direction === 'up' ) ? up( startingPoint ) : down ( startingPoint )
                else           source = startingPoint
                let i = 0;
                for ( let item of source ) {
                            let r = where ( {item, i, END, length:result.length, down, up}, ...args );
                            i++
                            if ( r === END )  break
                            if ( r )   result.push ( r )
                    }
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


