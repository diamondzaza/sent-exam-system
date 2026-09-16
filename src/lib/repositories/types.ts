/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: types.ts (repositories)
 * หน้าที่ของไฟล์นี้: นิยาม interface ของชั้นจัดเก็บข้อมูล (repository) —
 *   เส้นแบ่งระหว่าง UI กับฐานข้อมูล โดยออกแบบให้เหมือนตาราง Supabase ในอนาคต:
 *   users, courses, exams, audit_logs, notifications (ดู supabase/schema.sql)
 * วิธีใช้: UI/hooks เรียกผ่าน interface เท่านั้น — เมื่อเชื่อม Supabase จะ
 *   สลับ implementation ใน src/lib/repositories/index.ts โดยแก้โค้ด UI น้อยที่สุด
 * ─────────────────────────────────────────────────────────
 */

import {
  UserAccount,
  CourseEntity,
  ExamEntity,
  SecurityAuditLog,
  AppNotification,
} from '@/types/entities';

export interface UserRepository {
  list(): Promise<UserAccount[]>;
  create(user: UserAccount): Promise<void>;
  update(id: string, patch: Partial<UserAccount>): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface CourseRepository {
  list(): Promise<CourseEntity[]>;
  create(course: CourseEntity): Promise<void>;
}

export interface ExamRepository {
  list(): Promise<ExamEntity[]>;
  create(exam: ExamEntity): Promise<void>;
  /** อัปเดตบางส่วน — ใช้กับการอัปเดตสถานะ/อัปโหลดซ้ำ (REQ-0010, REQ-0006) */
  update(eNo: string, patch: Partial<ExamEntity>): Promise<void>;
  remove(eNo: string): Promise<void>;
}

export interface AuditLogRepository {
  list(): Promise<SecurityAuditLog[]>;
  /** สร้างรายการใหม่เท่านั้น — audit log ห้ามแก้ไข/ลบย้อนหลัง */
  create(log: SecurityAuditLog): Promise<void>;
}

export interface NotificationRepository {
  list(): Promise<AppNotification[]>;
  create(notification: AppNotification): Promise<void>;
  /** ทำเครื่องหมายอ่านแล้วทีละรายการ */
  markRead(id: string): Promise<void>;
  /** ทำเครื่องหมายอ่านแล้วทั้งหมดที่ตรงกับบทบาท (หรือทุกอันเมื่อไม่ระบุ) */
  markAllRead(targetRole?: string): Promise<void>;
}
