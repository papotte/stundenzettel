import withMDX from '@next/mdx'
import createNextIntlPlugin from 'next-intl/plugin'

import type { NextConfig } from 'next'

const withMdx = withMDX({
  // You can add MDX-specific options here if needed
  extension: /\.mdx?$/,
})

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

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

export default withNextIntl(withMdx(nextConfig))
