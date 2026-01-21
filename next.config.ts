import withMDX from '@next/mdx'

import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

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
