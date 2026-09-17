/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: route.js (api/exams/[eNo]/file)
 * หน้าที่ของไฟล์นี้: ขอลิงก์ดาวน์โหลดไฟล์ข้อสอบ —
 *   ออก Signed URL ที่หมดอายุใน 1 ชั่วโมง (ปลอดภัยกว่าลิงก์ตรง
 *   เพราะใช้ได้ชั่วคราวและผูกกับผู้ที่ล็อกอินเท่านั้น)
 *   ผู้ที่ล็อกอินทุกบทบาทขอได้ (การดาวน์โหลดถูกบันทึก audit log
 *   โดย frontend เรียก /api/audit-logs แยกต่างหาก)
 * ─────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { requireUser, createAdminClient } from '@/lib/api-helpers';

const BUCKET = 'exam-files';
const SIGNED_URL_TTL = 60 * 60; // 1 ชั่วโมง

export async function GET(request, { params }) {
    const { eNo } = await params;
    const { supabase, error } = await requireUser();
    if (error)
        return error;

    const { data: exam, error: readError } = await supabase
        .from('exams')
        .select('e_no, file_path')
        .eq('e_no', eNo)
        .single();
    if (readError || !exam) {
        return NextResponse.json({ error: 'ไม่พบข้อสอบนี้' }, { status: 404 });
    }
    if (!exam.file_path) {
        return NextResponse.json({ error: 'ข้อสอบนี้ยังไม่มีไฟล์แนบ' }, { status: 404 });
    }

    const admin = createAdminClient();
    const { data, error: urlError } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(exam.file_path, SIGNED_URL_TTL);
    if (urlError || !data) {
        return NextResponse.json({ error: `สร้างลิงก์ดาวน์โหลดไม่สำเร็จ: ${urlError?.message ?? ''}` }, { status: 500 });
    }
    return NextResponse.json({ url: data.signedUrl, expiresIn: SIGNED_URL_TTL });
}
