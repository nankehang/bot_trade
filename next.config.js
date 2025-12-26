/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.binance.com',
      },
      {
        protocol: 'https',
        hostname: 'www.okx.com',
      },
      {
        protocol: 'https',
        hostname: 'www.bybit.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://ltcusdt.com',
    NEXT_PUBLIC_GA_ID: 'G-93DTWQDHKQ'
  },
}

module.exports = nextConfig
