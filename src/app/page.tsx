/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: page.tsx
 * หน้าที่ของหน้านี้: หน้าแรกของแอป — placeholder ชั่วคราว
 *   (Step 3 จะเชื่อมต่อ AppShell ซึ่งเป็นตัวจัดการ login + หน้าจอตามบทบาท)
 * ผู้ใช้งาน: ทุกบทบาท
 * ─────────────────────────────────────────────────────────
 */

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="font-display text-xl text-slate-700">
        ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ — กำลังย้ายไป Next.js
      </p>
    </div>
  );
}
