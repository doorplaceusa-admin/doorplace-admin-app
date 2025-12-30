/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // increase upload limit (fixes receipt upload error)
    },
  },

  // Fix local network access warning (192.168.x.x)
  allowedDevOrigins: ["192.168.1.244:3000"],
};

module.exports = nextConfig;
