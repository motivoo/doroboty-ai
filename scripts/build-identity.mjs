import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export function buildIdentity(root, publicConfiguration = {}) {
  const files = [
    "index.html",
    "package.json",
    "package-lock.json",
    "tokens.css",
    "vite.config.ts",
    "tsconfig.json",
    "scripts/build-identity.mjs",
  ];
  function visit(folder) {
    for (const entry of fs.readdirSync(path.join(root, folder), { withFileTypes: true })) {
      const file = `${folder}/${entry.name}`;
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) files.push(file);
    }
  }
  visit("src");
  visit("public");
  const hash = createHash("sha256");
  for (const file of files.sort())
    hash
      .update(file + "\0")
      .update(fs.readFileSync(path.join(root, file)))
      .update("\0");
  for (const key of Object.keys(publicConfiguration).sort())
    hash.update(key + "\0" + publicConfiguration[key] + "\0");
  return {
    id: `sha256:${hash.digest("hex")}`,
    version: JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version,
  };
}
