import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: {
    command:
      "pnpm --filter @bunkbuddy/web preview --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
  },
});
