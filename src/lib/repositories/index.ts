/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: index.ts (repositories)
 * หน้าที่ของไฟล์นี้: factory จ่าย repository ให้ส่วนอื่นของแอป —
 *   ปัจจุบันคืน LocalStorage implementation
 * วิธีเปลี่ยนไปใช้ Supabase ในอนาคต:
 *   1. npm install @supabase/supabase-js
 *   2. สร้าง supabase.ts implementation ของทุก interface (ดู interface ใน ./types)
 *   3. เปลี่ยน return ด้านล่างเป็น Supabase*Repository เพียงจุดเดียว
 *   คำแนะนำเต็มอยู่ที่ supabase/README.md
 * ─────────────────────────────────────────────────────────
 */

import {
  LocalUserRepository,
  LocalCourseRepository,
  LocalExamRepository,
  LocalAuditLogRepository,
  LocalNotificationRepository,
} from './local';
import type {
  UserRepository,
  CourseRepository,
  ExamRepository,
  AuditLogRepository,
  NotificationRepository,
} from './types';

export function getUserRepository(): UserRepository {
  return new LocalUserRepository();
}

export function getCourseRepository(): CourseRepository {
  return new LocalCourseRepository();
}

export function getExamRepository(): ExamRepository {
  return new LocalExamRepository();
}

export function getAuditLogRepository(): AuditLogRepository {
  return new LocalAuditLogRepository();
}

export function getNotificationRepository(): NotificationRepository {
  return new LocalNotificationRepository();
}

export type {
  UserRepository,
  CourseRepository,
  ExamRepository,
  AuditLogRepository,
  NotificationRepository,
} from './types';
