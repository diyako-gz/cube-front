
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "cube",
  description: "مدیریت زبان‌آموزان، جلسه‌ها، شهریه و درآمد برای معلم‌ها و مربی‌ها",
  applicationName: "cube",
  appleWebApp: { capable: true, title: "cube", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#060914",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeInit = `(function(){try{var t=localStorage.getItem('daftar_theme');if(t!=='light')document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body className="font-sans antialiased" style={{ fontFamily: "iranyekan" }}>
        <PwaRegister />
        <div className="aurora" aria-hidden>
          <i /><i /><i />
        </div>
        {children}
      </body>
    </html>
  );
}
