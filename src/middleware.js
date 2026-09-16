/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: middleware.js
 * หน้าที่ของหน้านี้: middleware ของ Next.js — รันทุก request โดยอัตโนมัติ
 *   ทำหน้าที่รีเฟรช session ของ Supabase Auth (token หมดอายุ 1 ชั่วโมง
 *   middleware เขียน cookies ใหม่ให้ ทำให้ล็อกอินค้างได้ไม่มีวันหลุดกลางคัน)
 * หมายเหตุ: การบังคับล็อกอินทำ 2 ชั้น — หน้าเว็บ (AppShell login gate)
 *   และ API routes (ตรวจ session ฝั่ง server ในระยะที่ 2)
 * ─────────────────────────────────────────────────────────
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // สำคัญ: เรียก getUser() เพื่อให้ middleware refresh token ให้ทุก request
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * รันทุก path ยกเว้นไฟล์ static ของ Next.js (_next/static, _next/image)
     * และไฟล์รูป/ไอคอน (favicon, svg, png ฯลฯ)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
