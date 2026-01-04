/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',      },
      // สามารถเพิ่มโดเมนอื่นๆ ที่คุณเชื่อถือได้ที่นี่
      {
        protocol: 'http',
        hostname: '103.91.190.65',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080'
      }
      
],
  },
};

module.exports = nextConfig;