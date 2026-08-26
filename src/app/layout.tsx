import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

// ฟอนต์ไทย — SF Pro/Inter ไม่มี glyph ภาษาไทย ตัวนี้รับช่วงต่อจากสแตก Latin ใน globals.css
// 500 (Medium) มีไว้ให้เมนูนำทางโดยเฉพาะ — บนพื้นดำ น้ำหนัก 400 บางจนดูจาง ส่วน 600 หนาจนแย่ง
// ความสนใจไปจากปุ่ม CTA สีแดง ส่วน 700 คือน้ำหนักของหัวข้อใหญ่ในแบนเนอร์
const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "สมัครเป็นร้านค้าพาร์ทเนอร์ | SG PLUS Partner",
    template: "%s | SG PLUS Partner",
  },
  description:
    "สมัครเป็นร้านค้าพาร์ทเนอร์กับ SG PLUS กรอกใบสมัครออนไลน์ใน 2–3 นาที ไม่มีค่าสมัคร ทีมงานตรวจสอบและติดต่อกลับภายใน 3 วันทำการ",
  openGraph: {
    title: "สมัครเป็นร้านค้าพาร์ทเนอร์ | SG PLUS Partner",
    description:
      "กรอกใบสมัครออนไลน์ใน 2–3 นาที ไม่มีค่าสมัคร ติดตามสถานะได้ด้วยตัวเอง",
    locale: "th_TH",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#161617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ตัวแปรฟอนต์ต้องอยู่บน <html> เพราะ :root ใน globals.css อ้างถึงมันก่อนที่ <body> จะมีตัวตน
    <html lang="th" className={plexThai.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
