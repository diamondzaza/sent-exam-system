/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useEscape.js
 * หน้าที่ของหน้านี้: hook กด Escape เพื่อปิด modal/dropdown — ใช้ร่วมกันทุก modal
 *   ให้ behavior ตรงกันทั้งแอป (เรียก onEscape เมื่อ active เป็น true และกด Escape)
 * ผู้ใช้งาน: ทุก modal ที่เขียนเอง (ไม่ได้ใช้ Modal กลาง)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import { useEffect } from 'react';
export const useEscape = (active, onEscape) => {
    useEffect(() => {
        if (!active)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape')
                onEscape();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [active, onEscape]);
};
