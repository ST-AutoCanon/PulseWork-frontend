/** @type {import('next').NextConfig} */
const nextConfig = {
  // (temporarily removed optimization overrides)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5001/:path*",
      },
      {
        source: "/login",
        destination: "http://localhost:5001/login",
      },
      {
        source: "/me",
        destination: "http://localhost:5001/me",
      },
    ];
  },

  async headers() {
    const raw = process.env.NEXT_PUBLIC_ALLOWED_IFRAME_ORIGINS || "";
    const origins = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const frameAncestorsValue = origins.length
      ? `${origins.join(" ")}`
      : "none";

    const cspValue = `frame-ancestors ${frameAncestorsValue};`;

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspValue,
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
        encoding: require.resolve("encoding"),
      };
      const { Compilation } = require("webpack");
      config.plugins = config.plugins || [];
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.thisCompilation.tap("DumpCssPlugin", (compilation) => {
            const stage = Compilation.PROCESS_ASSETS_STAGE_ADDITIONS || 0;
            compilation.hooks.processAssets.tap(
              { name: "DumpCssPlugin", stage },
              (assets) => {
                try {
                  const fs = require("fs");
                  const path = require("path");
                  const outDir =
                    compiler.options &&
                    compiler.options.output &&
                    compiler.options.output.path
                      ? compiler.options.output.path
                      : path.join(process.cwd(), ".next");
                  const debugDir = path.join(outDir, "debug-css");
                  if (!fs.existsSync(debugDir))
                    fs.mkdirSync(debugDir, { recursive: true });
                  for (const name of Object.keys(assets)) {
                    if (name.endsWith(".css")) {
                      const src = assets[name].source();
                      fs.writeFileSync(
                        path.join(debugDir, name + ".premin.css"),
                        src
                      );
                    }
                  }
                } catch (e) {}
              }
            );
          });
        },
      });
    }
    return config;
  },
};

module.exports = nextConfig;
