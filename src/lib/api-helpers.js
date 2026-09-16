/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: api-helpers.js
 * หน้าที่ของไฟล์นี้: ตัวช่วยสำหรับ API routes — ตรวจ session ผู้ใช้,
 *   ตรวจบทบาท (role) และสร้าง admin client (service role) สำหรับงานที่
 *   ต้องข้าม RLS เช่น สร้างบัญชีผู้ใช้ (ใช้เฉพาะฝั่ง server เท่านั้น)
 * ─────────────────────────────────────────────────────────
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { userFromDb } from '@/lib/mappers';

/** ตรวจว่า request มาจากผู้ที่ล็อกอินหรือไม่ — คืน { supabase, user } หรือ NextResponse 401 */
export async function requireUser() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
        return { error: NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 }) };
    }
    return { supabase, user: data.user };
}

/** ตรวจว่าผู้ใช้มีบทบาทใดบทบาทหนึ่งที่อนุญาต — คืน { supabase, user, profile } หรือ NextResponse 401/403 */
export async function requireRole(roles) {
    const result = await requireUser();
    if (result.error)
        return result;
    const { supabase, user } = result;
    const { data: row, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
    if (error || !row) {
        return { error: NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้' }, { status: 403 }) };
    }
    const profile = userFromDb(row);
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
