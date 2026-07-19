import { defineConfig } from "romujs/config";

export default defineConfig({
  store: {
    // Replace with your app's real store pages before building.
    ios: "https://apps.apple.com/app/id000000000",
    android: "https://play.google.com/store/apps/details?id=com.example.app",
  },
  networks: ["meta", "applovin", "levelplay"],
});
