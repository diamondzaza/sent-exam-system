'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useCurrentUser.js
 * หน้าที่ของไฟล์นี้: hook เก็บโปรไฟล์ผู้ใช้ที่ล็อกอินอยู่ (cache ใน localStorage
 *   เพื่อให้หน้าจอติดขึ้นเร็ว) — ค่าเริ่มต้นเป็น null ไม่มี mock user แล้ว
 *   AppShell จะดึงโปรไฟล์จริงจากตาราง users ทุกครั้งที่มี session
 * ─────────────────────────────────────────────────────────
 */

import { useLocalStorageState } from './useLocalStorageState';

export function useCurrentUser() {
    return useLocalStorageState('sci_exam_curr_user', null, (v) => v && typeof v.id === 'string');
}
