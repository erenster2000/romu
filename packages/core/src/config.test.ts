import { describe, expect, it } from "vitest";
import { configSchema } from "./config.js";

const valid = {
  store: {
    ios: "https://apps.apple.com/app/id123",
    android: "https://play.google.com/store/apps/details?id=com.x",
  },
  networks: ["meta"],
};

describe("configSchema", () => {
  it("accepts a minimal valid config", () => {
    expect(configSchema.parse(valid)).toEqual(valid);
  });

  it("rejects store links that are not URLs", () => {
    const result = configSchema.safeParse({
      ...valid,
      store: { ...valid.store, ios: "id123" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty network list", () => {
    const result = configSchema.safeParse({ ...valid, networks: [] });
    expect(result.success).toBe(false);
  });
});
