/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // For serving from FastAPI backend
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
}

module.exports = nextConfig

