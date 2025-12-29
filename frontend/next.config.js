/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    NEXT_PUBLIC_DEFAULT_BARBER_SLUG: process.env.NEXT_PUBLIC_DEFAULT_BARBER_SLUG || 'your-slug',
    NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN || 'thesignaturechair.com',
  },
};

module.exports = nextConfig;
