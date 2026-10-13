// CommonJS entry types. `dist/dom-selector.cjs` does `module.exports = domSelector`.
import type * as T from './main.js' with { 'resolution-mode': 'import' };

declare function domSelector(): T.DomSelector;
declare namespace domSelector {
    type DomSelector  = T.DomSelector;
    type Selection    = T.Selection;
    type WhereContext = T.WhereContext;
    type WalkFn       = T.WalkFn;
}
export = domSelector;
