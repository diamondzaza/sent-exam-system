'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useNotifications.ts
 * หน้าที่ของไฟล์นี้: hook จัดการการแจ้งเตือนของระบบ — แสดงใน Header
 *   กรองตามบทบาทผู้รับ (targetRole) และสถานะอ่าน/ยังไม่อ่าน
 * ─────────────────────────────────────────────────────────
 */

import { AppNotification } from '@/types/entities';
import { INITIAL_NOTIFICATIONS } from '@/data/mockData';
import { useLocalStorageState } from './useLocalStorageState';

export function useNotifications() {
  return useLocalStorageState<AppNotification[]>('sci_exam_notifs', INITIAL_NOTIFICATIONS, Array.isArray);
}
