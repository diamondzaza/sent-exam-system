/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: route.js (api/audit-logs)
 * หน้าที่ของไฟล์นี้: API บันทึกเหตุการณ์ความปลอดภัย —
 *   GET   อ่านประวัติทั้งหมด (Admin เท่านั้น)
 *   POST  บันทึกเหตุการณ์ที่เกิดฝั่ง browser เช่น เปิดดูข้อสอบ,
 *         ดาวน์โหลด, สั่งพิมพ์ (ผู้ที่ล็อกอินเท่านั้น — RLS กันอยู่)
 * ─────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api-helpers';
import { auditLogFromDb, auditLogToDb } from '@/lib/mappers';

export async function GET(request) {
    const { supabase, error } = await requireRole(['Admin'], request);
    if (error)
        return error;
    const { data, error: dbError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);
    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json({ logs: (data ?? []).map(auditLogFromDb) });
}

export async function POST(request) {
    const { supabase, user, profile, error } = await requireUser(request);
    if (error)
        return error;
    try {
        const body = await request.json();
        if (!body.action) {
            return NextResponse.json({ error: 'ไม่ได้ระบุประเภทเหตุการณ์' }, { status: 400 });
        }
        const { error: dbError } = await supabase.from('audit_logs').insert(auditLogToDb({
            userId: user.id,
            userName: profile.name,
            role: profile.role,
            action: body.action,
            subjectId: body.subjectId ?? '',
            subjectName: body.subjectName ?? null,
            ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
            details: body.details ?? '',
        }));
        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true }, { status: 201 });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}
