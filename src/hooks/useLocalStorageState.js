'use client';
/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useLocalStorageState.js
 * หน้าที่ของไฟล์นี้: hook พื้นฐานสำหรับ state ที่ persist ลง localStorage —
 *   อ่านค่าเริ่มต้นตอน mount (พร้อม validate + fallback กัน JSON เสีย),
 *   และบันทึกลง localStorage ทุกครั้งที่ค่าเปลี่ยน
 * หมายเหตุ: นี่คือ "ฝั่งจัดเก็บแบบท้องถิ่น" ชั่วคราว — เมื่อเชื่อมต่อ Supabase
 *   hook กลุ่มนี้จะถูกแทนที่ด้วย repository pattern (ดู src/lib/repositories/)
 * ─────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
/** อ่านค่าจาก localStorage อย่างปลอดภัย — JSON เสีย/ไม่ผ่าน validate จะคืน fallback */
export function loadStored(key, fallback, validate) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw)
            return fallback;
        const parsed = JSON.parse(raw);
        if (parsed === null || parsed === undefined || (validate && !validate(parsed))) {
            return fallback;
        }
        return parsed;
    }
    catch {
        return fallback;
    }
}
export function useLocalStorageState(key, fallback, validate) {
    const [value, setValue] = useState(() => loadStored(key, fallback, validate));
    // Sync to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        }
        catch {
            // localStorage อาจใช้ไม่ได้ (โหมดส่วนตัว) — ข้ามไปเฉยๆ
        }
    }, [key, value]);
    return [value, setValue];
}
