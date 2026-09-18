/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: route.js (api/exams/upload)
 * หน้าที่ของไฟล์นี้: อัปโหลดไฟล์ข้อสอบจริงขึ้น Supabase Storage —
 *   รับ multipart/form-data (file + e_no) ตรวจชนิด/ขนาดไฟล์
 *   (PDF/DOC/DOCX ไม่เกิน 25MB) แล้วเก็บใน bucket exam-files
 *   และอัปเดตคอลัมน์ file_* ของตาราง exams
 * ใช้โดย: อาจารย์ส่งข้อสอบใหม่ (หลังสร้างรายการ) และอัปโหลดฉบับใหม่แทนที่เดิม
 * ─────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { requireRole, createAdminClient } from '@/lib/api-helpers';

const BUCKET = 'exam-files';
const MAX_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_EXT = /\.(pdf|docx?)$/i;

/** ทำชื่อไฟล์ให้ปลอดภัยสำหรับ path ใน Storage (ตัดอักขระไทย/ช่องว่าง/อักขระพิเศษ) */
function sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request) {
    const { supabase, error } = await requireRole(['Teacher', 'Admin'], request);
    if (error)
        return error;
    try {
        const form = await request.formData();
        const file = form.get('file');
        const eNo = String(form.get('e_no') ?? '').trim();

        if (!(file instanceof File) || !eNo) {
            return NextResponse.json({ error: 'ต้องระบุไฟล์และรหัสข้อสอบ' }, { status: 400 });
        }
        if (!ALLOWED_EXT.test(file.name)) {
            return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ PDF หรือ DOCX' }, { status: 400 });
        }
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 25MB' }, { status: 400 });
        }

        // ตรวจว่าข้อสอบมีอยู่จริง
        const { data: exam, error: readError } = await supabase
            .from('exams')
            .select('e_no')
            .eq('e_no', eNo)
            .single();
        if (readError || !exam) {
            return NextResponse.json({ error: 'ไม่พบข้อสอบที่ระบุ' }, { status: 404 });
        }

        // อัปโหลดเข้า bucket (service role — ผ่าน API เท่านั้น ไม่ใช่จาก browser โดยตรง)
        const admin = createAdminClient();
        const path = `${eNo}/${sanitizeName(file.name)}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const { error: uploadError } = await admin.storage
            .from(BUCKET)
            .upload(path, buffer, {
                contentType: file.type || 'application/octet-stream',
                upsert: true, // อัปโหลดซ้ำแทนที่ไฟล์เดิม
            });
        if (uploadError) {
            return NextResponse.json({ error: `อัปโหลดไฟล์ไม่สำเร็จ: ${uploadError.message}` }, { status: 500 });
        }

        // อัปเดตข้อมูลไฟล์ลงตาราง exams — ใช้ admin client เพราะ RLS ของตาราง exams
        // อนุญาตให้ update เฉพาะโสตฯ/ดำเนินการ/แอดมิน (อาจารย์อัปเดตผ่าน RLS จะโดนบล็อกเงียบๆ)
        // สิทธิ์ถูกตรวจแล้วด้านบน (requireRole Teacher/Admin)
        const { error: dbError } = await admin
            .from('exams')
            .update({
                file_name: file.name,
                file_size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                file_path: path,
                upload_date: new Date().toISOString(),
            })
            .eq('e_no', eNo);
        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, path }, { status: 201 });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}
