import { Anuphan, Sarabun } from "next/font/google";
import "./globals.css";
/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: layout.jsx
 * หน้าที่ของหน้านี้: Root Layout ของแอปทั้งหมด — กำหนดภาษาไทย (lang="th"),
 *   โหลดฟอนต์ Anuphan (หัวข้อ) และ Sarabun (เนื้อหา) ผ่าน next/font,
 *   ตั้งค่า metadata (title/description) และ import global styles
 * ผู้ใช้งาน: ทุกบทบาท (Teacher / AudioVisual / Operations / Admin)
 * หมายเหตุ: ไฟล์นี้เป็น Server Component — ห้ามใส่ "use client"
 * ─────────────────────────────────────────────────────────
 */
const sarabun = Sarabun({
    subsets: ["thai", "latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-sarabun",
});
const anuphan = Anuphan({
    subsets: ["thai", "latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-anuphan",
});
export const metadata = {
    title: "ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ คณะวิทยาศาสตร์",
    description: "ระบบบริหารจัดการและติดตามกระบวนการจัดส่ง ตรวจสอบ และพิมพ์ข้อสอบ คณะวิทยาศาสตร์ ตามข้อกำหนด URS และ ER-Diagram",
};
export default function RootLayout({ children, }) {
    return (<html lang="th">
      <body className={`${sarabun.variable} ${anuphan.variable} antialiased`}>
        {children}
      </body>
    </html>);
}
