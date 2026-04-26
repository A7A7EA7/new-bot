import { build } from "esbuild";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await rm(path.resolve(__dirname, "index.js"), { force: true });
await rm(path.resolve(__dirname, "index.js.map"), { force: true });

await build({
  entryPoints: [path.resolve(__dirname, "src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: path.resolve(__dirname, "index.js"),
  sourcemap: false,
  logLevel: "info",
  external: ["better-sqlite3"],
});

console.log("Built index.js");
