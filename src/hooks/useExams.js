'use client';
import { authFetch } from '@/lib/supabase/client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useExams.js
 * หน้าที่ของไฟล์นี้: hook ดึงข้อมูลข้อสอบจาก API (/api/exams) —
 *   คืน [exams, setExams, refresh]: ใช้ setExams สำหรับอัปเดตชั่วคราวบนหน้าจอ
 *   (optimistic) และ refresh() เพื่อดึงข้อมูลล่าสุดจากฐานข้อมูล
 * ─────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useState } from 'react';

export function useExams(enabled = true) {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await authFetch('/api/exams');
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            setExams(data.exams ?? []);
        } catch {
            // เชื่อมต่อไม่ได้ — แสดงรายการว่าง (ลองใหม่ด้วย refresh)
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled)
            return;
        refresh();
    }, [refresh, enabled]);

    return [exams, setExams, refresh, loading];
}
