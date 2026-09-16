/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: entities.js
 * หน้าที่ของไฟล์นี้: เอกสารรูปร่างข้อมูล (shape) ของ entity ทั้งหมดในระบบ
 *   เขียนด้วย JSDoc เพื่อให้ VS Code ช่วย autocomplete ได้ (ผ่าน /** @type {import(...)} *​/ )
 *   ใช้อ้างอิงร่วมกับ supabase/schema.sql
 * ─────────────────────────────────────────────────────────
 *
 * @typedef {'Teacher' | 'AudioVisual' | 'Operations' | 'Admin'} UserRole
 *
 * @typedef {Object} UserAccount
 * @property {string} id            รหัสผู้ใช้ เช่น T001, AVD01, ADM01
 * @property {string} username      ชื่อสำหรับล็อกอิน เช่น somchai.t
 * @property {UserRole} role        บทบาทในระบบ
 * @property {string} name          ชื่อแสดง เช่น ผศ.ดร.สมชาย ใจดี
 * @property {string} email
 * @property {string} tel
 * @property {string} department
 * @property {string} [location]
 * @property {string} [avatar]
 * @property {'active' | 'inactive'} status
 *
 * @typedef {Object} CourseEntity
 * @property {string} Course_id       เช่น CS211
 * @property {string} Course_Name
 * @property {string} Course_year     พ.ศ. เช่น 2567
 * @property {string} term
 * @property {string} sec
 * @property {number} credits
 * @property {number} student_count
 * @property {string} teacher_id
 * @property {string} teacher_name
 *
 * ── สถานะข้อสอบ 8 สถานะ (ลำดับ workflow) ──
 * @typedef {'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'VERIFIED'
 *   | 'PRINTING' | 'PRINTED' | 'DELIVERED_OD' | 'READY_FOR_EXAM'} ExamStatus
 * DRAFT          = รอจัดส่งข้อสอบ
 * SUBMITTED      = จัดส่งแล้ว / รอฝ่ายโสตฯ ตรวจสอบ
 * REJECTED       = ส่งกลับแก้ไข / ให้อัปโหลดใหม่
 * VERIFIED       = ผ่านการตรวจสอบแล้ว
 * PRINTING       = กำลังดำเนินการจัดพิมพ์
 * PRINTED        = พิมพ์และบรรจุซองเสร็จสิ้น
 * DELIVERED_OD   = ส่งมอบให้ฝ่ายดำเนินการสอบแล้ว
 * READY_FOR_EXAM = พร้อมสำหรับการสอบในห้องสอบ
 *
 * @typedef {Object} ExamEntity
 * @property {string} E_No                    รหัสข้อสอบ เช่น EX-2567-001
 * @property {string} E_Date                  เช่น 2026-10-15
 * @property {string} E_Time                  เช่น 09:00 - 12:00
 * @property {string} Subject_ID
 * @property {string} Subject_Name
 * @property {'กลางภาค' | 'ปลายภาค' | 'สอบแก้ตัว'} exam_type
 * @property {string} Course_year
 * @property {string} term
 * @property {string} teacher_id
 * @property {string} teacher_name
 * @property {string} teacher_tel
 * @property {string} room
 * @property {number} total_pages
 * @property {number} total_copies
 * @property {number} copies_reserve
 * @property {ExamStatus} status
 * @property {string} [file_name]
 * @property {string} [file_size]
 * @property {string} [upload_date]
 * @property {string} [checked_by]
 * @property {string} [verified_date]
 * @property {string} [print_date]
 * @property {string} [envelope_notes]
 * @property {string[]} [allowed_materials]
 * @property {string} [rejection_reason]
 * @property {string[]} [proctors]
 *
 * ── ประเภทเหตุการณ์ที่บันทึกใน audit log ──
 * @typedef {'LOGIN' | 'VIEW_EXAM' | 'DOWNLOAD_EXAM' | 'PRINT_EXAM' | 'PRINT_ENVELOPE'
 *   | 'UPLOAD_EXAM' | 'REUPLOAD_EXAM' | 'DELETE_EXAM' | 'UPDATE_STATUS'} AuditAction
 *
 * @typedef {Object} SecurityAuditLog
 * @property {string} id
 * @property {string} timestamp
 * @property {string} userId
 * @property {string} userName
 * @property {UserRole} role
 * @property {AuditAction} action
 * @property {string} subjectId
 * @property {string} [subjectName]
 * @property {string} ipAddress
 * @property {string} details
 *
 * @typedef {Object} AppNotification
 * @property {string} id
 * @property {string} title
 * @property {string} message
 * @property {string} timestamp
 * @property {UserRole | 'ALL'} [targetRole]
 * @property {'info' | 'success' | 'warning' | 'error'} type
 * @property {boolean} isRead
 * @property {string} [relatedExamNo]
 */

export {};
