/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: route.js (api/issues)
 * หน้าที่ของไฟล์นี้: API แจ้งปัญหาการใช้งาน —
 *   POST (ผู้ใช้ที่ล็อกอินทุกบทบาท) — บันทึก audit log + สร้าง notification
 *   แจ้งเตือน Admin ทันที (ผ่าน admin client เพราะตาราง notifications
 *   ไม่มีนโยบาย INSERT ใน RLS)
 * ─────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { requireUser, createAdminClient } from '@/lib/api-helpers';
import { auditLogToDb, notificationToDb } from '@/lib/mappers';

export async function POST(request) {
    const { supabase, user, profile, error } = await requireUser(request);
    if (error)
        return error;
    try {
        const body = await request.json();
        if (!body.title || !body.detail) {
            return NextResponse.json({ error: 'กรุณาระบุหัวข้อปัญหาและรายละเอียด' }, { status: 400 });
        }
        const category = String(body.category || 'อื่น ๆ');
        const title = String(body.title).trim();
        const detail = String(body.detail).trim();
        const admin = createAdminClient();
        // Notification ถึง Admin และ Teacher — ทั้งสองฝ่ายติดตามรายงานได้ทันที
        const notifBase = {
            title: `แจ้งปัญหา: ${title}`,
            message: `[${category}] ${detail} — จาก ${profile.name} (${profile.role})`,
            type: 'warning',
        };
        const { error: notifError } = await admin.from('notifications').insert([
            notificationToDb({ ...notifBase, targetRole: 'Admin' }),
            notificationToDb({ ...notifBase, targetRole: 'Teacher' }),
        ]);
        if (notifError) {
            return NextResponse.json({ error: 'ส่งรายงานไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
        }
        // Audit log — ติดตามย้อนหลังได้ว่าใครแจ้งเมื่อไร
        await supabase.from('audit_logs').insert(auditLogToDb({
            userId: user.id, userName: profile.name, role: profile.role,
            action: 'REPORT_ISSUE', subjectId: category, subjectName: title,
            ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
            details: `แจ้งปัญหาการใช้งาน: ${detail}`,
        }));
        return NextResponse.json({ ok: true }, { status: 201 });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}
