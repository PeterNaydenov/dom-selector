'use strict'


/**
 * The context object passed as the first argument to a `where` callback.
 *
 * @typedef {Object} WhereContext
 * @property {*}      item   The current candidate: an item returned by `selector`, or an element reached by the `direction` walk.
 * @property {number} i      Zero-based index of `item` among all candidates.
 * @property {number} length Number of items already in the result, before `item` is considered.
 * @property {symbol} END    A new `Symbol` for every `run`. Return it from `where` to stop the scan; a `Symbol` created elsewhere won't stop it.
 * @property {WalkFn} up     Walks upwards: call `up(element)` to get `element` and its ancestors, up to and including `<body>`.
 * @property {WalkFn} down   Walks downwards: call `down(element)` to get `element` and all its descendants, depth-first.
 */

/**
 * A generator function that yields `startingElement` first, then the elements reached by the walk.
 *
 * @callback WalkFn
 * @param {HTMLElement} startingElement  The element to start the walk from.
 * @returns {Generator<HTMLElement, void, void>}
 */

/**
 * The definition of a named selection, passed to `define` or directly to `run`.
 *
 * @typedef {Object} Selection
 * @property {string}                                                                                                    name        Name to register the selection under. Must be non-empty; defining an existing name replaces it.
 * @property {(...args: any[]) => Element | NodeList | HTMLCollection | any[] | null | undefined}                        selector    Returns the starting point: one element, a list, or `null`/`undefined` for nothing. Receives the extra arguments of `run`.
 * @property {(ctx: WhereContext, ...args: any[]) => Element | Element[] | symbol | null | undefined}                   [where]     Filters each candidate: return the item to keep it, an array to keep several, a falsy value to skip it, or `ctx.END` to stop. Receives the extra arguments of `run`. Default: keeps every item.
 * @property {'up' | 'down' | 'none'}                                                                                   [direction] Expands each element returned by `selector` with its ancestors (`'up'`) or descendants (`'down'`) before `where` runs; non-elements are dropped. Default: `'none'` (no expansion).
 * @property {(result: any[], ...args: any[]) => any}                                                                    [final]     Reshapes the result array once, after `where`. Its return value is what `run` and `use` return. Receives the extra arguments of `run` or `use`. Default: returns the array unchanged.
 */

/**
 * The object returned by `domSelector()`.
 *
 * @typedef {Object} DomSelector
 * @property {(selection: Selection) => boolean}                     define    Registers a named selection, or replaces one with the same name. Returns `false` if the selection is invalid.
 * @property {(name: string, value: any) => void}                    remember  Stores a value (typically a DOM reference) under a name without querying the DOM.
 * @property {(name: string | Selection, ...args: any[]) => any}     run       Queries the DOM with a selection, caches the result, and returns it after `final`.
 * @property {(name: string, ...args: any[]) => any}                 use       Returns the cached result of the last `run` or `remember` for `name`, after `final`. Does not query the DOM.
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
     * Coerce an arbitrary value to a real `Array`. Used to normalise the
     * output of `selector`, the return value of `where`, and the value
     * given to `remember`.
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
                    return Array.from ( value )
                }
            else if ( value instanceof Array ) {
                    return value   // Already an array: use as-is
                }
            else if ( value == null ) {
                    return []   // null / undefined: nothing to select
                }
            else {
                    return [ value ]   // A single value: wrap it
                }
        } // convertToArray func.



    /**
     * Internal: execute one selection. If `direction` is `'up'` or
     * `'down'`, each `HTMLElement` from `startingPoint` is expanded with
     * its ancestors or descendants (anything else is dropped); then
     * `where` runs for each candidate.
     *
     * @param  {*}                  startingPoint  The `selector` output. Anything `convertToArray` accepts.
     * @param  {'up'|'down'|'none'} direction
     * @param  {Function}           [where]
     * @param  {...*}               args           Forwarded to `where`.
     * @return {Array}                             The result array, before `final` runs.
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

                // Expand each element with its ancestors / descendants. Non-elements are dropped.
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
     * selection) or a `Selection` object, which is registered exactly
     * as `define` would do and then run — handy for one-shot selections.
     *
     * The result (before `final`) is cached for later `use` calls.
     *
     * Extra arguments are forwarded to **all three** of: the `selector`,
     * the `where` callback, and the `final` callback.
     *
     * Returns `[]` for a missing name, an invalid inline `Selection`, or
     * a name that was never `define`-d.
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
     * Returns `[]` if nothing is cached for `name` — it was never `run`
     * or `remember`-ed, or a later `define` cleared it. If no selection
     * is registered under `name` (only `remember`-ed), the cached array
     * is returned unchanged.
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
     * querying the DOM. `use(name)` reads it back later, passed through
     * the `final` of a selection with the same name, if one is defined.
     *
     * The value is normalised with `convertToArray`: a `NodeList` or
     * `HTMLCollection` becomes an array, an array is kept as-is, a single
     * value is wrapped in `[value]`, and `null`/`undefined` become `[]`.
     *
     * A later `define` with the same name clears the remembered value.
     *
     * @param {string} name
     * @param {*}      value  Anything; typically an element or a list of elements.
     * @return {void}
     */
    function remember ( name, value ) {
            // Not a `.length` duck-type check: <form> and <select> elements
            // have a numeric `.length` of their own and would be taken for lists.
            last.set ( name, convertToArray ( value ))
        } // remember func.



    return {
                  define     // Define a new selector
                , remember  // Store DOM reference(s) as a cached result without a selector. Useful for fixed elements.
                , run       // Run a selector and cache the result
                , use       // Read the cached result of the last `run` or `remember`
            }

} // dom-selector func.



export default domSelector


