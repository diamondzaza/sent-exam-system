'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useAuditLogs.ts
 * หน้าที่ของไฟล์นี้: hook จัดการบันทึกเหตุการณ์ความปลอดภัย (Security Audit Log) —
 *   ใช้โดย AdminView ในแท็บ Security Audit Logs
 * หมายเหตุ: เก็บฝั่ง client ชั่วคราว — เมื่อเชื่อม Supabase ควรบันทึกผ่าน
 *   API route (service role) เท่านั้น เพื่อไม่ให้ client แก้ไขย้อนหลังได้
 * ─────────────────────────────────────────────────────────
 */

import { SecurityAuditLog } from '@/types/entities';
import { INITIAL_AUDIT_LOGS } from '@/data/mockData';
import { useLocalStorageState } from './useLocalStorageState';

export function useAuditLogs() {
  return useLocalStorageState<SecurityAuditLog[]>('sci_exam_logs', INITIAL_AUDIT_LOGS, Array.isArray);
}
