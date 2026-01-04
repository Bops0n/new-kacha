// app/layout.tsx
import './globals.css';
import { Sarabun } from 'next/font/google'; // นำเข้าฟอนต์ Kanit
import AlertProvider from './providers/AlertProviders';
import { WebsiteSettingsProvider } from './providers/WebsiteSettingProvider';
import NextAuthSessionProvider from './providers/AuthProviders';

// กำหนด subset สำหรับภาษาไทยและน้ำหนักฟอนต์ที่คุณต้องการ
// preload: true จะช่วยให้โหลดฟอนต์ได้เร็วขึ้นสำหรับภาษาไทย
const sarabun = Sarabun({
  subsets: ['thai'],
  weight: ['300', '400', '500', '700'], // เลือกน้ำหนักฟอนต์ที่คุณจะใช้
  variable: '--font-kanit', // กำหนด CSS variable เพื่อใช้อ้างอิงใน Tailwind CSS
  display: 'swap', // แนะนำให้ใช้ 'swap' เพื่อการแสดงผลที่ดีขึ้น
});
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    // <html lang="th" data-theme="light" className={``}>
    <html lang="th" data-theme="light" className={`${sarabun.variable}`}>
      <head></head>
      <NextAuthSessionProvider>
        <body>
          <WebsiteSettingsProvider>
            <AlertProvider>
              {children}
            </AlertProvider>
          </WebsiteSettingsProvider>
        </body>
      </NextAuthSessionProvider>
    </html>
  );
}