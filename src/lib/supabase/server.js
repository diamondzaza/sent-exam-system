/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: server.js (lib/supabase)
 * หน้าที่ของไฟล์นี้: สร้าง Supabase client สำหรับฝั่ง server —
 *   ใช้ใน API routes (src/app/api/**) เพื่ออ่าน session ของผู้ใช้จาก cookies
 *   และตรวจสิทธิ์ก่อนทำงานทุกครั้ง (ห้ามเรียกจาก client components!)
 * ─────────────────────────────────────────────────────────
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './client';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // เรียกจาก Server Component — ข้ามได้ (middleware จะ refresh ให้แทน)
        }
      },
    },
  });
}
