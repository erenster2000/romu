/**
 * The spec registry: machine-readable facts about each ad network's playable
 * requirements. Consumed by adapters and the spec linter.
 *
 * Values carry sources with retrieval dates — networks change specs silently,
 * so every entry must be traceable and re-verifiable.
 */

export interface SpecSource {
  url: string;
  /** ISO date the value was last verified against the source. */
  retrievedAt: string;
}

export interface NetworkSpec {
  /** Stable id used in romu.config.ts and --network flags. */
  network: string;
  displayName: string;
  /** How the network expects the playable to be delivered. */
  packageFormat: "single-html" | "zip";
  /** Hard size limit of the delivered package, in bytes. */
  maxSizeBytes: number;
  /** The API the playable must call to send the user to the store. */
  ctaApi: string;
  /** The network's official preview/test tool, when it has one. */
  testTool?: string;
  /** Requirements that don't fit the structured fields (yet). */
  notes?: string[];
  sources: SpecSource[];
}

export const meta: NetworkSpec = {
  network: "meta",
  displayName: "Meta (Facebook/Instagram)",
  packageFormat: "single-html",
  // Was 2 MB for years (many guides still say so); Meta's help page now says 5 MB.
  maxSizeBytes: 5 * 1024 * 1024,
  ctaApi: "FbPlayableAd.onCTAClick()",
  notes: [
    "A ZIP ending in index.html is also accepted; Romu ships the single-HTML form",
    "All assets must be embedded as data URIs; external network calls (e.g. XMLHttpRequest) are forbidden",
    "Must work without mraid.js or similar frameworks",
    "Build vertically and stay responsive across resolutions",
    "FbPlayableAd.onCTAClick() is strongly recommended (not strictly required)",
    "JavaScript redirects are not allowed",
  ],
  sources: [
    {
      url: "https://www.facebook.com/business/help/412951382532338",
      retrievedAt: "2026-07-19",
    },
  ],
};

export const applovin: NetworkSpec = {
  network: "applovin",
  displayName: "AppLovin",
  packageFormat: "single-html",
  maxSizeBytes: 5 * 1024 * 1024,
  ctaApi: "mraid.open(storeUrl)",
  testTool: "https://p.applov.in/playablePreview?create=1",
  notes: [
    "Must support MRAID v2.0; wait for the mraid ready event before touching the DOM",
    "Single inline HTML file; no external references (base64-encode images)",
    "Must support both portrait and landscape",
    "No auto-play audio before the first user interaction",
    "Do not add your own close button — AppLovin supplies it",
  ],
  sources: [
    {
      url: "https://support.applovin.com/en/growth/promoting-your-apps/welcome-to-applovin/creative-specs-and-guidelines",
      retrievedAt: "2026-07-19",
    },
  ],
};

export const levelplay: NetworkSpec = {
  network: "levelplay",
  displayName: "Unity LevelPlay (ironSource)",
  packageFormat: "single-html",
  maxSizeBytes: 5 * 1024 * 1024,
  ctaApi: "dapi.openStoreUrl()",
  testTool: "https://demos.ironsrc.com/test-tool/",
  notes: [
    "Uses the dapi protocol: wait for dapi ready + viewableChange before starting",
    "Store clicks must go through dapi.openStoreUrl() (destination configured by the network)",
    "Respect audioVolumeChange events (mute when the container reports volume 0)",
  ],
  sources: [
    {
      url: "https://2dkit.com/playable-ads/create-ironsource-playable-ads-tutorial/",
      retrievedAt: "2026-07-19",
    },
    {
      url: "https://demos.ironsrc.com/test-tool/",
      retrievedAt: "2026-07-19",
    },
  ],
};

export const specs: Record<string, NetworkSpec> = { meta, applovin, levelplay };
