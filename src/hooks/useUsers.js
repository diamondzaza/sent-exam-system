'use client';
import { authFetch } from '@/lib/supabase/client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useUsers.js
 * หน้าที่ของไฟล์นี้: hook ดึงรายชื่อผู้ใช้จาก API (/api/users) —
 *   ใช้โดยหน้า Admin (จัดการผู้ใช้) คืน [users, setUsers, refresh]
 * ─────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useState } from 'react';

export function useUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await authFetch('/api/users');
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            setUsers(data.users ?? []);
        } catch {
            // เชื่อมต่อไม่ได้ — แสดงรายการว่าง
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return [users, setUsers, refresh, loading];
}
