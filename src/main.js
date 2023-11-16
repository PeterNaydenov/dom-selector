'use strict'

function domSelector () {

    const 
          store = new Map() // Storage for selector definitions
        , last  = new Map() // Storage for last selected elements and remembered elements
        ;


    
    function define ( selection ) {
                let { name, selector, where, stop, direction } = selection;
                
                if ( !name || !selector || !(selector instanceof Function) )   return null                
                if ( !where     )   where = () => true  // Default where
                if ( !stop      )   stop  = () => false // Default stop
                if ( !direction )   direction = 'down'  // Default direction
                
                store.set ( name, { selector, where, stop, direction })
                return true
        } // define func.



    function* up ( startingElement ) {
                yield startingElement
                const parent = startingElement.parentElement
                if ( parent.tagName === 'BODY' ) return
                yield* up ( parent )
        } // up func.



    function* down ( startingElement ) {
                yield startingElement
                const children = startingElement.children
                if ( children.length === 0 ) return
                for ( let child of children ) {
                            yield* down ( child )
                    }
        } // down func.


    
    function _select ( startingPoint, direction, where, stop, ...args ) {
                const 
                      forScan = (   // If startingPoint is HTMLCollection, nodeList or Array, we don't need to scan the DOM.
                                    startingPoint instanceof HTMLCollection ||
                                    startingPoint instanceof NodeList       ||
                                    startingPoint instanceof Array
                                ) ? false : true   
                    , result = []
                    ;
                let source;
                if ( forScan )   source = ( direction === 'up' ) ? up( startingPoint ) : down ( startingPoint )
                else             source = startingPoint
                let i = 0;
                for ( let item of source ) {
                            if ( where ( item, i, ...args ))   result.push ( item )
                            if ( stop ( item, result ))   break
                            i++
                    }
                return result
        } // _select func.

    
    
    function run ( name, ...args ) {
                    if ( typeof name !== 'string') {   // When we want to register a new selector and run it immediately
                                    let check = define ( name )
                                    if ( !check ) return []
                            }
                                        
                    let record = store.get( name );
                    if ( record == null ) return []

                    let { name:nm, selector, direction, where, stop } = record;                    
                    let result = _select ( selector(), direction, where, stop, ...args );
                    last.set ( nm, result )
                    return result
        } // run func.



    function use ( name ) {
                const record = last.get( name );
                if ( record == null ) return []
                return record
        }  // use func.



    function remember ( name, domElement ) {
            // Add to last domElement if is an array, otherwise but it in an array
             if ( domElement instanceof Array ) {
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


