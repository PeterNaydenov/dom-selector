export type WhereContext = {
    /**
     * The current element from the source list.
     */
    item: any;
    /**
     * Zero-based index of `item` in the source list.
     */
    i: number;
    /**
     * Items already accumulated in the result *before* `item` is considered.
     */
    length: number;
    /**
     * A per-call `Symbol`. Return this from `where` to stop the scan early.
     */
    END: symbol;
    /**
     * Generator yielding the ancestors of `item`, up to and including `<body>`.
     */
    up: WalkFn;
    /**
     * Generator yielding `item` followed by all its descendants (depth-first).
     */
    down: WalkFn;
};
export type WalkFn = (startingElement: HTMLElement) => Generator<HTMLElement, void, void>;
export type Selection = {
    /**
     * Required. Unique name for the selection. Must be truthy.
     */
    name: string;
    /**
     * Required. Returns a single element (used with `direction`) or a list of elements.
     */
    selector: (...args: any[]) => Element | NodeList | HTMLCollection | any[];
    /**
     * Optional. Default: `({item}) => item`.
     */
    where?: (ctx: WhereContext, ...args: any[]) => Element | null | symbol | Element[];
    /**
     * Optional. Default: `'none'`.
     */
    direction?: 'up' | 'down' | 'none';
    /**
     * Optional. Default: identity.
     */
    final?: (result: any[], ...args: any[]) => any;
};
export type DomSelector = {
    /**
     * Register (or update) a named selector.
     */
    define: (selection: Selection) => boolean;
    /**
     * Cache an arbitrary value (typically a DOM reference) under a name.
     */
    remember: (name: string, value: any) => void;
    /**
     * Execute a selector and return the final result.
     */
    run: (name: string | Selection, ...args: any[]) => any;
    /**
     * Re-read the cached result of the last `run`/`remember` for `name`.
     */
    use: (name: string, ...args: any[]) => any;
};
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
declare function domSelector(): DomSelector;
export default domSelector;
//# sourceMappingURL=main.d.ts.map