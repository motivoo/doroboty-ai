import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { buildIdentity } from "./scripts/build-identity.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "VITE_POSTHOG_");
  const identity = buildIdentity(root, {
    posthogKey: env.VITE_POSTHOG_KEY ?? "",
    posthogHost: env.VITE_POSTHOG_HOST ?? "",
  });
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "build-identity",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "build-meta.json",
            source: JSON.stringify(identity) + "\n",
          });
        },
      },
    ],
    define: { __APP_BUILD__: JSON.stringify(identity.id) },
    base: "./",
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  };
});
