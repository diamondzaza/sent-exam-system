/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: route.js (api/users)
 * หน้าที่ของไฟล์นี้: API จัดการผู้ใช้ (Admin เท่านั้น ยกเว้น GET) —
 *   GET    อ่านรายชื่อผู้ใช้ (ผู้ที่ล็อกอินทุกบทบาท — Header/Admin ใช้)
 *   POST   เพิ่มผู้ใช้ใหม่: สร้างบัญชี Auth (อีเมล + รหัสผ่าน) และ
 *          บันทึกโปรไฟล์ลงตาราง users ในครั้งเดียว
 *   PATCH  แก้ไขโปรไฟล์ / เปลี่ยนรหัสผ่าน / เปิด-ปิดสถานะ
 *   DELETE ลบผู้ใช้ (ทั้งโปรไฟล์และบัญชี Auth)
 * ─────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { requireUser, requireRole, createAdminClient } from '@/lib/api-helpers';
import { userToDb, userFromDb } from '@/lib/mappers';

export async function GET() {
    const { supabase, error } = await requireUser();
    if (error)
        return error;
    const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json({ users: (data ?? []).map(userFromDb) });
}

export async function POST(request) {
    const { error } = await requireRole(['Admin']);
    if (error)
        return error;
    try {
        const body = await request.json();
        const password = body.password ?? '';
        if (!body.username || !body.email || !body.role || password.length < 6) {
            return NextResponse.json(
                { error: 'ข้อมูลไม่ครบ (username, email, role และรหัสผ่านอย่างน้อย 6 ตัว)' },
                { status: 400 }
            );
        }
        // 1) สร้างบัญชี Auth — role ใส่ใน user_metadata เพื่อให้ RLS ตรวจสิทธิ์ได้
        const admin = createAdminClient();
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email: body.email,
            password,
            email_confirm: true,
            user_metadata: { username: body.username, role: body.role, name: body.name },
        });
        if (authError) {
            const conflict = authError.code === 'email_exists';
            return NextResponse.json(
                { error: conflict ? 'อีเมลนี้ถูกใช้สร้างบัญชีแล้ว' : authError.message },
                { status: conflict ? 409 : 500 }
            );
        }
        // 2) บันทึกโปรไฟล์ลงตาราง users (id เดียวกับบัญชี Auth)
        const profile = userToDb({ ...body, id: authData.user.id });
        const { data: row, error: dbError } = await admin
            .from('users')
            .insert(profile)
            .select()
            .single();
        if (dbError) {
            // โปรไฟล์บันทึกไม่สำเร็จ — ลบบัญชี Auth ทิ้งเพื่อไม่ให้ข้อมูลค้างครึ่ง
            await admin.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }
        return NextResponse.json({ user: userFromDb(row) }, { status: 201 });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}

export async function PATCH(request) {
    const { supabase, user, error } = await requireRole(['Admin']);
    if (error)
        return error;
    try {
        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: 'ไม่พบรหัสผู้ใช้' }, { status: 400 });
        }
        // เปลี่ยนรหัสผ่าน (ถ้าระบุมา)
        if (body.password) {
            if (body.password.length < 6) {
                return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว' }, { status: 400 });
            }
            const admin = createAdminClient();
            const { error: pwError } = await admin.auth.admin.updateUserById(body.id, {
                password: body.password,
            });
            if (pwError) {
                return NextResponse.json({ error: pwError.message }, { status: 500 });
            }
        }
        // แก้ไขโปรไฟล์ — เลือกเฉพาะฟิลด์ที่ส่งมาจริง (กัน undefined ชน NOT NULL)
        const { id, password, ...patch } = body;
        const ALLOWED_USER_FIELDS = [
            'username', 'role', 'name', 'email', 'tel', 'department', 'location', 'avatar', 'status',
        ];
        const dbPatch = {};
        for (const field of ALLOWED_USER_FIELDS) {
            if (patch[field] !== undefined)
                dbPatch[field] = patch[field] ?? null;
        }
        if (Object.keys(dbPatch).length > 0) {
            const { error: dbError } = await supabase
                .from('users')
                .update(dbPatch)
                .eq('id', id);
            if (dbError) {
                return NextResponse.json({ error: dbError.message }, { status: 500 });
            }
        }
        // ถ้าแอดมินแก้โปรไฟล์ตัวเอง — คืนข้อมูลใหม่ให้ frontend อัปเดตทันที
        const { data: row } = await supabase.from('users').select('*').eq('id', id).single();
        return NextResponse.json({ user: row ? userFromDb(row) : null });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}

export async function DELETE(request) {
    const { user, error } = await requireRole(['Admin']);
    if (error)
        return error;
    try {
        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: 'ไม่พบรหัสผู้ใช้' }, { status: 400 });
        }
        if (body.id === user.id) {
            return NextResponse.json({ error: 'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้' }, { status: 400 });
        }
        // ลบทั้งบัญชี Auth และแถวโปรไฟล์ (FK ของตารางอื่นอ้าง users — ถ้ามีข้อมูลผูกอยู่จะลบไม่ได้)
        const admin = createAdminClient();
        const { error: authError } = await admin.auth.admin.deleteUser(body.id);
        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }
        const { error: dbError } = await createAdminClient()
            .from('users')
            .delete()
            .eq('id', body.id);
        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}
