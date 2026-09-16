'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useAuthSession.ts
 * หน้าที่ของไฟล์นี้: hook เก็บสถานะการล็อกอิน (boolean) — เป็นเงื่อนไขของ
 *   login gate ใน AppShell (REQ-0001)
 * หมายเหตุ: โหมดสาธิต — เมื่อเชื่อม Supabase Auth แล้วจะใช้ session จริงแทน
 * ─────────────────────────────────────────────────────────
 */

import { useLocalStorageState } from './useLocalStorageState';

export function useAuthSession() {
  return useLocalStorageState<boolean>('sci_exam_auth', false, (v) => typeof v === 'boolean');
}
