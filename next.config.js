/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: ['aigc-files.bigmodel.cn'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://partner.googleadservices.com https://www.google-analytics.com https://www.googletagservices.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' data: https: blob: https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net;
              font-src 'self' https://fonts.gstatic.com;
              frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com;
              connect-src 'self' https://open.bigmodel.cn https://*.google.com https://*.doubleclick.net https://*.googlesyndication.com https://adservice.google.com https://*.adtrafficquality.google;
              media-src 'self' https://aigc-files.bigmodel.cn;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
