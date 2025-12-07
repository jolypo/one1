/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ السماح بالصور من Backend
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'one1-backend-4.onrender.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
      },
    ],
  },

  // ✅ إعدادات Build
  reactStrictMode: true,

  // ✅ Environment Variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
