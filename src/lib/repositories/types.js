/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: types.js (repositories)
 * หน้าที่ของไฟล์นี้: เอกสาร interface ของชั้นจัดเก็บข้อมูล (repository) —
 *   เส้นแบ่งระหว่าง UI กับฐานข้อมูล ออกแบบให้เหมือนตาราง Supabase ในอนาคต:
 *   users, courses, exams, audit_logs, notifications (ดู supabase/schema.sql)
 * วิธีใช้: UI/hooks เรียกผ่าน interface เท่านั้น — เมื่อเชื่อม Supabase จะ
 *   สลับ implementation ใน src/lib/repositories/index.js โดยแก้โค้ด UI น้อยที่สุด
 *
 * ทุกเมธอดเป็น async (คืน Promise) เพราะ Supabase เรียกผ่าน network
 *
 * @typedef {Object} UserRepository
 * @property {function(): Promise<Array>} list
 * @property {function(Object): Promise<void>} create
 * @property {function(string, Object): Promise<void>} update  (id, patch)
 * @property {function(string): Promise<void>} remove          (id)
 *
 * @typedef {Object} CourseRepository
 * @property {function(): Promise<Array>} list
 * @property {function(Object): Promise<void>} create
 *
 * @typedef {Object} ExamRepository
 * @property {function(): Promise<Array>} list
 * @property {function(Object): Promise<void>} create
 * @property {function(string, Object): Promise<void>} update  (eNo, patch) — ใช้กับ
 *   การอัปเดตสถานะ/อัปโหลดซ้ำ (REQ-0010, REQ-0006)
 * @property {function(string): Promise<void>} remove          (eNo)
 *
 * @typedef {Object} AuditLogRepository
 * @property {function(): Promise<Array>} list
 * @property {function(Object): Promise<void>} create — สร้างได้อย่างเดียว
 *   (audit log ห้ามแก้ไข/ลบย้อนหลัง)
 *
 * @typedef {Object} NotificationRepository
 * @property {function(): Promise<Array>} list
 * @property {function(Object): Promise<void>} create
 * @property {function(string): Promise<void>} markRead            (id)
 * @property {function(string=): Promise<void>} markAllRead        (targetRole?)
 * ─────────────────────────────────────────────────────────
 */

export {};
