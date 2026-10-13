export type WhereContext = {
    /**
     * The current candidate: an item returned by `selector`, or an element reached by the `direction` walk.
     */
    item: any;
    /**
     * Zero-based index of `item` among all candidates.
     */
    i: number;
    /**
     * Number of items already in the result, before `item` is considered.
     */
    length: number;
    /**
     * A new `Symbol` for every `run`. Return it from `where` to stop the scan; a `Symbol` created elsewhere won't stop it.
     */
    END: symbol;
    /**
     * Walks upwards: call `up(element)` to get `element` and its ancestors, up to and including `<body>`.
     */
    up: WalkFn;
    /**
     * Walks downwards: call `down(element)` to get `element` and all its descendants, depth-first.
     */
    down: WalkFn;
};
export type WalkFn = (startingElement: HTMLElement) => Generator<HTMLElement, void, void>;
export type Selection = {
    /**
     * Name to register the selection under. Must be non-empty; defining an existing name replaces it.
     */
    name: string;
    /**
     * Returns the starting point: one element, a list, or `null`/`undefined` for nothing. Receives the extra arguments of `run`.
     */
    selector: (...args: any[]) => Element | NodeList | HTMLCollection | any[] | null | undefined;
    /**
     * Filters each candidate: return the item to keep it, an array to keep several, a falsy value to skip it, or `ctx.END` to stop. Receives the extra arguments of `run`. Default: keeps every item.
     */
    where?: (ctx: WhereContext, ...args: any[]) => Element | Element[] | symbol | null | undefined;
    /**
     * Expands each element returned by `selector` with its ancestors (`'up'`) or descendants (`'down'`) before `where` runs; non-elements are dropped. Default: `'none'` (no expansion).
     */
    direction?: 'up' | 'down' | 'none';
    /**
     * Reshapes the result array once, after `where`. Its return value is what `run` and `use` return. Receives the extra arguments of `run` or `use`. Default: returns the array unchanged.
     */
    final?: (result: any[], ...args: any[]) => any;
};
export type DomSelector = {
    /**
     * Registers a named selection, or replaces one with the same name. Returns `false` if the selection is invalid.
     */
    define: (selection: Selection) => boolean;
    /**
     * Stores a value (typically a DOM reference) under a name without querying the DOM.
     */
    remember: (name: string, value: any) => void;
    /**
     * Queries the DOM with a selection, caches the result, and returns it after `final`.
     */
    run: (name: string | Selection, ...args: any[]) => any;
    /**
     * Returns the cached result of the last `run` or `remember` for `name`, after `final`. Does not query the DOM.
     */
    use: (name: string, ...args: any[]) => any;
};
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
declare function domSelector(): DomSelector;
export default domSelector;
//# sourceMappingURL=main.d.ts.map