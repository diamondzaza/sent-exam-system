/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: client.js (lib/supabase)
 * หน้าที่ของไฟล์นี้: สร้าง Supabase client ฝั่งเบราว์เซอร์แบบ "แยกต่อแท็บ" —
 *   session ถูกเก็บใน sessionStorage ไม่ใช่ cookie/localStorage จึงเกิดผลว่า:
 *   • เปิดหลายแท็บล็อกอินคนละบัญชีได้
 *   • ปิดแท็บ = ออกจากระบบทันที
 *   • ใครได้ลิงก์ไปต้องล็อกอินเสมอ (ทุกแท็บใหม่เริ่มจากหน้า login)
 * ─────────────────────────────────────────────────────────
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// Singleton — สร้าง GoTrueClient ครั้งเดียวต่อแท็บ 
let instance = null;

export function createClient() {
    if (!instance) {
        instance = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                // เก็บ session ใน sessionStorage = ขอบเขตต่อแท็บ
                storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false,
            },
        });
    }
    return instance;
}

/**
 * fetch ที่แนบ Bearer token ของ session ในแท็บนั้นๆ ให้อัตโนมัติ
 * ใช้แทน fetch ตรงๆ เมื่อเรียก /api/* ที่ต้องยืนยันตัวตน
 */
export async function authFetch(url, options = {}) {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    const headers = { ...(options.headers ?? {}) };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
}
