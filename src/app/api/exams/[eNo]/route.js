/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: route.js (api/exams/[eNo])
 * หน้าที่ของไฟล์นี้: API สำหรับข้อสอบรายรหัส —
 *   PATCH  อัปเดตข้อสอบ (เปลี่ยนสถานะโดยโสตฯ/ดำเนินการ, อัปโหลดซ้ำโดยครู)
 *          พร้อมบันทึก audit log + แจ้งเตือนตามที่ frontend ส่งมา
 *   DELETE ยกเลิกการส่งข้อสอบ (Teacher/Admin เท่านั้น)
 * ─────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { requireUser, requireRole, createAdminClient } from '@/lib/api-helpers';
import { examPatchToDb, auditLogToDb, notificationToDb } from '@/lib/mappers';

const BUCKET = 'exam-files';

export async function PATCH(request, { params }) {
    const { eNo } = await params;
    const { supabase, user, profile, error } = await requireUser(request);
    if (error)
        return error;
    try {
        const body = await request.json();
        const updates = body.updates ?? {};
        const dbPatch = examPatchToDb(updates);
        if (Object.keys(dbPatch).length === 0) {
            return NextResponse.json({ error: 'ไม่มีข้อมูลที่ต้องการแก้ไข' }, { status: 400 });
        }
        // อาจารย์ (re-upload) — RLS ไม่ให้อาจารย์ update ตาราง exams จึงตรวจ
        // ความเป็นเจ้าของแล้วอัปเดตผ่าน admin client / โสตฯ-ดำเนินการ-แอดมิน อัปเดตผ่าน RLS ได้ตามปกติ
        let writer = supabase;
        if (profile.role === 'Teacher') {
            const { data: own } = await supabase
                .from('exams')
                .select('teacher_id')
                .eq('e_no', eNo)
                .single();
            if (!own) {
                return NextResponse.json({ error: 'ไม่พบข้อสอบที่ระบุ' }, { status: 404 });
            }
            if (own.teacher_id !== user.id) {
                return NextResponse.json({ error: 'แก้ไขได้เฉพาะข้อสอบที่ตนเองจัดส่งเท่านั้น' }, { status: 403 });
            }
            writer = createAdminClient();
        }
        const { error: dbError } = await writer
            .from('exams')
            .update(dbPatch)
            .eq('e_no', eNo);
        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }
        // Audit log + แจ้งเตือน (frontend ส่งมาพร้อมกับ updates)
        const admin = createAdminClient();
        if (body.audit?.action) {
            await supabase.from('audit_logs').insert(auditLogToDb({
                userId: user.id, userName: profile.name, role: profile.role,
                action: body.audit.action, subjectId: body.audit.subjectId ?? '',
                subjectName: body.audit.subjectName ?? null,
                ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
                details: body.audit.details ?? '',
            }));
        }
        if (body.notify?.title) {
            // ผ่าน admin client — ตาราง notifications ไม่มีนโยบาย INSERT ใน RLS
            await admin.from('notifications').insert(notificationToDb(body.notify));
        }
        return NextResponse.json({ ok: true });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    const { eNo } = await params;
    const { supabase, user, profile, error } = await requireRole(['Teacher', 'Admin'], request);
    if (error)
        return error;
    // อ่านข้อสอบก่อนลบ เพื่อใช้ใน audit log + ลบไฟล์ใน Storage
    const { data: exam, error: readError } = await supabase
        .from('exams')
        .select('subject_id, subject_name, file_path, teacher_id')
        .eq('e_no', eNo)
        .single();
    if (readError || !exam) {
        return NextResponse.json({ error: 'ไม่พบข้อสอบที่ต้องการลบ' }, { status: 404 });
    }
    // อาจารย์ลบได้เฉพาะข้อสอบของตนเอง (แอดมินลบได้ทุกรายการ)
    if (profile.role === 'Teacher' && exam.teacher_id !== user.id) {
        return NextResponse.json({ error: 'ลบได้เฉพาะข้อสอบที่ตนเองจัดส่งเท่านั้น' }, { status: 403 });
    }
    // ปลดลิงก์การแจ้งเตือนที่อ้างอิงข้อสอบนี้ก่อน (FK) — เก็บประวัติแจ้งเตือนไว้ แค่ไม่ผูกกับแถวที่จะลบ
    const admin = createAdminClient();
    await admin
        .from('notifications')
        .update({ related_exam_no: null })
        .eq('related_exam_no', eNo);
    // ลบไฟล์จริงใน Storage (ถ้ามี)
    if (exam.file_path) {
        await admin.storage.from(BUCKET).remove([exam.file_path]);
    }
    // ลบผ่าน admin client — ตาราง exams ไม่มีนโยบาย DELETE ใน RLS (การลบ
    // อนุญาตเฉพาะผ่าน API นี้ ซึ่งตรวจสิทธิ์ Teacher/Admin และบันทึก audit แล้ว)
    const { error: dbError } = await admin.from('exams').delete().eq('e_no', eNo);
    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    await supabase.from('audit_logs').insert(auditLogToDb({
        userId: user.id, userName: profile.name, role: profile.role,
        action: 'DELETE_EXAM', subjectId: exam.subject_id, subjectName: exam.subject_name,
        ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
        details: `อาจารย์ยกเลิกการส่งข้อสอบรหัส ${eNo} ออกจากระบบ`,
    }));
    await admin.from('notifications').insert(notificationToDb({
        title: 'ยกเลิกการส่งข้อสอบ',
        message: `ข้อสอบวิชา ${exam.subject_id} ${exam.subject_name ?? ''} ได้รับการยกเลิกการส่งโดยอาจารย์ผู้สอน`,
        targetRole: 'AudioVisual', type: 'warning',
    }));
    return NextResponse.json({ ok: true });
}
