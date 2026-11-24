// Language: JavaScript | Target: Next.js Configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NEXT_STATIC_EXPORT === '1' && {
    output: 'export',
    trailingSlash: true,
  }),
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
