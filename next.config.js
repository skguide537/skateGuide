const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Skip prerendering API routes during build (they need runtime DB)
  skipTrailingSlashRedirect: true,
  
  // Performance optimizations
  experimental: {
    // Temporarily disabled optimizeCss due to critters dependency issue
    // optimizeCss: true,
    optimizePackageImports: ['@mui/icons-material', 'leaflet'],
    webpackBuildWorker: true, // Use separate process for webpack builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24 hours
  },
  
  // Compression and caching
  compress: true,
  poweredByHeader: false,
  
  // Build optimizations
  swcMinify: true,
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Development optimizations for faster compilation
    if (dev) {
      // Disable heavy optimizations in dev
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        minimize: false, // Don't minify in dev
        sideEffects: false, // Skip side effects analysis
      };
      
      // Faster module resolution
      config.resolve = {
        ...config.resolve,
        symlinks: false,
        cacheWithContext: false,
        // Reduce module resolution attempts
        modules: ['node_modules'],
        extensions: ['.tsx', '.ts', '.jsx', '.js'], // Only essential extensions
      };
      
      // Skip expensive loaders in dev
      config.module = {
        ...config.module,
        rules: [
          ...config.module.rules,
          {
            test: /\.(png|jpe?g|gif|svg)$/,
            type: 'asset/resource',
            generator: {
              filename: 'static/media/[name].[hash][ext]'
            }
          }
        ]
      };
    }

    // Production optimizations
    if (!dev && !isServer) {
      // Removed problematic MUI styled engine alias that was causing build issues
      
      // Optimize bundle splitting for production
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            mui: {
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              name: 'mui',
              chunks: 'all',
              priority: 20,
            },
            leaflet: {
              test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
              name: 'leaflet',
              chunks: 'all',
              priority: 20,
            },
                              // Removed carousel chunk - no longer using react-material-ui-carousel
          },
        },
      };
    }
    
    // General optimizations - removed carousel alias as we no longer use it
    
    return config;
  },
}

module.exports = withBundleAnalyzer(nextConfig); 