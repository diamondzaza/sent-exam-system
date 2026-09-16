/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: local.js (repositories/local)
 * หน้าที่ของไฟล์นี้: implementation ของ repository ทุกตัวด้วย localStorage —
 *   ใช้งานจริงในปัจจุบัน (โหมดสาธิต) อ่าน/เขียนคีย์ sci_exam_* เดิมให้เข้ากันได้
 *   กับข้อมูลที่ผู้ใช้มีอยู่แล้ว
 * หมายเหตุ: เมื่อเชื่อม Supabase ไฟล์นี้จะถูกแทนด้วย supabase.js
 *   (โครงสร้างตารางดูได้ที่ supabase/schema.sql)
 * ─────────────────────────────────────────────────────────
 */
/** อ่าน list จาก localStorage อย่างปลอดภัย */
function readList(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw)
            return fallback;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : fallback;
    }
    catch {
        return fallback;
    }
}
function writeList(key, items) {
    try {
        localStorage.setItem(key, JSON.stringify(items));
    }
    catch {
        // localStorage อาจใช้ไม่ได้ (โหมดส่วนตัว) — ข้ามไปเฉยๆ
    }
}
export class LocalUserRepository {
    async list() {
        return readList('sci_exam_users', []);
    }
    async create(user) {
        writeList('sci_exam_users', [user, ...readList('sci_exam_users', [])]);
    }
    async update(id, patch) {
        writeList('sci_exam_users', readList('sci_exam_users', []).map((u) => (u.id === id ? { ...u, ...patch } : u)));
    }
    async remove(id) {
        writeList('sci_exam_users', readList('sci_exam_users', []).filter((u) => u.id !== id));
    }
}
export class LocalCourseRepository {
    async list() {
        return readList('sci_exam_courses', []);
    }
    async create(course) {
        writeList('sci_exam_courses', [course, ...readList('sci_exam_courses', [])]);
    }
}
export class LocalExamRepository {
    async list() {
        return readList('sci_exam_records', []);
    }
    async create(exam) {
        writeList('sci_exam_records', [exam, ...readList('sci_exam_records', [])]);
    }
    async update(eNo, patch) {
        writeList('sci_exam_records', readList('sci_exam_records', []).map((e) => e.E_No === eNo ? { ...e, ...patch } : e));
    }
    async remove(eNo) {
        writeList('sci_exam_records', readList('sci_exam_records', []).filter((e) => e.E_No !== eNo));
    }
}
export class LocalAuditLogRepository {
    async list() {
        return readList('sci_exam_logs', []);
    }
    async create(log) {
        writeList('sci_exam_logs', [log, ...readList('sci_exam_logs', [])]);
    }
}
export class LocalNotificationRepository {
    async list() {
        return readList('sci_exam_notifs', []);
    }
    async create(notification) {
        writeList('sci_exam_notifs', [notification, ...readList('sci_exam_notifs', [])]);
    }
    async markRead(id) {
        writeList('sci_exam_notifs', readList('sci_exam_notifs', []).map((n) => n.id === id ? { ...n, isRead: true } : n));
    }
    async markAllRead(targetRole) {
        writeList('sci_exam_notifs', readList('sci_exam_notifs', []).map((n) => !n.targetRole || !targetRole || n.targetRole === 'ALL' || n.targetRole === targetRole
            ? { ...n, isRead: true }
            : n));
    }
}
