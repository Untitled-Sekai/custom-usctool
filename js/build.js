/* eslint-disable @typescript-eslint/no-var-requires */

const esbuild = require("esbuild")
const swc = require("@swc/core")
const fs = require("fs")
;(async () => {
  const esbuildResult = await esbuild.build({
    entryPoints: ["src/bin/index.ts"],
    bundle: true,

    platform: "browser",
    // outfile: "../crates/lib/src/usctool.js",
    write: false,
    format: "iife",
    globalName: "usctool",
    // minify: true,
  })
  await fs.promises.writeFile(
    "../crates/lib/src/usctool.js",
    // swcResult.code,
    esbuildResult.outputFiles[0].text,
    "utf-8"
  )
})()
