'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useCourses.js
 * หน้าที่ของไฟล์นี้: hook ดึงรายวิชาจาก API (/api/courses) —
 *   คืน [courses, setCourses, refresh]
 * ─────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useState } from 'react';

export function useCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/courses');
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            setCourses(data.courses ?? []);
        } catch {
            // เชื่อมต่อไม่ได้ — แสดงรายการว่าง
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return [courses, setCourses, refresh, loading];
}
