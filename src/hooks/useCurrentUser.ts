'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useCurrentUser.ts
 * หน้าที่ของไฟล์นี้: hook เก็บบัญชีผู้ใช้ที่กำลังล็อกอินอยู่ (session user) —
 *   ใช้กำหนดว่าจะแสดงหน้าจอของบทบาทใด และเป็นผู้บันทึก audit log
 * ─────────────────────────────────────────────────────────
 */

import { UserAccount } from '@/types/entities';
import { INITIAL_USERS } from '@/data/mockData';
import { useLocalStorageState } from './useLocalStorageState';

export function useCurrentUser() {
  // defaults to Teacher (สมชาย)
  return useLocalStorageState<UserAccount>(
    'sci_exam_curr_user',
    INITIAL_USERS[0],
    (v) => v && typeof v.id === 'string'
  );
}
