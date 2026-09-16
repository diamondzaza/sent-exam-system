/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: index.js (repositories)
 * หน้าที่ของไฟล์นี้: factory จ่าย repository ให้ส่วนอื่นของแอป —
 *   ปัจจุบันคืน LocalStorage implementation
 * วิธีเปลี่ยนไปใช้ Supabase ในอนาคต:
 *   1. npm install @supabase/supabase-js
 *   2. สร้าง supabase.js implementation ของทุก interface (ดู interface ใน ./types)
 *   3. เปลี่ยน return ด้านล่างเป็น Supabase*Repository เพียงจุดเดียว
 *   คำแนะนำเต็มอยู่ที่ supabase/README.md
 * ─────────────────────────────────────────────────────────
 */
import { LocalUserRepository, LocalCourseRepository, LocalExamRepository, LocalAuditLogRepository, LocalNotificationRepository, } from './local';
export function getUserRepository() {
    return new LocalUserRepository();
}
export function getCourseRepository() {
    return new LocalCourseRepository();
}
export function getExamRepository() {
    return new LocalExamRepository();
}
export function getAuditLogRepository() {
    return new LocalAuditLogRepository();
}
export function getNotificationRepository() {
    return new LocalNotificationRepository();
}
