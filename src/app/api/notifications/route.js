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

export async function GET() {
    const { supabase, error } = await requireUser();
    if (error)
        return error;
    const { data, error: dbError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json({ notifications: (data ?? []).map(notificationFromDb) });
}

export async function PATCH(request) {
    const { supabase, user, error } = await requireUser();
    if (error)
        return error;
    try {
        const body = await request.json();
        if (body.all) {
            // อ่านแล้วทั้งหมดที่ส่งถึงฉัน (หรือทั่วไป) — อ่าน id ก่อนแล้วอัปเดตทีละ id
            // เพราะ RLS ของ notifications อนุญาต select เฉพาะของตัวเอง
            const { data: mine } = await supabase
                .from('notifications')
                .select('id')
                .eq('is_read', false);
            const ids = (mine ?? []).map((n) => n.id);
            if (ids.length > 0) {
                await supabase.from('notifications').update({ is_read: true }).in('id', ids);
            }
            return NextResponse.json({ ok: true, updated: ids.length });
        }
        if (body.id) {
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
