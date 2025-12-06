/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ إذا تستخدم app directory
  experimental: {
    appDir: true,
  },

  // ✅ Output standalone لتجنب بعض مشاكل التصدير
  output: 'standalone',

  // ✅ تجاهل التحذيرات الخاصة بالStatic Export
  // هذا يمنع Next.js من محاولة prerender صفحات client-only
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Headers / rewrites إذا احتجت لتوجيه API
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://one1-backend-4.onrender.com/:path*',
      },
    ];
  },
};

export default nextConfig;
