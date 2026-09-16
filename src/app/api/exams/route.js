/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: route.js (api/exams)
 * หน้าที่ของไฟล์นี้: API จัดการข้อสอบ —
 *   GET  อ่านรายการข้อสอบทั้งหมด (ผู้ที่ล็อกอินทุกบทบาท)
 *   POST จัดส่งข้อสอบใหม่ (Teacher/Admin) — บันทึก audit log + แจ้งเตือน
 *        ฝ่ายโสตฯ อัตโนมัติฝั่ง server
 * ─────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api-helpers';
import { examToDb, examFromDb, auditLogToDb, notificationToDb } from '@/lib/mappers';

export async function GET() {
    const { supabase, error } = await requireUser();
    if (error)
        return error;
    const { data, error: dbError } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });
    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json({ exams: (data ?? []).map(examFromDb) });
}

export async function POST(request) {
    const { supabase, user, profile, error } = await requireRole(['Teacher', 'Admin']);
    if (error)
        return error;
    try {
        const body = await request.json();
        if (!body.E_No || !body.Subject_ID) {
            return NextResponse.json({ error: 'ข้อมูลข้อสอบไม่ครบถ้วน' }, { status: 400 });
        }
        const { data, error: dbError } = await supabase
            .from('exams')
            .insert(examToDb(body))
            .select()
            .single();
        if (dbError) {
            const conflict = dbError.code === '23505';
            return NextResponse.json(
                { error: conflict ? 'รหัสข้อสอบนี้ถูกใช้แล้ว กรุณาส่งใหม่' : dbError.message },
                { status: conflict ? 409 : 500 }
            );
        }
        const exam = examFromDb(data);
        // Audit log (ฝั่ง server — client แก้ไขย้อนหลังไม่ได้)
        await supabase.from('audit_logs').insert(auditLogToDb({
            userId: user.id, userName: profile.name, role: profile.role,
            action: 'UPLOAD_EXAM', subjectId: exam.Subject_ID, subjectName: exam.Subject_Name,
            ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
            details: `อัปโหลดข้อสอบใหม่เข้าสู่ระบบ: ${exam.file_name ?? '-'} (${exam.file_size ?? '-'}) ยอดพิมพ์ ${exam.total_copies} ชุด`,
        }));
        // แจ้งเตือนฝ่ายโสตฯ
        await supabase.from('notifications').insert(notificationToDb({
            title: 'ข้อสอบใหม่รอการตรวจสอบ',
            message: `อาจารย์ ${profile.name} ได้จัดส่งข้อสอบวิชา ${exam.Subject_ID} เข้าสู่ระบบแล้ว`,
            targetRole: 'AudioVisual', type: 'info', relatedExamNo: exam.E_No,
        }));
        return NextResponse.json({ exam }, { status: 201 });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}
