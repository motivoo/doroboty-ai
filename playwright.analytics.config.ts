import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "analytics.spec.ts",
  testIgnore: [],
  outputDir: "test-results/analytics",
  reporter: [["list"], ["html", { outputFolder: "playwright-report-analytics", open: "never" }]],
  use: {
    ...base.use,
    baseURL: "https://doroboty-ai-nq8v.netlify.app",
  },
  webServer: {
    command:
      "npm exec vite build -- --mode analytics-test --outDir artifacts/analytics-dist && npm exec vite preview -- --outDir artifacts/analytics-dist --host 127.0.0.1 --port 3126 --strictPort",
    url: "http://127.0.0.1:3126",
    reuseExistingServer: false,
    env: { VITE_POSTHOG_KEY: "phc_test", VITE_POSTHOG_HOST: "https://ingest.example.test" },
  },
});
