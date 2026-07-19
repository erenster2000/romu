import { defineConfig } from "romujs/config";

export default defineConfig({
  store: {
    ios: "https://apps.apple.com/app/id284882215",
    android:
      "https://play.google.com/store/apps/details?id=com.example.tapgame",
  },
  networks: ["meta", "applovin", "levelplay"],
});
