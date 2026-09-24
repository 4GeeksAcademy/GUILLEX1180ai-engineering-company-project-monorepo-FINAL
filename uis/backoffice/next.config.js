/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // ── Proxy: redirige /api/v1/* al backend ──
  // En Docker usa el nombre del servicio ("backend"); fuera de Docker, localhost.
  async rewrites() {
    const backendHost =
      process.env.BACKEND_HOST || "localhost";
    return [
      {
        source: "/api/v1/:path*",
        destination: `http://${backendHost}:8001/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;