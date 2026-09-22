// After `vite build`, list the hashed assets in the service worker so the app is fully offline
// from the first visit (the worker only controls the page after that first load).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
const assets = readdirSync("dist/assets").map((f) => `./assets/${f}`);
const list = JSON.stringify(["./", "./index.html", "./manifest.webmanifest", "./icon.svg", ...assets]);
const sw = readFileSync("dist/sw.js", "utf8").replace(/const PRECACHE = .*?\/\*__SL_ASSETS__\*\//s, `const PRECACHE = ${list};`);
writeFileSync("dist/sw.js", sw);
console.log(`service worker precaches ${assets.length + 4} files`);
