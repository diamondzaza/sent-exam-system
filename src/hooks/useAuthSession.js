'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useAuthSession.js
 * หน้าที่ของไฟล์นี้: hook เชื่อมต่อ Supabase Auth จริง —
 *   ตรวจว่าผู้ใช้ล็อกอินอยู่หรือไม่ และติดตามการเปลี่ยนแปลง session
 *   (ล็อกอิน/ออกจากระบบที่แท็บอื่นก็รับรู้ทันที)
 * ค่าที่คืน: 'loading' (กำลังตรวจ) | 'authenticated' (ล็อกอินแล้ว) | 'guest' (ยังไม่ล็อกอิน)
 * ─────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAuthSession() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const supabase = createClient();

    // ตรวจ session ปัจจุบันตอนเปิดหน้าเว็บ
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? 'authenticated' : 'guest');
    });

    // ติดตามการล็อกอิน/ออกจากระบบทุกแท็บ
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? 'authenticated' : 'guest');
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return status;
}
