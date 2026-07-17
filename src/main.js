'use strict'


/**
 * @typedef {Object} WhereContext
 * @property {*}     item    The current element from the source list.
 * @property {number} i      Zero-based index of `item` in the source list.
 * @property {number} length Items already accumulated in the result *before* `item` is considered.
 * @property {symbol} END    A per-call `Symbol`. Return this from `where` to stop the scan early.
 * @property {WalkFn} up     Generator yielding the ancestors of `item`, up to and including `<body>`.
 * @property {WalkFn} down   Generator yielding `item` followed by all its descendants (depth-first).
 */

/**
 * @callback WalkFn
 * @param {HTMLElement} startingElement
 * @returns {Generator<HTMLElement, void, void>}
 */

/**
 * @typedef {Object} Selection
 * @property {string}                                                                                              name      Required. Unique name for the selection. Must be truthy.
 * @property {(...args: any[]) => Element | NodeList | HTMLCollection | Array}                                     selector  Required. Returns a single element (used with `direction`) or a list of elements.
 * @property {(ctx: WhereContext, ...args: any[]) => Element | null | symbol | Element[]}                         [where]    Optional. Default: `({item}) => item`.
 * @property {'up' | 'down' | 'none'}                                                                             [direction] Optional. Default: `'none'`.
 * @property {(result: any[], ...args: any[]) => any}                                                              [final]    Optional. Default: identity.
 */

/**
 * @typedef {Object} DomSelector
 * @property {(selection: Selection) => boolean}                                define    Register (or update) a named selector.
 * @property {(name: string, value: any) => void}                                remember  Cache an arbitrary value (typically a DOM reference) under a name.
 * @property {(name: string | Selection, ...args: any[]) => any}                 run       Execute a selector and return the final result.
 * @property {(name: string, ...args: any[]) => any}                             use       Re-read the cached result of the last `run`/`remember` for `name`.
 */

/**
 * Create a fresh, isolated DOM-Selector instance. Each call returns an
 * independent registry; nothing is shared between instances.
 *
 * @returns {DomSelector}
 * @example
 *   const dom = domSelector();
 *   dom.define({ name: 'links', selector: () => document.querySelectorAll('a') });
 *   dom.run('links');
 */
