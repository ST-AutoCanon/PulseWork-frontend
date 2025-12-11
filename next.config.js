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
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // allow only this parent origin to frame the app
            value: "frame-ancestors http://localhost:1574;",
          },
          // Note: ALLOW-FROM is deprecated in many browsers; CSP frame-ancestors is the reliable mechanism.
          { key: "X-Frame-Options", value: "ALLOW-FROM http://localhost:1574" },
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
