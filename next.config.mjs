/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // اختياري لتشغيل على Vercel أو Docker
  eslint: { ignoreDuringBuilds: true },
  // لا تستخدم experimental.appDir إذا لا تحتاجه
};

export default nextConfig;