function domSelector () {

    const
          store = new Map() // Storage for selector definitions
        , last  = new Map() // Storage for last selected elements and remembered elements
        ;


    /**
     * Register a selector under a name, or update an existing one.
     *
     * Returns `false` (instead of throwing) when the input is unusable:
     *  - the argument is `null` or `undefined`
     *  - `name` is missing or empty
     *  - `selector` is missing or not a function
     *
     * Re-defining an existing name **overwrites** the selector and
     * **invalidates** the cached result. The next `use(name)` returns
     * `[]` until `run(name)` repopulates the cache.
     *
     * @param  {Selection} selection
     * @return {boolean}   `true` if the selector was stored, `false` otherwise.
     */
    function define ( selection ) {
                if ( !selection )   return false   // null / undefined / etc. — must not destructure
                let { name, selector, where, direction, final } = selection;

                if ( !name || !selector || !(selector instanceof Function) )   return false
                if ( !where     )   where = ({item}) => item  // Default where
                if ( !final     )   final = ( result ) => result
                if ( !direction )   direction = 'none'  // Default direction. Possible values: 'up', 'down' and 'none'

                store.set ( name, { name, selector, where, direction, final })
                // Re-defining a name invalidates any cached result so that
                // `use(name)` doesn't return a stale array from the previous
                // definition. Callers who want the old behaviour can `run`
                // again to repopulate the cache.
                last.delete ( name )
                return true
        } // define func.



    /**
     * Generator: yields `startingElement` and then each ancestor up to
     * (and including) `<body>`. If `startingElement` is detached (no
     * parent), yields only itself and stops.
     *
     * @param  {HTMLElement} startingElement
     * @param  {boolean}     [end=false]  Internal recursion flag. Callers should not set this.
     * @return {Generator<HTMLElement, void, void>}
     */
    function* up ( startingElement, end=false ) {
                yield startingElement
                if ( end ) return
                const parent = startingElement.parentElement
                // Detached element: no parent to walk. Yield the start only
                // and stop — accessing `parent.tagName` would throw.
                if ( !parent ) return
                if ( parent.tagName === 'BODY' ) end = true
                yield* up ( parent , end )
        } // up func.



    /**
     * Generator: yields `startingElement` and then all of its descendants
     * in depth-first order.
     *
     * @param  {HTMLElement} startingElement
     * @return {Generator<HTMLElement, void, void>}
     */
    function* down ( startingElement ) {
                yield startingElement
                const children = startingElement.children
                if ( children.length === 0 ) return
                for ( let child of children ) {
                            yield* down ( child )
                    }
        } // down func.



    /**
     * Coerce an arbitrary value to a real `Array`. Used to normalise
     * `selector` / `remember` inputs that may be a `NodeList`,
     * `HTMLCollection`, an `Array`, `null`/`undefined`, or a single value.
     *
     * @param  {*}      value
     * @return {Array}  `Array.from(value)` for NodeList/HTMLCollection, the
     *                  array itself if already an Array, `[]` for nullish,
     *                  otherwise `[value]`.
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
     * Internal: execute one selector pipeline. Walks the tree if
     * `direction !== 'none'`, then runs `where` for each candidate.
     *
     * @param  {*}               startingPoint  Anything `convertToArray` accepts.
     * @param  {'up'|'down'|'none'} direction
     * @param  {Function}        [where]
     * @param  {...*}            args           Forwarded to `where` and to the stored `final`.
     * @return {Array}                           The filtered / mapped array, before `final` runs.
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
                return result
        } // _select func.


    /**
     * Execute a named selector and return its final result.
     *
     * Accepts either a string `name` (look up an existing `define`-d
     * selector) or a `Selection` object (register it inline and run it
     * once — useful for one-shot selectors).
     *
     * Extra arguments are forwarded to **all three** of: the `selector`,
     * the `where` callback, and the `final` callback.
     *
     * Returns `[]` for: a missing name, a bad inline `Selection`, a name
     * that was never `define`-d.
     *
     * @param  {string | Selection} name
     * @param  {...*}               args
     * @return {*}                  Whatever `final` returns (an array by default, but `final` can return any value).
     */
    function run ( name, ...args ) {
                    if ( typeof name !== 'string') {   // When we want to register a new selector and run it immediately
                                    let check = define ( name )
                                    if ( !check ) return []
                                    name = name.name   // After define, look up by the registered name
                            }

                    let record = store.get( name );
                    if ( record == null ) return []

                    let { selector, direction, where, final } = record;
                    let result = _select ( selector(...args), direction, where, ...args );
                    last.set ( name, result )
                    return final ( result, ...args )
        } // run func.


    /**
     * Re-read the cached result of the last `run` or `remember` for
     * `name` and run the registered `final` over it.
     *
     * Does **not** call the `selector` — it just transforms the cached
     * array. This is the cheap path: zero DOM work, just `final`.
     *
     * Extra arguments are forwarded **only to `final`** (not to the
     * `selector` or `where`, which aren't invoked here).
     *
     * Returns `[]` for an unknown name. Falls back to the identity
     * function if the name is only `remember`-ed (no `final` to run).
     *
     * @param  {string} name
     * @param  {...*}   args   Forwarded to `final`.
     * @return {*}             Whatever `final` returns.
     */
    function use ( name, ...args ) {
                const cached = last.get( name );
                if ( cached == null ) return []
                // Selector may not be registered (e.g. only `remember`-ed).
                // Fall back to identity so remembered references still work.
                const record = store.get( name );
                const final   = record ? record.final : ( result ) => result;
                return final ( cached, ...args )
        }  // use func.


    /**
     * Cache a value (typically a DOM reference) under a name without
     * registering a selector. `use(name)` later returns the same value
     * as a normalised array.
     *
     * The value is run through `convertToArray`, so list-likes
     * (`NodeList`, `HTMLCollection`, `Array`) are stored as-is, a
     * single element is wrapped in `[element]`, and `null`/`undefined`
     * become `[]`. Note that `<form>` and `<select>` elements carry a
     * numeric `.length` of their own, so a duck-type `.length` check
     * would mistake them for lists — always use this function rather
     * than trying to normalise by hand.
     *
     * @param {string} name
     * @param {*}      value  Anything. Normalised to an array internally.
     * @return {void}
     */
    function remember ( name, domElement ) {
            // Normalize to a real array so `use` always returns an array.
            // Note: a `.length` check is not enough here — <form> and <select>
            // elements have a numeric `.length` of their own, and an empty
            // NodeList has `.length === 0` and would be double-wrapped.
            last.set ( name, convertToArray ( domElement ))
        } // remember func.



    return {
                  define     // Define a new selector
                , remember  // Store a DOM reference(s) directly as last result without creating a selector. Useful for fixed elements.
                , run       // Run a selector
                , use       // Use the last result of the selector or remembered reference(s)
            }

} // dom-selector func.



export default domSelector


