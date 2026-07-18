---
name: dom-selector
description: |
  Help developers use the `@peter.naydenov/dom-selector` library correctly.
  Use this skill when the question mentions "dom-selector", `domSelector()`,
  `dom.define`, `dom.run`, `dom.use`, `dom.remember`, `direction: 'up'|'down'|'none'`,
  the `END` symbol in a `where` callback, the `final` hook, or any of the
  library's typedefs (`Selection`, `WhereContext`, `WalkFn`, `DomSelector`).
  Triggers on requests like "how do I find elements in my vanilla-JS app",
  "cache DOM lookups by name", "walk descendants / ancestors of a node",
  "stop a scan early", "filter a NodeList", "shape a result array with a
  projection", or any question about the v1.x → v2.x → v3.x migration
  sequence. Do NOT trigger for plain `document.querySelector` questions
  unrelated to this library, or for other `@peter.naydenov/*` packages —
  route those to their own skills.
---

# DOM Selector Helper

## Inputs to collect
- **Library version** — read `package.json` for `@peter.naydenov/dom-selector` if available; otherwise ask. Defaults and method signatures differ across 1.x, 2.x, and 3.x. The shape of `where`, the existence of `direction: 'none'`, and the existence of `final` and `END` semantics are all version-dependent.
- **DOM the user is querying** — a file path, an HTML snippet, or a description. Without this, examples can't be grounded and the answer will read as boilerplate.
- **Desired output shape** — array of elements? count? a single element? a transformed value? Drives whether to recommend `where`, `final`, or just `selector` alone.

## Procedure
1. **Confirm the version, then read `references/api.md`** for the canonical surface: 4 methods (`define`, `run`, `use`, `remember`), 5 `Selection` properties, the `WhereContext` object, and `END` semantics. Reason: this library has subtle defaults (`direction: 'none'`, `where` defaults to identity) that produce silently empty results when forgotten.
2. **Read `references/patterns.md`** for the most common shapes. Reason: 80% of usage is one of five canonical patterns; pattern-matching the user's question to the right one saves a round-trip.
3. **If the user is migrating, read `references/migration.md`.** Reason: `where` was renamed (`node` → `item`) and its return contract changed (1.x → 2.x), and `direction` gained `'none'` and a default of `'none'` (2.x → 3.x). Old code from tutorials doesn't compile against current versions.
4. **Draft the answer using the building blocks below.** Reason: these are the bits first-time developers get wrong:
   - `define` is idempotent. Re-defining the same name **overwrites the selector and invalidates the cache** (3.1.4+). The next `use(name)` returns `[]` until `run(name)` repopulates.
   - `run(name, ...args)` forwards the extra args to **all three** of `selector`, `where`, and `final`.
   - `use(name, ...args)` forwards the extra args to **`final` only** — it does **not** re-run the selector. It transforms the cached array, no DOM work.
   - `END` is a **per-call `Symbol`** delivered via the `where` context. Return the one from the context; a self-made `Symbol()` is a different symbol and won't stop the scan.
   - `direction: 'none'` is the default. The result is **not** auto-expanded. If the selector returns a single element, only that element is fed to `where` unless `direction` is set.
   - `where` can return: the element (keep it), `null` (skip it), an `Element[]` (add each), or `END` (stop the scan).
   - `final` runs once on the final array. It can return any value, not just an array — so `run` / `use` don't always return `Array`.
5. **Cross-check against the installed `types/main.d.ts`** if you need ground truth. Reason: the `.d.ts` in the consumer's `node_modules/@peter.naydenov/dom-selector/types/` is auto-generated from the JSDoc and is what TypeScript actually sees. If anything in `references/api.md` or the README disagrees with the types, the types win.
6. **If the answer involves a non-obvious shape** (cache invalidation, `END`, args forwarding, `final` returning a non-array), call it out explicitly in the response — don't make the user re-derive the rule.

## Output contract
- **Code that runs.** A complete snippet with `import` / `require`, at least one `dom.define(...)`, and at least one `dom.run(...)`. No "..." placeholders that hide the structure.
- **One recommendation, not three.** If multiple methods could solve the problem, pick one and explain in 1-2 sentences why it's the right shape for the user's case.
- **Version stamps.** When a behaviour depends on a specific version, write it inline: `// since 3.1.0: final hook`, `// 3.1.4+: re-define invalidates the cache`.
- **Pointer to references** when the question is deep (migration, `END` semantics) rather than dumping everything in the chat.

## Failure handling
- **User is on 1.x or 2.x and asks about a 3.x feature** (`final`, `END` semantics, `direction: 'none'` default) → flag the version gap up front and link `references/migration.md`. Do not silently write 3.x code for a 2.x user.
- **User expects stale cache after re-define** → note that 3.1.4+ invalidates the cache; if they need the old "use returns whatever was last cached" behaviour, they can `run` after `define` to repopulate.
- **User writes a homemade `Symbol('end___')` and the scan doesn't stop** → they need to capture `END` from the `where` context object, not create their own. This is the most common footgun in this library.
- **User tries to `define` without a name, with `selector: 'not-a-fn'`, or with `null` / `undefined`** → since 3.1.4, `define` returns `false` and `run` returns `[]` instead of throwing. If the user reports "nothing happens", check for the silent false-return path.
- **User passes an `Event`, `Window`, or other non-element to `selector`** → `run` will execute but `direction: 'up'|'down'` walks `.parentElement` / `.children` which is `null` for non-Element roots. Recommend `where` to filter to elements, or have `selector` return a `Document` or specific root.

## Examples

**Input:** "How do I find every `<li>` inside `.nav` that has a `<span>` somewhere in it?"
**Output:**
```js
dom.define({
  name: 'nav-li-with-span',
  selector: () => document.querySelector('.nav'),
  direction: 'down',                          // walk descendants
  where: ({ item, down }) => {                 // down() inside where for subtree test
    for (const child of down(item)) {
      if (child.tagName === 'SPAN') return item
    }
    return null
  }
})
const lis = dom.run('nav-li-with-span')
```

**Input:** "I'm calling `return END` from my where callback but the scan doesn't stop — I made `const END = Symbol()` at the top."
**Output:** That `END` is a different symbol from the one `_select` checks against. The library creates a fresh `Symbol` per `run` call and hands it to your callback through the context. Capture it from there:
```js
where: ({ item, END }) => (item.tagName === 'A') ? END : item
//                                  ^^^ — the per-call symbol, not a homemade one
```

**Input:** "I want to reuse the last result without re-querying the DOM every time, but my projection depends on a flag."
**Output:** Use `run` once to populate the cache and `use` for the cheap reads. `use` forwards args to `final` only:
```js
dom.define({
  name: 'links',
  selector: () => document.querySelectorAll('a'),
  final: (result, externalOnly) => externalOnly
    ? result.filter(a => a.host !== location.host)
    : result
})
dom.run('links')                    // queries the DOM once, caches
dom.use('links', true)              // no DOM work; just re-runs final
dom.use('links', false)             // ditto, different projection
```

For broader patterns (counting, sibling lookup, parameterized selectors, tree-walking,
remembering a reference for later), see `references/patterns.md`. For the full API
surface, see `references/api.md`. For version-migration notes, see
`references/migration.md`.
