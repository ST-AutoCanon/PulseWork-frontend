// next.config.js
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

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
        // ensure encoding resolves (we installed it above)
        encoding: require.resolve("encoding"),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
