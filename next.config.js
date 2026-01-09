/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },

    allowedDevOrigins: [
      "http://192.168.1.244:3000",
      "http://localhost:3000",
      "http://0.0.0.0:3000",
    ],
  },
};

module.exports = nextConfig;
