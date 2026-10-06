/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: route.js (api/notifications)
 * หน้าที่ของไฟล์นี้: API การแจ้งเตือน —
 *   GET   อ่านการแจ้งเตือนที่ส่งถึงบทบาทของผู้ใช้ (RLS กรองให้เอง)
 *   PATCH ทำเครื่องหมายอ่านแล้ว: { id } ทีละรายการ หรือ { all: true } ทั้งหมด
 * ─────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-helpers';
import { notificationFromDb } from '@/lib/mappers';

async function readVisibleNotifications(supabase, user, profile, id) {
    let query = supabase
        .from('notifications')
        .select('*');
    if (id) query = query.eq('id', id);
    // ซ่อนรายงานเก่าที่เคยส่งผิดถึง Teacher ด้วย — รายงานปัญหาให้ Admin อ่านเท่านั้น
    if (profile?.role !== 'Admin') {
        query = query.not('title', 'like', 'แจ้งปัญหา:%');
    }
    const { data, error: dbError } = await query.order('created_at', { ascending: false });
    if (dbError) return { error: dbError };
    const rows = data ?? [];
    if (profile?.role !== 'Teacher') return { data: rows };
    const examNos = [...new Set(rows.filter((n) => n.target_role === 'Teacher').map((n) => n.related_exam_no).filter(Boolean))];
    if (!examNos.length) return { data: rows.filter((n) => n.target_role !== 'Teacher') };
    const { data: ownedExams, error: ownerError } = await supabase.from('exams')
        .select('e_no').eq('teacher_id', user.id).in('e_no', examNos);
    if (ownerError) return { error: ownerError };
    const owned = new Set((ownedExams ?? []).map((exam) => exam.e_no));
    return { data: rows.filter((n) => n.target_role !== 'Teacher' || owned.has(n.related_exam_no)) };
}

export async function GET(request) {
    const { supabase, user, profile, error } = await requireUser(request);
    if (error) return error;
    const { data, error: dbError } = await readVisibleNotifications(supabase, user, profile);
    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json({ notifications: (data ?? []).map(notificationFromDb) });
}

export async function PATCH(request) {
    const { supabase, user, profile, error } = await requireUser(request);
    if (error)
        return error;
    try {
        const body = await request.json();
        if (body.all) {
            // อ่านแล้วทั้งหมดที่ส่งถึงฉัน (หรือทั่วไป) — อ่าน id ก่อนแล้วอัปเดตทีละ id
            // เพราะ RLS ของ notifications อนุญาต select เฉพาะของตัวเอง
            const { data: mine, error: readError } = await readVisibleNotifications(supabase, user, profile);
            if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
            const ids = (mine ?? []).filter((n) => !n.is_read).map((n) => n.id);
            if (ids.length > 0) {
                const { error: updateError } = await supabase.from('notifications').update({ is_read: true }).in('id', ids);
                if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
            }
            return NextResponse.json({ ok: true, updated: ids.length });
        }
        if (body.id) {
            const { data: mine, error: readError } = await readVisibleNotifications(supabase, user, profile, body.id);
            if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
            if (!mine?.length) return NextResponse.json({ error: 'ไม่พบรายการที่ส่งถึงคุณ' }, { status: 404 });
            const { error: dbError } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', body.id);
            if (dbError) {
                return NextResponse.json({ error: dbError.message }, { status: 500 });
            }
            return NextResponse.json({ ok: true });
        }
        return NextResponse.json({ error: 'ไม่มีรายการที่ระบุ' }, { status: 400 });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}
