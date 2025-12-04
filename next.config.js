/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => { // for starknet-devnet library
    config.resolve.fallback = {
      fs: false,
      net: false,
      child_process: false,
    }
    return config;
  },
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
}

module.exports = nextConfig
