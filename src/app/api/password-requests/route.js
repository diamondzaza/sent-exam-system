/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: route.js (api/password-requests)
 * หน้าที่ของไฟล์นี้: API คำขอเปลี่ยนรหัสผ่าน —
 *   POST  ยื่นคำขอ (สาธารณะ — ผู้ใช้กรอกอีเมล + รหัสผ่านใหม่ที่ต้องการ)
 *         เก็บไว้ให้แอดมินตรวจและเปลี่ยนให้ (รหัสผ่านจะถูกลบทิ้งทันทีเมื่อดำเนินการแล้ว)
 *   GET   อ่านคำขอทั้งหมด (Admin เท่านั้น — ไม่ส่งรหัสผ่านกลับไปที่ browser)
 *   PATCH ดำเนินการ: apply = เปลี่ยนรหัสผ่านจริง / reject = ปฏิเสธ (Admin เท่านั้น)
 * ─────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { requireRole, createAdminClient } from '@/lib/api-helpers';
import { validatePassword } from '@/lib/password';
import { auditLogToDb } from '@/lib/mappers';

export async function POST(request) {
    try {
        const body = await request.json();
        const email = String(body.email ?? '').trim().toLowerCase();
        const password = String(body.password ?? '').trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 });
        }
        // นโยบายรหัสผ่านเดียวกับทั้งระบบ
        const pwIssues = validatePassword(password);
        if (pwIssues.length > 0) {
            return NextResponse.json({ error: `รหัสผ่านต้อง${pwIssues.join(', ')}` }, { status: 400 });
        }
        const supabase = createSupabaseAnon();
        // ต้องมีบัญชีอยู่จริง (เช็คผ่านตารางโปรไฟล์) — และห้ามเป็นบัญชี Admin (กันแอบเปลี่ยนรหัสแอดมิน)
        const { data: profile } = await supabase
            .from('users')
            .select('id, name, role')
            .eq('email', email)
            .single();
        if (!profile) {
            return NextResponse.json({ error: 'ไม่พบอีเมลนี้ในระบบ — ตรวจสอบอีเมลอีกครั้ง' }, { status: 404 });
        }
        if (profile.role === 'Admin') {
            return NextResponse.json({ error: 'บัญชีผู้ดูแลระบบไม่สามารถขอเปลี่ยนรหัสผ่านผ่านฟอร์มนี้ได้' }, { status: 403 });
        }
        const admin = createAdminClient();
        // มีคำขอ pending ของอีเมลนี้อยู่แล้ว — แทนที่ด้วยคำขอใหม่
        await admin.from('password_requests').delete().eq('email', email).eq('status', 'pending');
        const { error: dbError } = await admin.from('password_requests').insert({
            email,
            name: profile.name ?? null,
            requested_password: password, // เก็บชั่วคราวเพื่อให้แอดมินเปลี่ยนให้ — ลบทิ้งทันทีเมื่อดำเนินการ
            status: 'pending',
        });
        if (dbError) {
            return NextResponse.json({ error: 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
        }
        // แจ้งเตือน Admin
        await admin.from('notifications').insert({
            title: 'คำขอเปลี่ยนรหัสผ่าน',
            message: `${profile.name ?? email} ขอเปลี่ยนรหัสผ่านของบัญชี ${email} — ดำเนินการที่เมนู "คำขอเปลี่ยนรหัสผ่าน"`,
            target_role: 'Admin',
            type: 'warning',
        });
        return NextResponse.json({ ok: true }, { status: 201 });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}

function createSupabaseAnon() {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
    );
}

/** อ่านคำขอ — Admin เท่านั้น (ผ่าน admin client — ตารางนี้ไม่เปิด SELECT ให้ public) */
export async function GET(request) {
    const { error } = await requireRole(['Admin'], request);
    if (error)
        return error;
    const admin = createAdminClient();
    const { data, error: dbError } = await admin
        .from('password_requests')
        .select('id, email, name, reason, status, created_at, requested_password')
        .order('created_at', { ascending: false });
    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json({ requests: data ?? [] });
}

/** ดำเนินการคำขอ — Admin เท่านั้น */
export async function PATCH(request) {
    const { user, error } = await requireRole(['Admin'], request);
    if (error)
        return error;
    try {
        const body = await request.json();
        if (!body.id || !['apply', 'reject'].includes(body.action)) {
            return NextResponse.json({ error: 'ข้อมูลไม่ครบ (id, action)' }, { status: 400 });
        }
        const admin = createAdminClient();
        const { data: req, error: readError } = await admin
            .from('password_requests')
            .select('*')
            .eq('id', body.id)
            .single();
        if (readError || !req) {
            return NextResponse.json({ error: 'ไม่พบคำขอนี้' }, { status: 404 });
        }
        if (req.status !== 'pending') {
            return NextResponse.json({ error: 'คำขอนี้ถูกดำเนินการไปแล้ว' }, { status: 409 });
        }
        if (body.action === 'apply') {
            // เปลี่ยนรหัสผ่านจริง — หา id ของบัญชีจากอีเมลในโปรไฟล์
            const { data: profile } = await admin
                .from('users')
                .select('id')
                .eq('email', req.email)
                .single();
            if (!profile) {
                return NextResponse.json({ error: 'ไม่พบบัญชีของอีเมลนี้แล้ว (อาจถูกลบไปก่อนหน้า)' }, { status: 404 });
            }
            const { error: pwError } = await admin.auth.admin.updateUserById(profile.id, {
                password: req.requested_password,
            });
            if (pwError) {
                return NextResponse.json({ error: pwError.message }, { status: 500 });
            }
            await admin.from('audit_logs').insert(auditLogToDb({
                userId: user.id, userName: user.email ?? 'admin', role: 'Admin',
                action: 'UPDATE_STATUS', subjectId: req.email, subjectName: req.name ?? null,
                ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
                details: `เปลี่ยนรหัสผ่านของบัญชี ${req.email} ตามคำขอของผู้ใช้ (รหัสใหม่ตามที่ผู้ใช้ระบุ)`,
            }));
        }
        // มาร์คสถานะ + ลบรหัสผ่านที่เก็บไว้ทันที (ความปลอดภัย)
        const { error: updateError } = await admin
            .from('password_requests')
            .update({ status: body.action === 'apply' ? 'done' : 'rejected', reviewed_at: new Date().toISOString(), requested_password: null })
            .eq('id', body.id);
        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, status: body.action === 'apply' ? 'done' : 'rejected' });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}
