/**
 * ─────────────────────────────────────────────────────────
 ตัวช่วยสำหรับ API routes — ตรวจสิทธิ์จาก Bearer token
 * ─────────────────────────────────────────────────────────
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { userFromDb } from '@/lib/mappers';

/** สร้าง client ที่รันในนามผู้ใช้จาก JWT (คิวรี่ทุกอันจะถูกบังคับด้วย RLS) */
function clientWithToken(token) {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
        }
    );
}

function getBearer(request) {
    const header = request.headers.get('authorization') ?? '';
    return header.replace(/^Bearer\s+/i, '').trim();
}

/** ตรวจว่า request มาจากผู้ที่ล็อกอินหรือไม่ — คืน { supabase, user, profile } หรือ NextResponse 401 */
export async function requireUser(request) {
    const token = getBearer(request);
    if (!token) {
        return { error: NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 }) };
    }
    const supabase = clientWithToken(token);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
        return { error: NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 }) };
    }
    // โหลดโปรไฟล์ด้วย — หลาย route ใช้ profile.name / profile.role ต่อ
    const { data: row } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
    return { supabase, user: data.user, profile: row ? userFromDb(row) : null };
}

/** ตรวจว่าผู้ใช้มีบทบาทใดบทบาทหนึ่งที่อนุญาต — คืน { supabase, user, profile } หรือ NextResponse 401/403 */
export async function requireRole(roles, request) {
    const result = await requireUser(request);
    if (result.error)
        return result;
    const { supabase, user, profile } = result;
    if (!profile) {
        return { error: NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้' }, { status: 403 }) };
    }
    if (!roles.includes(profile.role)) {
        return { error: NextResponse.json({ error: 'ไม่มีสิทธิ์ทำรายการนี้' }, { status: 403 }) };
    }
    return { supabase, user, profile };
}

/** Admin client (service role) — ใช้เฉพาะใน API routes เท่านั้น ห้าม import ฝั่ง client */
export function createAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}
