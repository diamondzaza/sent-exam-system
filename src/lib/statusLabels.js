/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: statusLabels.js
 * หน้าที่ของไฟล์นี้: ค่าคงที่แสดงผลของสถานะข้อสอบทั้ง 8 สถานะ —
 *   label (ข้อความไทย), badgeClass (คลาสสีของ badge) และ step (ลำดับขั้นใน progress tracker)
 * ผู้ใช้งาน: ทุก View (TeacherView, AudioVisualView, OperationsView)
 * เชื่อมต่อข้อมูล: ใช้ type ExamStatus จาก @/types/entities
 * ─────────────────────────────────────────────────────────
 */
export const STATUS_LABELS = {
    DRAFT: {
        label: 'ยังไม่ได้ส่งข้อสอบ',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        step: 1,
    },
    SUBMITTED: {
        label: 'ส่งแล้ว (รอโสตฯ ตรวจสอบ)',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
        step: 2,
    },
    REJECTED: {
        label: 'ขอให้อัปโหลดใหม่ (ส่งกลับแก้ไข)',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
        step: 2,
    },
    VERIFIED: {
        label: 'ตรวจสอบผ่านแล้ว',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
        step: 3,
    },
    PRINTING: {
        label: 'กำลังจัดพิมพ์',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300 animate-pulse',
        step: 4,
    },
    PRINTED: {
        label: 'พิมพ์และบรรจุซองแล้ว',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
        step: 5,
    },
    DELIVERED_OD: {
        label: 'ส่งมอบฝ่ายดำเนินการสอบแล้ว',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-300',
        step: 6,
    },
    READY_FOR_EXAM: {
        label: 'พร้อมสอบ (ในห้องมั่นคง)',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        step: 7,
    },
};
