import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { buildIdentity } from "./scripts/build-identity.mjs";

const identity = buildIdentity(fileURLToPath(new URL(".", import.meta.url)));

export default defineConfig({
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
});
