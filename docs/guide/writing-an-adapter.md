# Writing an adapter

Adding a network to Romu means implementing a four-member contract. This is the
friendliest first contribution to the project — the generic checks (size limit,
external references, chunk leakage) already come from core's linter; you only
supply what is truly network-specific.

## The contract

```ts
import type { RomuAdapter } from "@romu/core";

export const myAdapter: RomuAdapter = {
  name: "mynetwork",          // id used in romu.config.ts
  spec,                       // the @romu/specs entry (add one if missing)
  bridge(config) { ... },     // returns the injected bridge script
  package(build) { ... },     // wraps the HTML into the delivery format
  validate(pkg) { ... },      // network-specific extra checks
};
```

## 1. Add a spec entry

Every value in `@romu/specs` must carry a **source URL and retrieval date** —
networks change their requirements silently, and the registry is only useful
if every entry is re-verifiable:

```ts
export const mynetwork: NetworkSpec = {
  network: "mynetwork",
  displayName: "My Network",
  packageFormat: "single-html",
  maxSizeBytes: 5 * 1024 * 1024,
  ctaApi: "theirSdk.open()",
  sources: [{ url: "https://…/official-spec", retrievedAt: "2026-07-19" }],
};
```

## 2. Write the bridge

The bridge is the heart: a small script injected into the HTML `<head>` that
implements `window.__ROMU_BRIDGE__`. The user's bundle is byte-identical across
networks; only this script changes.

```ts
bridge(config) {
  return `window.__ROMU_BRIDGE__ = {
    cta: function () { /* call the network's store API */ },
    onReady: function (cb) { /* fire when the container allows starting */ }
  };`;
}
```

Rules of thumb:

- Feature-detect the network SDK (`typeof theirSdk !== "undefined"`) and warn
  instead of crashing outside the container.
- Respect the network's readiness protocol (MRAID `ready` + `viewableChange`,
  dapi `ready`, …) before calling back.

## 3. Package and validate

For single-HTML networks, `package()` is usually a one-liner returning
`playable.html`. In `validate()`, add only checks the generic linter can't
know — e.g. "the CTA API string must appear in the file".

## 4. Test it

Unit-test the bridge string and validation rules (see
`packages/adapter-meta/src/index.test.ts` for the pattern), then verify a real
build against the network's official test tool and note the result in your PR.
