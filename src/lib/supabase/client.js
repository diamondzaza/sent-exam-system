/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: client.js (lib/supabase)
 * หน้าที่ของไฟล์นี้: สร้าง Supabase client สำหรับฝั่ง browser (client components) —
 *   ใช้ทุกที่ที่เรียก Supabase จากหน้าเว็บ เช่น ล็อกอิน, อ่านตาราง
 *   session เก็บใน cookies ผ่าน @supabase/ssr เพื่อให้ middleware/API ใช้ร่วมได้
 * วิธีใช้:  import { createClient } from '@/lib/supabase/client';
 *           const supabase = createClient();
 * ─────────────────────────────────────────────────────────
 */

import { createBrowserClient } from '@supabase/ssr';

/** URL ของโปรเจกต์ Supabase (ตั้งค่าใน .env.local) */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/** Anon key — ปลอดภัยกับฝั่ง client (ถูกจำกัดด้วย RLS) */
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** ตรวจว่าตั้งค่า env ของ Supabase ครบหรือยัง */
export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
