/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.com',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude puppeteer from webpack bundling
      config.externals = [
        ...(config.externals || []),
        'puppeteer',
        'puppeteer-extra',
        'puppeteer-extra-plugin-stealth',
      ];
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer',
      'puppeteer-extra',
      'puppeteer-extra-plugin-stealth',
    ],
  },
};

export default nextConfig;
