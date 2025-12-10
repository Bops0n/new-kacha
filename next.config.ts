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
<<<<<<< HEAD
        hostname: 'placehold.co',      },
      // สามารถเพิ่มโดเมนอื่นๆ ที่คุณเชื่อถือได้ที่นี่
      {
        protocol: 'http',
        hostname: '103.91.190.65',
      },
],
=======
        hostname: 'placehold.co',
      }
    ],
>>>>>>> 578dcc58a5927266ff37bcf035644de317697be4
  },
};

module.exports = nextConfig;