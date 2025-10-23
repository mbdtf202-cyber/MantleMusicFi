/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
  },
  webpack: (config, { isServer }) => {
    // Enhanced fallback configuration for Web3 modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
      'lokijs': false,
      'encoding': false,
    };
    
    // Ignore problematic modules in browser environment
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@react-native-async-storage/async-storage': 'commonjs @react-native-async-storage/async-storage',
        'pino-pretty': 'commonjs pino-pretty',
        'lokijs': 'commonjs lokijs',
        'encoding': 'commonjs encoding',
      });
    }

    // Handle ES modules properly
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Optimize for WalletConnect and Web3 libraries
    config.optimization = {
      ...config.optimization,
      providedExports: false,
      usedExports: false,
    };
    
    return config;
  },
  transpilePackages: [
    '@walletconnect/core',
    '@walletconnect/sign-client',
    '@walletconnect/utils',
    '@walletconnect/keyvaluestorage',
    '@reown/appkit',
    '@reown/appkit-controllers',
  ],
  experimental: {
    esmExternals: 'loose',
  },
};

module.exports = nextConfig;