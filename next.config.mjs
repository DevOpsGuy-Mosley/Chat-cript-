/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour la production
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Optimisations
  experimental: {
    optimizeCss: true,
  },
  
  // Configuration des images
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
  },
  
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Configuration pour le développement uniquement
  ...(process.env.NODE_ENV === 'development' && {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
  }),
}

export default nextConfig
