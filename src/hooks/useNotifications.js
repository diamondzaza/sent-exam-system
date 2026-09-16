'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useNotifications.js
 * หน้าที่ของไฟล์นี้: hook ดึงการแจ้งเตือนที่ส่งถึงผู้ใช้จาก API
 *   (/api/notifications — RLS กรองตามบทบาทให้เอง) คืน [notifications, setNotifications, refresh]
 * ─────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useState } from 'react';

export function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications');
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            setNotifications(data.notifications ?? []);
        } catch {
            // เชื่อมต่อไม่ได้ — แสดงรายการว่าง
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return [notifications, setNotifications, refresh, loading];
}
