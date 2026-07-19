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
  network: string;
  /** How the network expects the playable to be delivered. */
  packageFormat: "single-html" | "zip";
  /** Hard size limit of the delivered package, in bytes. */
  maxSizeBytes: number;
  /** The API the playable must call to send the user to the store. */
  ctaApi: string;
  sources: SpecSource[];
}

/**
 * Placeholder entry — real, source-verified values land in phase 2.
 * See ROADMAP.md.
 */
export const meta: NetworkSpec = {
  network: "meta",
  packageFormat: "single-html",
  maxSizeBytes: 2 * 1024 * 1024,
  ctaApi: "FbPlayableAd.onCTAClick()",
  sources: [
    {
      url: "https://developers.facebook.com/docs/app-ads/formats/playable-ad",
      retrievedAt: "2026-07-19",
    },
  ],
};

export const specs: Record<string, NetworkSpec> = { meta };
