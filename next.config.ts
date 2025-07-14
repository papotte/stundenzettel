import withMDX from '@next/mdx'

import type { NextConfig } from 'next'

const withMdx = withMDX({
  // You can add MDX-specific options here if needed
  extension: /\.mdx?$/,
})

const nextConfig: NextConfig = {
  transpilePackages: ['lucide-react'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default withMdx(nextConfig)
