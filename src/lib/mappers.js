/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: mappers.js
 * หน้าที่ของไฟล์นี้: แปลงชื่อฟิลด์ระหว่าง frontend (camelCase เช่น E_No, Subject_ID)
 *   กับตาราง Supabase (snake_case เช่น e_no, subject_id) — ใช้ใน API routes
 * ─────────────────────────────────────────────────────────
 */

// ── Exam ──
export function examToDb(e) {
    return {
        e_no: e.E_No,
        e_date: e.E_Date,
        e_time: e.E_Time,
        subject_id: e.Subject_ID,
        subject_name: e.Subject_Name,
        exam_type: e.exam_type,
        course_year: e.Course_year,
        term: e.term,
        teacher_id: e.teacher_id,
        teacher_name: e.teacher_name,
        teacher_tel: e.teacher_tel,
        room: e.room,
        total_pages: e.total_pages,
        total_copies: e.total_copies,
        copies_reserve: e.copies_reserve,
        status: e.status,
        file_name: e.file_name ?? null,
        file_size: e.file_size ?? null,
        upload_date: e.upload_date ?? null,
        checked_by: e.checked_by ?? null,
        verified_date: e.verified_date ?? null,
        print_date: e.print_date ?? null,
        envelope_notes: e.envelope_notes ?? null,
        allowed_materials: e.allowed_materials ?? null,
        rejection_reason: e.rejection_reason ?? null,
        proctors: e.proctors ?? null,
    };
}

export function examFromDb(r) {
    return {
        E_No: r.e_no,
        E_Date: r.e_date,
        E_Time: r.e_time,
        Subject_ID: r.subject_id,
        Subject_Name: r.subject_name,
        exam_type: r.exam_type,
        Course_year: r.course_year,
        term: r.term,
        teacher_id: r.teacher_id,
        teacher_name: r.teacher_name,
        teacher_tel: r.teacher_tel,
        room: r.room,
        total_pages: r.total_pages,
        total_copies: r.total_copies,
        copies_reserve: r.copies_reserve,
        status: r.status,
        file_name: r.file_name ?? undefined,
        file_size: r.file_size ?? undefined,
        upload_date: r.upload_date ?? undefined,
        checked_by: r.checked_by ?? undefined,
        verified_date: r.verified_date ?? undefined,
        print_date: r.print_date ?? undefined,
        envelope_notes: r.envelope_notes ?? undefined,
        allowed_materials: r.allowed_materials ?? undefined,
        rejection_reason: r.rejection_reason ?? undefined,
        proctors: r.proctors ?? undefined,
    };
}

/** แปลง patch บางส่วนของ frontend → ชื่อคอลัมน์ฐานข้อมูล */
const EXAM_FIELD_MAP = {
    E_Date: 'e_date', E_Time: 'e_time', Subject_ID: 'subject_id', Subject_Name: 'subject_name',
    Course_year: 'course_year', file_name: 'file_name', file_size: 'file_size',
    upload_date: 'upload_date', checked_by: 'checked_by', verified_date: 'verified_date',
    print_date: 'print_date', envelope_notes: 'envelope_notes', allowed_materials: 'allowed_materials',
    rejection_reason: 'rejection_reason', proctors: 'proctors', status: 'status',
    total_pages: 'total_pages', total_copies: 'total_copies', copies_reserve: 'copies_reserve',
    room: 'room', exam_type: 'exam_type',
};
export function examPatchToDb(patch) {
    const out = {};
    for (const [key, value] of Object.entries(patch)) {
        const col = EXAM_FIELD_MAP[key];
        if (col) out[col] = value;
    }
    return out;
}

// ── User ──
export function userToDb(u) {
    return {
        id: u.id,
        username: u.username,
        role: u.role,
        name: u.name,
        email: u.email,
        tel: u.tel,
        department: u.department,
        location: u.location ?? null,
        avatar: u.avatar ?? null,
        status: u.status,
    };
}

export function userFromDb(r) {
    return {
        id: r.id,
        username: r.username,
        role: r.role,
        name: r.name,
        email: r.email,
        tel: r.tel,
        department: r.department,
        location: r.location ?? undefined,
        avatar: r.avatar ?? undefined,
        status: r.status,
    };
}

// ── Course ──
export function courseToDb(c) {
    return {
        course_id: c.Course_id,
        course_name: c.Course_Name,
        course_year: c.Course_year,
        term: c.term,
        sec: c.sec,
        credits: c.credits,
        student_count: c.student_count,
        teacher_id: c.teacher_id,
        teacher_name: c.teacher_name,
    };
}

export function courseFromDb(r) {
    return {
        Course_id: r.course_id,
        Course_Name: r.course_name,
        Course_year: r.course_year,
        term: r.term,
        sec: r.sec,
        credits: r.credits,
        student_count: r.student_count,
        teacher_id: r.teacher_id,
        teacher_name: r.teacher_name,
    };
}

// ── Audit Log ──
export function auditLogToDb(l) {
    return {
        user_id: l.userId,
        user_name: l.userName,
        role: l.role,
        action: l.action,
        subject_id: l.subjectId,
        subject_name: l.subjectName ?? null,
        ip_address: l.ipAddress,
        details: l.details,
    };
}

export function auditLogFromDb(r) {
    return {
        id: r.id,
        timestamp: new Date(r.timestamp).toLocaleString('th-TH'),
        userId: r.user_id,
        userName: r.user_name,
        role: r.role,
        action: r.action,
        subjectId: r.subject_id,
        subjectName: r.subject_name ?? undefined,
        ipAddress: r.ip_address,
        details: r.details,
    };
}

// ── Notification ──
export function notificationToDb(n) {
    return {
        title: n.title,
        message: n.message,
        timestamp: n.timestamp ?? 'เมื่อสักครู่',
        target_role: n.targetRole === 'ALL' ? null : n.targetRole ?? null,
        type: n.type ?? 'info',
        is_read: n.isRead ?? false,
        related_exam_no: n.relatedExamNo ?? null,
    };
}

export function notificationFromDb(r) {
    return {
        id: r.id,
        title: r.title,
        message: r.message,
        timestamp: r.timestamp,
        targetRole: r.target_role ?? 'ALL',
        type: r.type,
        isRead: r.is_read,
        relatedExamNo: r.related_exam_no ?? undefined,
    };
}
