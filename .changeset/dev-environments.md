---
"romujs": minor
"@romujs/core": minor
"@romujs/adapter-meta": minor
"@romujs/adapter-applovin": minor
"@romujs/adapter-levelplay": minor
---

`romu dev` grows two features. **Emulated network environments**: a floating
picker (or `?network=<id>` / `--network`) runs the adapter's real production
bridge against a mock ad container — fake `mraid`/`dapi`/`FbPlayableAd` with
realistic readiness and viewability timing — so container-protocol bugs
surface in dev instead of network review. Adapters can ship such a mock via
the new optional `devMock()` contract member. **On-device testing**: the dev
server now listens on the LAN and prints a QR code in the terminal; scan it
with a phone on the same Wi-Fi, hot reload included.
