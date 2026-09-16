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
import { requireUser, requireRole } from '@/lib/api-helpers';
import { examPatchToDb, auditLogToDb, notificationToDb } from '@/lib/mappers';

export async function PATCH(request, { params }) {
    const { eNo } = await params;
    const { supabase, user, profile, error } = await requireUser();
    if (error)
        return error;
    try {
        const body = await request.json();
        const updates = body.updates ?? {};
        const dbPatch = examPatchToDb(updates);
        if (Object.keys(dbPatch).length === 0) {
            return NextResponse.json({ error: 'ไม่มีข้อมูลที่ต้องการแก้ไข' }, { status: 400 });
        }
        const { error: dbError } = await supabase
            .from('exams')
            .update(dbPatch)
            .eq('e_no', eNo);
        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }
        // Audit log + แจ้งเตือน (frontend ส่งมาพร้อมกับ updates)
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
            await supabase.from('notifications').insert(notificationToDb(body.notify));
        }
        return NextResponse.json({ ok: true });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    const { eNo } = await params;
    const { supabase, user, profile, error } = await requireRole(['Teacher', 'Admin']);
    if (error)
        return error;
    // อ่านข้อสอบก่อนลบ เพื่อใช้ใน audit log
    const { data: exam, error: readError } = await supabase
        .from('exams')
        .select('subject_id, subject_name')
        .eq('e_no', eNo)
        .single();
    if (readError || !exam) {
        return NextResponse.json({ error: 'ไม่พบข้อสอบที่ต้องการลบ' }, { status: 404 });
    }
    const { error: dbError } = await supabase.from('exams').delete().eq('e_no', eNo);
    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    await supabase.from('audit_logs').insert(auditLogToDb({
        userId: user.id, userName: profile.name, role: profile.role,
        action: 'DELETE_EXAM', subjectId: exam.subject_id, subjectName: exam.subject_name,
        ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
        details: `อาจารย์ยกเลิกการส่งข้อสอบรหัส ${eNo} ออกจากระบบ`,
    }));
    await supabase.from('notifications').insert(notificationToDb({
        title: 'ยกเลิกการส่งข้อสอบ',
        message: `ข้อสอบวิชา ${exam.subject_id} ${exam.subject_name ?? ''} ได้รับการยกเลิกการส่งโดยอาจารย์ผู้สอน`,
        targetRole: 'AudioVisual', type: 'warning',
    }));
    return NextResponse.json({ ok: true });
}
