#!/usr/bin/env node
// Committed shim so the bin link exists before dist/ is built (pnpm refuses
// to link a bin to a missing file, which breaks fresh monorepo installs).
import("../dist/index.js");
