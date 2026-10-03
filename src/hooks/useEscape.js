/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useEscape.js
 * หน้าที่ของหน้านี้: hooks สำหรับ modal/dropdown —
 *   useEscape(active, onEscape)        : กด Escape เรียก onEscape (ปิด modal)
 *   useDialogA11y({active, onClose})   : ครบชุดสำหรับ modal — Escape ปิด,
 *     ย้ายโฟกัสเข้าองค์ประกอบแรกเมื่อเปิด, กัก Tab ให้อยู่ใน modal (focus trap)
 *     ใช้คืนค่า ref ไปผูกกับ div ครอบ modal
 * ผู้ใช้งาน: ทุก modal ที่เขียนเอง (ไม่ได้ใช้ Modal กลาง)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import { useEffect, useRef } from 'react';
const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
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
export const useDialogA11y = ({ active, onClose }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (!active)
            return;
        // Escape ปิด modal
        const onKey = (e) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            // Focus trap — กัก Tab ให้วนใน modal เท่านั้น
            if (e.key === 'Tab' && ref.current) {
                const focusables = ref.current.querySelectorAll(FOCUSABLE);
                if (!focusables.length)
                    return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
                else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        window.addEventListener('keydown', onKey);
        // เปิด modal → ย้ายโฟกัสเข้าองค์ประกอบแรกที่โฟกัสได้
        const focusTimer = setTimeout(() => {
            ref.current?.querySelector(FOCUSABLE)?.focus();
        }, 60);
        return () => {
            window.removeEventListener('keydown', onKey);
            clearTimeout(focusTimer);
        };
    }, [active, onClose]);
    return ref;
};
