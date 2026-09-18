'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useCurrentUser.js
 * หน้าที่ของไฟล์นี้: hook เก็บโปรไฟล์ผู้ใช้ที่ล็อกอินอยู่ —
 *   เก็บใน sessionStorage (แยกต่อแท็บ, ปิดแท็บ = หาย) ไม่ใช่ localStorage
 *   AppShell จะดึงโปรไฟล์จริงจากตาราง users ทุกครั้งที่มี session
 * ─────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';

const KEY = 'sci_exam_curr_user';

export function useCurrentUser() {
    const [currentUser, setCurrentUser] = useState(() => {
        if (typeof window === 'undefined')
            return null;
        try {
            const raw = window.sessionStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : null;
        }
        catch {
            return null;
        }
    });

    useEffect(() => {
        try {
            if (currentUser) {
                window.sessionStorage.setItem(KEY, JSON.stringify(currentUser));
            }
            else {
                window.sessionStorage.removeItem(KEY);
            }
        }
        catch {
            // sessionStorage ใช้ไม่ได้ — ข้าม
        }
    }, [currentUser]);

    return [currentUser, setCurrentUser];
}
