// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5001/:path*", // proxy to backend
      },
      {
        source: "/login",
        destination: "http://localhost:5001/login",
      },
      {
        source: "/me",
        destination: "http://localhost:5001/me",
      },
      // add other proxies if you call top-level endpoints directly
    ];
  },
};
