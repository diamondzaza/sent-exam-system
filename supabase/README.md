# Supabase — คู่มือเชื่อมต่อภายหลัง

โปรเจกต์นี้**เตรียมโครงสร้างรองรับ Supabase ไว้แล้ว** แต่ยังไม่ได้เชื่อมต่อจริง
(ปัจจุบันแอปทำงานด้วย mock data + localStorage ทั้งหมด)

## โครงสร้างที่เตรียมไว้

| ไฟล์ | หน้าที่ |
|---|---|
| `supabase/schema.sql` | ตาราง + enum + Row Level Security ทั้ง 5 ตาราง (users, courses, exams, audit_logs, notifications) |
| `src/lib/supabase/client.js` | จุดเดียวสำหรับสร้าง Supabase client (ตอนนี้เป็น placeholder) |
| `src/lib/repositories/types.js` | interface ของชั้นจัดเก็บข้อมูล (UserRepository, ExamRepository ฯลฯ) |
| `src/lib/repositories/local.js` | implementation ปัจจุบัน (localStorage) |
| `src/lib/repositories/index.js` | factory — **จุดเดียวที่ต้องแก้ตอนสลับไป Supabase** |

## ขั้นตอนเชื่อมต่อ

1. **สมัคร/สร้างโปรเจกต์** — https://supabase.com → New project
2. **สร้างตาราง** — เปิด SQL Editor ใน Dashboard แล้วรัน `schema.sql` ทั้งไฟล์
3. **สร้าง Storage bucket** — ชื่อ `exam-files` (private) สำหรับเก็บไฟล์ข้อสอบ PDF/DOCX
4. **คัดลอกค่า env** — Dashboard → Settings → API แล้วสร้าง `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...   # ใช้เฉพาะฝั่ง server เท่านั้น
   ```
5. **ติดตั้งไลบรารี** — `npm install @supabase/supabase-js`
6. **เปิด client** —  uncomment ส่วนสร้าง client ใน `src/lib/supabase/client.js`
7. **เขียน implementation** — สร้าง `src/lib/repositories/supabase.js` ที่ implement
   interface ทุกตัวใน `types.js` แล้วสลับ factory ใน `repositories/index.js`
8. **ย้าย state จาก hooks ไปใช้ repository** ทีละส่วน (เริ่มจาก exams ซึ่งเป็น entity หลัก)

## ข้อควรระวังด้านความปลอดภัย

- **Audit log ต้องเขียนผ่าน Next.js API route (service role) เท่านั้น** — ห้ามเขียน
  จาก browser โดยตรง เพื่อไม่ให้ผู้ใช้แก้ไขประวัติย้อนหลังได้
- `SUPABASE_SERVICE_ROLE_KEY` ข้าม RLS ทั้งหมด — ห้ามใส่ตัวแปรที่ขึ้นต้น `NEXT_PUBLIC_`
- ตั้ง RLS ให้ครบทุกตารางก่อนใช้งานจริง (ใน `schema.sql` มีตัวอย่าง policy เริ่มต้น)
- ไฟล์ข้อสอบเป็นข้อมูลลับ — bucket ต้องเป็น private และอ่านผ่าน signed URL
