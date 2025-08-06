/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      // สามารถเพิ่มโดเมนอื่นๆ ที่คุณเชื่อถือได้ที่นี่
    ],
  },
};

module.exports = nextConfig;