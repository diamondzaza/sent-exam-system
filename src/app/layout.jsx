import { Prompt } from "next/font/google";
import "./globals.css";
/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: layout.jsx
 * หน้าที่ของหน้านี้: Root Layout ของแอปทั้งหมด — กำหนดภาษาไทย (lang="th"),
 *   โหลดฟอนต์ Prompt ผ่าน next/font (ใช้เป็นทั้งหัวข้อและเนื้อความ —
 *   แยกลำดับด้วย weight: 400 เนื้อความ / 500 ป้ายและปุ่ม / 600 หัวข้อและตัวเลขเด่น),
 *   ตั้งค่า metadata (title/description) และ import global styles
 * ผู้ใช้งาน: ทุกบทบาท (Teacher / AudioVisual / Operations / Admin)
 * หมายเหตุ: ไฟล์นี้เป็น Server Component — ห้ามใส่ "use client"
 * ─────────────────────────────────────────────────────────
 */
const prompt = Prompt({
    subsets: ["thai", "latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-prompt",
});
export const metadata = {
    title: "ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ คณะวิทยาศาสตร์",
    description: "ระบบบริหารจัดการและติดตามกระบวนการจัดส่ง ตรวจสอบ และพิมพ์ข้อสอบ คณะวิทยาศาสตร์ ตามข้อกำหนด URS และ ER-Diagram",
};
export default function RootLayout({ children, }) {
    return (<html lang="th">
      <body className={`${prompt.variable} antialiased`}>
        {children}
      </body>
    </html>);
}
