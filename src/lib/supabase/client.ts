/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: client.ts (lib/supabase)
 * หน้าที่ของไฟล์นี้: จุดกลางสำหรับเชื่อมต่อ Supabase ในอนาคต —
 *   ตอนนี้ยังเป็น placeholder (อ่าน env และตรวจว่าตั้งค่าหรือยัง) ยังไม่ติดตั้ง
 *   @supabase/supabase-js จึงห้าม import ใดๆ จากแพ็กเกจนั้นที่นี่
 * ─────────────────────────────────────────────────────────
 */

/** URL ของโปรเจกต์ Supabase (ตั้งค่าใน .env.local) */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/** Anon key — ปลอดภัยกับฝั่ง client (ถูกจำกัดด้วย RLS) */
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Service role key — ใช้เฉพาะฝั่ง server (API routes) เท่านั้น ห้ามเผยแพร่ */
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/** ตรวจว่าตั้งค่า env ของ Supabase ครบหรือยัง */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/*
 * ── เมื่อพร้อมเชื่อมต่อจริง ──
 *
 * 1. ติดตั้ง:            npm install @supabase/supabase-js
 * 2. ตั้งค่า .env.local:  NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 3. สร้าง client:
 *
 *    import { createClient } from '@supabase/supabase-js';
 *    import { Database } from './database.types';
 *
 *    export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
 *
 * 4. สลับ implementation ใน src/lib/repositories/index.ts
 *    และตามขั้นตอนใน supabase/README.md
 */
