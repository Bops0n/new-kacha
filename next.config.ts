/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',      },
      // สามารถเพิ่มโดเมนอื่นๆ ที่คุณเชื่อถือได้ที่นี่
      {
        protocol: 'http',
        hostname: '103.91.190.65',
      },
],
  },
};


module.exports = nextConfig;