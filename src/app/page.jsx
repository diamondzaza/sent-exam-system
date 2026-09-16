'use client';
/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: page.jsx
 * หน้าที่ของหน้านี้: หน้าแรกของแอป — หน้าจอหลักทั้งหมดของระบบ (AppShell)
 * ผู้ใช้งาน: ทุกบทบาท (Teacher / AudioVisual / Operations / Admin)
 * หมายเหตุ: ใช้ mounted guard เพื่อรอจนฝั่ง client พร้อมก่อนเรนเดอร์ AppShell
 *   เพราะ AppShell อ่านค่าเริ่มต้นจาก localStorage ตอน mount (SSR ไม่มี localStorage)
 * ─────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
export default function Home() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted)
        return null;
    return <AppShell />;
}
