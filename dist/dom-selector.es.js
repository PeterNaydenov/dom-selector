//#region src/main.js
function e() {
	let e = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Map();
	function n(t) {
		let { name: n, selector: r, where: i, direction: a, final: o } = t;
		return !n || !r || !(r instanceof Function) ? !1 : (i ||= ({ item: e }) => e, o ||= (e) => e, a ||= "none", e.set(n, {
			name: n,
			selector: r,
			where: i,
			direction: a,
			final: o
		}), !0);
	}
	function* r(e, t = !1) {
		if (yield e, t) return;
		let n = e.parentElement;
		n.tagName === "BODY" && (t = !0), yield* r(n, t);
	}
	function* i(e) {
		yield e;
		let t = e.children;
		if (t.length !== 0) for (let e of t) yield* i(e);
	}
	function a(e) {
		return e instanceof NodeList || e instanceof HTMLCollection ? Array.from(e) : e instanceof Array ? e : e == null ? [] : [e];
	}
	function o(e, t, n, ...o) {
		let s = t !== "none", c = n instanceof Function, l = [], u = Symbol("end___"), d = a(e);
		if (d.length === 0) return l;
		if (s && (d = d.reduce((e, n) => (n instanceof HTMLElement && (t === "up" ? e.push(...r(n)) : t === "down" && e.push(...i(n))), e), [])), c) {
			let e = 0;
			for (let t of d) {
				let s = n({
					item: t,
					i: e,
					END: u,
					length: l.length,
					down: i,
					up: r
				}, ...o);
				if (e++, s === u) break;
				s && l.push(...a(s));
			}
		}
		return l;
	}
	function s(r, ...i) {
		if (typeof r != "string" && !n(r)) return [];
		let a = e.get(r);
		if (a == null) return [];
		let { name: s, selector: c, direction: l, where: u, final: d } = a, f = o(c(...i), l, u, ...i);
		return t.set(r, f), d(f, ...i);
	}
	function c(n, ...r) {
		let i = t.get(n);
		if (i == null) return [];
		let { final: a } = e.get(n);
		return a(i, ...r);
	}
	function l(e, n) {
		if (n?.length) {
			t.set(e, n);
			return;
		}
		t.set(e, [n]);
	}
	return {
		define: n,
		remember: l,
		run: s,
		use: c
	};
}
//#endregion
export { e as default };
