'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useAuditLogs.js
 * หน้าที่ของไฟล์นี้: hook ดึงบันทึกเหตุการณ์ความปลอดภัยจาก API
 *   (/api/audit-logs — Admin เท่านั้นที่อ่านได้) คืน [auditLogs, setAuditLogs, refresh]
 * ─────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useState } from 'react';

export function useAuditLogs() {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/audit-logs');
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            setAuditLogs(data.logs ?? []);
        } catch {
            // ไม่ใช่ Admin หรือเชื่อมต่อไม่ได้ — แสดงรายการว่าง
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return [auditLogs, setAuditLogs, refresh, loading];
}
