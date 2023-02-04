"use strict";

const _cache = (await import("persistent-cache")).default();

const defaultWKObject = {
  head: "",
  tail: "",
  security_patches: [],
  unmarked_patches: [],
  gaps: [],
};

let wk =
  _cache.getSync("wk") ??
  (_cache.putSync("wk", defaultWKObject), defaultWKObject);

export const Cache = new Proxy(wk, {
  get(_, prop, __) {
    return wk[prop];
  },
  set(_, prop, value, __) {
    wk[prop] = value;
    _cache.putSync("wk", wk);
    return true;
  },
});
