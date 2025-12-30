const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
let cssnano;
try {
  cssnano = require("cssnano");
} catch (e) {
  console.error("cssnano not installed. Run: npm i cssnano -D");
  process.exit(2);
}

const dir = path.join(process.cwd(), ".next", "static", "css");
if (!fs.existsSync(dir)) {
  console.error("css dir not found:", dir);
  process.exit(1);
}

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".css"))
  .map((f) => path.join(dir, f));
files.sort();
let combined = "";
for (const f of files) {
  combined +=
    `\n/* ---- ${path.basename(f)} ---- */\n` + fs.readFileSync(f, "utf8");
}

console.log("Concatenated", files.length, "files, length:", combined.length);

async function tryMinify(chunk) {
  try {
    await postcss([cssnano({ preset: "default" })]).process(chunk, {
      from: undefined,
    });
    return null;
  } catch (err) {
    return err;
  }
}

async function findFailingSegment(text, start = 0, end = text.length) {
  const segment = text.slice(start, end);
  const err = await tryMinify(segment);
  if (!err) return null;
  const len = end - start;
  if (len <= 1024) {
    return { start, end, err, segment };
  }
  const mid = start + Math.floor(len / 2);
  const left = await findFailingSegment(text, start, mid);
  if (left) return left;
  return await findFailingSegment(text, mid, end);
}

(async () => {
  // First, try minifying each generated CSS file individually to find any broken outputs
  for (const f of files) {
    const content = fs.readFileSync(f, "utf8");
    // include a separator to mimic concatenation boundaries
    const withSep = `\n/* ---- ${path.basename(f)} ---- */\n` + content;
    const err = await tryMinify(withSep);
    if (err) {
      const outDebugDir = path.join(process.cwd(), ".next", "debug-css");
      if (!fs.existsSync(outDebugDir))
        fs.mkdirSync(outDebugDir, { recursive: true });
      const p = path.join(outDebugDir, `failing_file_${path.basename(f)}.css`);
      fs.writeFileSync(p, withSep, "utf8");
      console.error("Minify failed on individual generated file:", f);
      console.error("Error message:", err && err.message ? err.message : err);
      if (err && err.stack) console.error("Stack:", err.stack);
      try {
        console.error(
          "Error details:",
          JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
        );
      } catch (e) {}
      console.log("Wrote failing generated file to", p);
      process.exit(4);
    }
  }

  // Next, try pairwise concatenation to detect boundary issues between two files
  for (let i = 0; i < files.length - 1; i++) {
    const a = fs.readFileSync(files[i], "utf8");
    const b = fs.readFileSync(files[i + 1], "utf8");
    const joint =
      `\n/* ---- ${path.basename(files[i])} ---- */\n` +
      a +
      `\n/* ---- ${path.basename(files[i + 1])} ---- */\n` +
      b;
    const err = await tryMinify(joint);
    if (err) {
      const outDebugDir = path.join(process.cwd(), ".next", "debug-css");
      if (!fs.existsSync(outDebugDir))
        fs.mkdirSync(outDebugDir, { recursive: true });
      const p = path.join(
        outDebugDir,
        `failing_pair_${path.basename(files[i])}__${path.basename(
          files[i + 1]
        )}.css`
      );
      fs.writeFileSync(p, joint, "utf8");
      console.error(
        "Minify failed on concatenation boundary between:",
        files[i],
        "and",
        files[i + 1]
      );
      console.error("Error message:", err && err.message ? err.message : err);
      if (err && err.stack) console.error("Stack:", err.stack);
      try {
        console.error(
          "Error details:",
          JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
        );
      } catch (e) {}
      console.log("Wrote failing pair to", p);
      process.exit(5);
    }
  }
  const initialErr = await tryMinify(combined);
  if (!initialErr) {
    console.log("Minify succeeded on combined content (unexpected)");
    process.exit(0);
  }
  console.error("Minify error:");
  console.error(
    initialErr && initialErr.message ? initialErr.message : initialErr
  );

  const outDebugDir = path.join(process.cwd(), ".next", "debug-css");
  if (!fs.existsSync(outDebugDir))
    fs.mkdirSync(outDebugDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDebugDir, "combined.premin.css"),
    combined,
    "utf8"
  );

  const found = await findFailingSegment(combined, 0, combined.length);
  if (!found) {
    console.error("Could not isolate failing segment");
    process.exit(3);
  }

  const segPath = path.join(
    outDebugDir,
    `failing_segment_${found.start}_${found.end}.css`
  );
  fs.writeFileSync(segPath, found.segment, "utf8");
  console.log("Wrote failing segment to", segPath);

  const lines = found.segment.split(/\r?\n/);
  const startLine = Math.max(0, Math.floor(lines.length / 2) - 10);
  const endLine = Math.min(lines.length, startLine + 40);
  console.log("Context lines (approx):");
  for (let i = startLine; i < endLine; i++)
    console.log((i + 1).toString().padStart(4) + ": " + lines[i]);

  process.exit(3);
})();
