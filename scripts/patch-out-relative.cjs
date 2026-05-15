/**
 * Rewrites absolute `/_next/` asset URLs in `out/` to relative `./_next/` so the export works when:
 * - opening `out/index.html` via file://, or
 * - hosting under a path without setting NEXT_PUBLIC_BASE_PATH.
 *
 * Run after `next build` (see npm script `build:relative`).
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(process.cwd(), "out");

function walkFiles(dir, onFile) {
  if (!fs.existsSync(dir)) {
    console.error("Missing folder:", dir);
    process.exit(1);
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(p, onFile);
    else onFile(p);
  }
}

const EXT = new Set([".html", ".js", ".css", ".map", ".txt"]);

function patchContent(s) {
  let out = s;
  out = out.replace(/r\.p="\/_next\/"/g, 'r.p="./_next/"');
  out = out.replace(/:HL\[\\"\/_next\//g, ':HL[\\"./_next/');
  out = out.replace(/"\/_next\//g, '"./_next/');
  out = out.replace(/'\/_next\//g, "'./_next/");
  out = out.replace(/url\(\/_next\//g, "url(./_next/");
  return out;
}

let patched = 0;
walkFiles(OUT, (filePath) => {
  if (!EXT.has(path.extname(filePath))) return;
  const before = fs.readFileSync(filePath, "utf8");
  const after = patchContent(before);
  if (after !== before) {
    fs.writeFileSync(filePath, after);
    patched++;
    console.log("patched", path.relative(process.cwd(), filePath));
  }
});

console.log(`patch-out-relative: updated ${patched} file(s) under out/`);
