/* eslint-disable @typescript-eslint/no-unused-vars */
const API_URL = "http://127.0.0.1:2082/_/";
const APP_URL = "dad.zuzcdn.net";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
const path = require("path");

const buildConf = () => {

const [ d, distDir, bistDir ] = process.argv.find(v => v.indexOf('dir=') > -1).split("=")

return `import type { NextConfig } from "next";
import path from "path";
const nextConfig: NextConfig = {

  async rewrites(){
    return [
      { source: "/_/:method*/:action*", destination: "${API_URL}:method*/:action*" },
      { source: "/_/:method*", destination: "${API_URL}:method*" }
    ]
  },
  typedRoutes: false,
  distDir: "${bistDir || distDir || `.next`}",
  cleanDistDir: true,
  poweredByHeader: false,
  images: {
    loader: 'custom',
    loaderFile: './imgloader.ts',
    remotePatterns: [
        {
            protocol: "https",
            hostname: "*"
        }
    ]
  },
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
    reactRemoveProperties: true,
  },

  // Experimental TypeScript features
  experimental: {
    
    
    // Enable server actions
    serverActions: {
      bodySizeLimit: '1mb',
      allowedOrigins: ['*']
    },
  },

  // Performance and build optimizations
  productionBrowserSourceMaps: false,
  reactStrictMode: false,
  typescript: { ignoreBuildErrors: true },
  allowedDevOrigins: ['${APP_URL}','127.0.0.1','192.168.100.4'],
  webpack: (config) => {

    config.resolve.fallback = {
      ...config.resolve.fallback,  
      fs: false,
      path: false,
      url: false
    };
    return config;
  },

};

export default nextConfig;`;
}

fs.writeFileSync(
    `./next.config.ts`,
    buildConf(),
    {
        encoding:'utf8',
        flag:'w'
    }
)