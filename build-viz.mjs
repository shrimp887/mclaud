import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["node_modules/@aduh95/viz.js/dist/render.browser.js"],
  bundle: true,
  format: "iife",
  outfile: "public/viz.js",
});

