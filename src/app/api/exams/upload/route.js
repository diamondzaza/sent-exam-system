/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: route.js (api/exams/upload)
 * หน้าที่ของไฟล์นี้: ลงทะเบียน metadata ของไฟล์ข้อสอบที่อัปโหลดแล้ว —
 *   Browser อัปโหลดไฟล์ตรงเข้า Supabase Storage (bucket exam-files,
 *   ผ่าน storage policy) แล้วเรียก route นี้ด้วย JSON เพื่อบันทึก
 *   file_name / file_size / file_path ลงตาราง exams
 *   (ไฟล์ไม่ผ่าน Vercel function เลย — เลี่ยง body limit 4.5MB)
 * รับ: JSON { e_no, file_name, file_size, file_path }
 * ─────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { requireRole, createAdminClient } from '@/lib/api-helpers';

const BUCKET = 'exam-files';
const ALLOWED_EXT = /\.(pdf|docx?)$/i;

export async function POST(request) {
    const { error } = await requireRole(['Teacher', 'Admin'], request);
    if (error)
        return error;
    try {
        const body = await request.json();
        const eNo = String(body.e_no ?? '').trim();
        const filePath = String(body.file_path ?? '').trim();
        const fileName = String(body.file_name ?? '').trim();
        const fileSize = String(body.file_size ?? '').trim();

        if (!eNo || !filePath || !fileName) {
            return NextResponse.json({ error: 'ต้องระบุ e_no, file_name และ file_path' }, { status: 400 });
        }
        // file_path ต้องอยู่ใต้ folder ของข้อสอบนั้นเท่านั้น (กันเขียนทับไฟล์ข้อสอบอื่น)
        if (!filePath.startsWith(`${eNo}/`)) {
            return NextResponse.json({ error: 'file_path ไม่อยู่ในขอบเขตของข้อสอบนี้' }, { status: 400 });
        }
        if (!ALLOWED_EXT.test(fileName)) {
            return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ PDF หรือ DOCX' }, { status: 400 });
        }

        // ตรวจว่าข้อสอบมีอยู่จริง และไฟล์ถูกอัปโหลดขึ้น Storage จริง (กันปลอม file_path)
        const admin = createAdminClient();
        const { data: exam, error: readError } = await admin
            .from('exams')
            .select('e_no')
            .eq('e_no', eNo)
            .single();
        if (readError || !exam) {
            return NextResponse.json({ error: 'ไม่พบข้อสอบที่ระบุ' }, { status: 404 });
        }
        const { data: objects, error: listError } = await admin.storage.from(BUCKET).list(eNo);
        if (listError) {
            return NextResponse.json({ error: `ตรวจไฟล์ใน Storage ไม่สำเร็จ: ${listError.message}` }, { status: 500 });
        }
        const exists = (objects ?? []).some((o) => `${eNo}/${o.name}` === filePath);
        if (!exists) {
            return NextResponse.json({ error: 'ไม่พบไฟล์ใน Storage — กรุณาอัปโหลดไฟล์ก่อน' }, { status: 404 });
        }

        // บันทึก metadata ลงตาราง exams — ใช้ admin client เพราะ RLS ของตาราง exams
        // อนุญาต update เฉพาะโสตฯ/ดำเนินการ/แอดมิน (อาจารย์อัปเดตผ่าน RLS จะโดนบล็อกเงียบๆ)
        // สิทธิ์ถูกตรวจแล้วด้านบน (requireRole Teacher/Admin)
        const { error: dbError } = await admin
            .from('exams')
            .update({
                file_name: fileName,
                file_size: fileSize || null,
                file_path: filePath,
                upload_date: new Date().toISOString(),
            })
            .eq('e_no', eNo);
        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, path: filePath }, { status: 201 });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}
