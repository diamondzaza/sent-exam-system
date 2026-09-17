'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useRealtimeSync.js
 * หน้าที่ของไฟล์นี้: hook เชื่อม Supabase Realtime — ฟังการเปลี่ยนแปลง
 *   ของตาราง exams / notifications / audit_logs แล้วเรียก refresh
 *   ให้หน้าจออัปเดตทันทีโดยไม่ต้องรีเฟรชหน้า
 * ข้อกำหนด: ต้องเปิด publication ให้ตารางก่อน (ดู supabase/migrations/001_enable_realtime.sql)
 * ความปลอดภัย: ผู้ใช้รับเฉพาะ event ของแถวที่ RLS อนุญาตให้ตัวเองเห็น
 * ─────────────────────────────────────────────────────────
 */

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeSync(enabled, { onExamsChange, onNotificationsChange, onAuditLogsChange }) {
    useEffect(() => {
        if (!enabled)
            return;
        const supabase = createClient();
        const channel = supabase
            .channel('exam-system-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => onExamsChange?.())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => onNotificationsChange?.())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => onAuditLogsChange?.())
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [enabled, onExamsChange, onNotificationsChange, onAuditLogsChange]);
}
