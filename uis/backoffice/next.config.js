/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // ── Proxy: redirige /api/v1/* al backend ──
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:8001/api/v1/:path*",
      },
    ];
  },
};

module.exports = nextConfig;