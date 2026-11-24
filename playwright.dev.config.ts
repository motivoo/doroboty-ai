import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "readiness.spec.ts",
  outputDir: "test-results/dev",
  reporter: [["list"], ["html", { outputFolder: "playwright-report-dev", open: "never" }]],
  use: { ...base.use, baseURL: "http://127.0.0.1:3118" },
  webServer: {
    command: "npm run dev -- --port 3118",
    url: "http://127.0.0.1:3118",
    reuseExistingServer: false,
  },
});
