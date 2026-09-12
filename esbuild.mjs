import { build } from "esbuild";

await build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  external: ["vscode"],
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: "dist/extension.js",
  sourcemap: true,
  logLevel: "info",
});
