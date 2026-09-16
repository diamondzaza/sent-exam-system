/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: local.ts (repositories/local)
 * หน้าที่ของไฟล์นี้: implementation ของ repository ทุกตัวด้วย localStorage —
 *   ใช้งานจริงในปัจจุบัน (โหมดสาธิต) อ่าน/เขียนคีย์ sci_exam_* เดิมให้เข้ากันได้
 *   กับข้อมูลที่ผู้ใช้มีอยู่แล้ว
 * หมายเหตุ: เมื่อเชื่อม Supabase ไฟล์นี้จะถูกแทนด้วย supabase.ts
 *   (โครงสร้างตารางดูได้ที่ supabase/schema.sql)
 * ─────────────────────────────────────────────────────────
 */

import {
  UserAccount,
  CourseEntity,
  ExamEntity,
  SecurityAuditLog,
  AppNotification,
} from '@/types/entities';
import type {
  UserRepository,
  CourseRepository,
  ExamRepository,
  AuditLogRepository,
  NotificationRepository,
} from './types';

/** อ่าน list จาก localStorage อย่างปลอดภัย */
function readList<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeList<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // localStorage อาจใช้ไม่ได้ (โหมดส่วนตัว) — ข้ามไปเฉยๆ
  }
}

export class LocalUserRepository implements UserRepository {
  async list(): Promise<UserAccount[]> {
    return readList<UserAccount>('sci_exam_users', []);
  }
  async create(user: UserAccount): Promise<void> {
    writeList('sci_exam_users', [user, ...readList<UserAccount>('sci_exam_users', [])]);
  }
  async update(id: string, patch: Partial<UserAccount>): Promise<void> {
    writeList(
      'sci_exam_users',
      readList<UserAccount>('sci_exam_users', []).map((u) => (u.id === id ? { ...u, ...patch } : u))
    );
  }
  async remove(id: string): Promise<void> {
    writeList(
      'sci_exam_users',
      readList<UserAccount>('sci_exam_users', []).filter((u) => u.id !== id)
    );
  }
}

export class LocalCourseRepository implements CourseRepository {
  async list(): Promise<CourseEntity[]> {
    return readList<CourseEntity>('sci_exam_courses', []);
  }
  async create(course: CourseEntity): Promise<void> {
    writeList('sci_exam_courses', [course, ...readList<CourseEntity>('sci_exam_courses', [])]);
  }
}

export class LocalExamRepository implements ExamRepository {
  async list(): Promise<ExamEntity[]> {
    return readList<ExamEntity>('sci_exam_records', []);
  }
  async create(exam: ExamEntity): Promise<void> {
    writeList('sci_exam_records', [exam, ...readList<ExamEntity>('sci_exam_records', [])]);
  }
  async update(eNo: string, patch: Partial<ExamEntity>): Promise<void> {
    writeList(
      'sci_exam_records',
      readList<ExamEntity>('sci_exam_records', []).map((e) =>
        e.E_No === eNo ? { ...e, ...patch } : e
      )
    );
  }
  async remove(eNo: string): Promise<void> {
    writeList(
      'sci_exam_records',
      readList<ExamEntity>('sci_exam_records', []).filter((e) => e.E_No !== eNo)
    );
  }
}

export class LocalAuditLogRepository implements AuditLogRepository {
  async list(): Promise<SecurityAuditLog[]> {
    return readList<SecurityAuditLog>('sci_exam_logs', []);
  }
  async create(log: SecurityAuditLog): Promise<void> {
    writeList('sci_exam_logs', [log, ...readList<SecurityAuditLog>('sci_exam_logs', [])]);
  }
}

export class LocalNotificationRepository implements NotificationRepository {
  async list(): Promise<AppNotification[]> {
    return readList<AppNotification>('sci_exam_notifs', []);
  }
  async create(notification: AppNotification): Promise<void> {
    writeList('sci_exam_notifs', [notification, ...readList<AppNotification>('sci_exam_notifs', [])]);
  }
  async markRead(id: string): Promise<void> {
    writeList(
      'sci_exam_notifs',
      readList<AppNotification>('sci_exam_notifs', []).map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )
    );
  }
  async markAllRead(targetRole?: string): Promise<void> {
    writeList(
      'sci_exam_notifs',
      readList<AppNotification>('sci_exam_notifs', []).map((n) =>
        !n.targetRole || !targetRole || n.targetRole === 'ALL' || n.targetRole === targetRole
          ? { ...n, isRead: true }
          : n
      )
    );
  }
}
