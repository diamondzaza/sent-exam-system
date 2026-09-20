/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: route.js (api/account-requests)
 * หน้าที่ของไฟล์นี้: API คำขอเปิดบัญชี —
 *   POST  ยื่นคำขอใหม่ (สาธารณะ — ไม่ต้องล็อกอิน, RLS อนุญาต insert เท่านั้น)
 *   GET   อ่านคำขอทั้งหมด (Admin เท่านั้น)
 *   PATCH อนุมัติ/ปฏิเสธ (Admin เท่านั้น) — "approve" จะสร้างบัญชี Auth
 *         + โปรไฟล์จริงทันที (รหัสผ่านเริ่มต้นที่แอดมินกรอก) แล้วค่อยมาร์คสถานะ
 * ─────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireRole, createAdminClient } from '@/lib/api-helpers';
import { userToDb, userFromDb } from '@/lib/mappers';

/** ยื่นคำขอ — สาธารณะ */
export async function POST(request) {
    try {
        const body = await request.json();
        if (!body.username || !body.name || !body.email) {
            return NextResponse.json(
                { error: 'กรุณากรอก ชื่อผู้ใช้, ชื่อ-นามสกุล และอีเมลให้ครบ' },
                { status: 400 }
            );
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
            return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 });
        }
        // ใช้ client แบบไม่มี session (anon) — RLS อนุญาตเฉพาะ insert
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            { auth: { persistSession: false } }
        );
        const { error: dbError } = await supabase.from('account_requests').insert({
            username: String(body.username).trim(),
            name: String(body.name).trim(),
            email: String(body.email).trim().toLowerCase(),
            tel: body.tel ? String(body.tel).trim() : null,
            department: body.department ? String(body.department).trim() : null,
            reason: body.reason ? String(body.reason).trim() : null,
        });
        if (dbError) {
            return NextResponse.json({ error: 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
        }
        return NextResponse.json({ ok: true }, { status: 201 });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}

/** อ่านรายการคำขอ — Admin เท่านั้น */
export async function GET(request) {
    const { supabase, error } = await requireRole(['Admin'], request);
    if (error)
        return error;
    const { data, error: dbError } = await supabase
        .from('account_requests')
        .select('*')
        .order('created_at', { ascending: false });
    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json({ requests: data ?? [] });
}

/** อนุมัติ / ปฏิเสธ — Admin เท่านั้น */
export async function PATCH(request) {
    const { supabase, user, error } = await requireRole(['Admin'], request);
    if (error)
        return error;
    try {
        const body = await request.json();
        if (!body.id || !['approve', 'reject'].includes(body.action)) {
            return NextResponse.json({ error: 'ข้อมูลไม่ครบ (id, action)' }, { status: 400 });
        }
        const { data: req, error: readError } = await supabase
            .from('account_requests')
            .select('*')
            .eq('id', body.id)
            .single();
        if (readError || !req) {
            return NextResponse.json({ error: 'ไม่พบคำขอนี้' }, { status: 404 });
        }
        if (req.status !== 'pending') {
            return NextResponse.json({ error: 'คำขอนี้ถูกพิจารณาไปแล้ว' }, { status: 409 });
        }

        if (body.action === 'reject') {
            const { error: dbError } = await supabase
                .from('account_requests')
                .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
                .eq('id', body.id);
            if (dbError) {
                return NextResponse.json({ error: dbError.message }, { status: 500 });
            }
            return NextResponse.json({ ok: true, status: 'rejected' });
        }

        // ── approve: สร้างบัญชีจริง (Auth + โปรไฟล์) ก่อนมาร์คสถานะ ──
        const password = String(body.password ?? '');
        if (password.length < 6) {
            return NextResponse.json({ error: 'กรุณากำหนดรหัสผ่านเริ่มต้นอย่างน้อย 6 ตัว' }, { status: 400 });
        }
        // role ของผู้สมัคร — ผู้สมัครเลือกไม่ได้ ให้เป็น Teacher ตามประเภทการใช้งานหลัก
        const role = body.role === 'AudioVisual' || body.role === 'Operations' || body.role === 'Admin'
            ? body.role
            : 'Teacher';

        const admin = createAdminClient();
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email: req.email,
            password,
            email_confirm: true,
            user_metadata: { username: req.username, role, name: req.name },
        });
        if (authError) {
            const conflict = authError.code === 'email_exists';
            return NextResponse.json(
                { error: conflict ? 'อีเมลนี้เป็นสมาชิกในระบบอยู่แล้ว — ควรปฏิเสธคำขอนี้' : authError.message },
                { status: conflict ? 409 : 500 }
            );
        }
        const { error: profileError } = await admin
            .from('users')
            .insert(userToDb({
                id: authData.user.id,
                username: req.username,
                role,
                name: req.name,
                email: req.email,
                tel: req.tel ?? '',
                department: req.department ?? '',
                status: 'active',
            }));
        if (profileError) {
            await admin.auth.admin.deleteUser(authData.user.id); // กันข้อมูลค้างครึ่ง
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        const { data: updated, error: dbError } = await supabase
            .from('account_requests')
            .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
            .eq('id', body.id)
            .select()
            .single();
        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, status: 'approved', request: updated, user: userFromDb({
            id: authData.user.id, username: req.username, role, name: req.name,
            email: req.email, tel: req.tel ?? '', department: req.department ?? '', status: 'active',
        }) });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}
