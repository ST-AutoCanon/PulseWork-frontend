const fs = require("fs");
const path = require("path");

const postcss = require("postcss");

function walk(dir) {
  const entries = fs.readdirSync(dir);
  for (const e of entries) {
    const p = path.join(dir, e);
    try {
      const st = fs.statSync(p);
      if (st.isDirectory()) {
        if (e === "node_modules" || e === ".next" || e === "build") continue;
        walk(p);
      } else if (p.endsWith(".css")) {
        const css = fs.readFileSync(p, "utf8");
        try {
          postcss.parse(css, { from: p });
          console.log("OK", p);
        } catch (err) {
          console.error("ERROR parsing", p);
          console.error(err && err.message ? err.message : err);
          process.exitCode = 2;
        }
      }
    } catch (err) {
      // ignore
    }
  }
}

walk(process.cwd());

if (process.exitCode === 2) process.exit(2);

console.log("Done");
