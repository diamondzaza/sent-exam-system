/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: route.js (api/courses)
 * หน้าที่ของไฟล์นี้: API จัดการรายวิชา —
 *   GET  อ่านรายวิชาทั้งหมด (ผู้ที่ล็อกอินทุกบทบาท)
 *   POST เพิ่มรายวิชาใหม่ (Teacher/Admin)
 * ─────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/api-helpers';
import { courseToDb, courseFromDb } from '@/lib/mappers';

export async function GET(request) {
    const { supabase, error } = await requireUser(request);
    if (error)
        return error;
    const { data, error: dbError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json({ courses: (data ?? []).map(courseFromDb) });
}

export async function POST(request) {
    const { supabase, error } = await requireRole(['Teacher', 'Admin'], request);
    if (error)
        return error;
    try {
        const body = await request.json();
        if (!body.Course_id || !body.Course_Name) {
            return NextResponse.json({ error: 'ข้อมูลรายวิชาไม่ครบถ้วน' }, { status: 400 });
        }
        const { data, error: dbError } = await supabase
            .from('courses')
            .insert(courseToDb(body))
            .select()
            .single();
        if (dbError) {
            const conflict = dbError.code === '23505';
            return NextResponse.json(
                { error: conflict ? 'รายวิชานี้ (รหัส/ปีการศึกษา/ภาคเรียน/ตอน) มีอยู่แล้ว' : dbError.message },
                { status: conflict ? 409 : 500 }
            );
        }
        return NextResponse.json({ course: courseFromDb(data) }, { status: 201 });
    }
    catch {
        return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
}
