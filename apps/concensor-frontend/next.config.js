/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Fix for monorepo workspace warning
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  // Configure webpack to handle SVG imports as static URLs
  webpack(config) {
    // Find and modify the existing file loader rule
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
    );

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    // Add new rule for SVG files as static assets
    config.module.rules.push({
      test: /\.svg$/i,
      type: 'asset/resource',
    });

    return config;
  },
}

module.exports = nextConfig

