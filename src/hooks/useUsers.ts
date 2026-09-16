'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useUsers.ts
 * หน้าที่ของไฟล์นี้: hook จัดการรายชื่อผู้ใช้ทั้งหมดในระบบ (ทุกบทบาท)
 *   เริ่มต้นด้วย seed data และ persist ลง localStorage
 * ─────────────────────────────────────────────────────────
 */

import { UserAccount } from '@/types/entities';
import { INITIAL_USERS } from '@/data/mockData';
import { useLocalStorageState } from './useLocalStorageState';

export function useUsers() {
  return useLocalStorageState<UserAccount[]>('sci_exam_users', INITIAL_USERS, Array.isArray);
}
