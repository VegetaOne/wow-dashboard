/** @type {import('next').NextConfig} */
const nextConfig = {
  // Für src/instrumentation.ts (Einrichtungscode beim Start). In Next 14 noch
  // hinter diesem Schalter; ab 15 fällt er weg.
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "render.worldofwarcraft.com",
      },
      {
        protocol: "https",
        hostname: "wow.zamimg.com",
      },
    ],
  },
}

module.exports = nextConfig
