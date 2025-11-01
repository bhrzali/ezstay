/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Export static files by default (for CLI builds and Azure Static Web Apps)
  // For Docker builds, this can be overridden with NEXT_STANDALONE=true
  ...(process.env.NEXT_STANDALONE === 'true' 
    ? { output: 'standalone' } 
    : { output: 'export' }
  ),
}

module.exports = nextConfig

