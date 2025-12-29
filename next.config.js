/** @type {import('next').NextConfig} */
const nextConfig = {
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
    }
    return config;
  },
};

module.exports = nextConfig;
