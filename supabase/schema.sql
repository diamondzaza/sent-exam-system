-- ═══════════════════════════════════════════════════════════
-- schema.sql — โครงสร้างฐานข้อมูล Supabase สำหรับระบบจัดส่ง/จัดพิมพ์ข้อสอบ
-- คณะวิทยาศาสตร์ (เตรียมไว้ใช้เมื่อเชื่อมต่อจริง)
--
-- วิธีใช้: สร้างโปรเจกต์ที่ https://supabase.com แล้วรัน SQL นี้ใน
--   SQL Editor ของ Supabase Dashboard
-- ตารางออกแบบให้ตรงกับ src/lib/supabase/database.types.ts และ
--   src/types/entities.ts
-- ═══════════════════════════════════════════════════════════

-- ── Enum types ──
create type user_role   as enum ('Teacher', 'AudioVisual', 'Operations', 'Admin');
create type user_status as enum ('active', 'inactive');
create type exam_status as enum (
  'DRAFT', 'SUBMITTED', 'REJECTED', 'VERIFIED',
  'PRINTING', 'PRINTED', 'DELIVERED_OD', 'READY_FOR_EXAM'
);
create type audit_action as enum (
  'LOGIN', 'VIEW_EXAM', 'DOWNLOAD_EXAM', 'PRINT_EXAM', 'PRINT_ENVELOPE',
  'UPLOAD_EXAM', 'REUPLOAD_EXAM', 'DELETE_EXAM', 'UPDATE_STATUS'
);
create type notif_type as enum ('info', 'success', 'warning', 'error');

-- ── ผู้ใช้ (REQ-0002) ──
create table users (
  id         text primary key,              -- เช่น T001, AVD01 (หรือ uuid จาก auth.users)
  username   text not null unique,
  role       user_role not null,
  name       text not null,
  email      text not null,
  tel        text not null,
  department text not null,
  location   text,
  avatar     text,
  status     user_status not null default 'active',
  created_at timestamptz not null default now()
);

-- ── รายวิชา ──
create table courses (
  id            uuid primary key default gen_random_uuid(),
  course_id     text not null,              -- เช่น CS211
  course_name   text not null,
  course_year   text not null,              -- พ.ศ. เช่น 2567
  term          text not null,
  sec           text not null,
  credits       int  not null,
  student_count int  not null,
  teacher_id    text not null references users(id),
  teacher_name  text not null,
  created_at    timestamptz not null default now(),
  unique (course_id, course_year, term, sec)
);

-- ── ข้อสอบ (entity หลัก — 8 สถานะ) ──
create table exams (
  e_no              text primary key,       -- เช่น EX-2567-001
  e_date            date not null,
  e_time            text not null,
  subject_id        text not null,
  subject_name      text not null,
  exam_type         text not null,          -- 'กลางภาค' | 'ปลายภาค' | 'สอบแก้ตัว'
  course_year       text not null,
  term              text not null,
  teacher_id        text not null references users(id),
  teacher_name      text not null,
  teacher_tel       text not null,
  room              text not null,
  total_pages       int  not null,
  total_copies      int  not null,
  copies_reserve    int  not null default 0,
  status            exam_status not null default 'DRAFT',
  file_name         text,
  file_size         text,
  file_path         text,                   -- path ใน Supabase Storage (bucket: exam-files)
  upload_date       timestamptz,
  checked_by        text,
  verified_date     timestamptz,
  print_date        timestamptz,
  envelope_notes    text,
  allowed_materials text[],
  rejection_reason  text,
  proctors          text[],
  created_at        timestamptz not null default now()
);

-- ── Security Audit Log (ห้ามแก้ไข/ลบย้อนหลัง — บันทึกฝั่ง server เท่านั้น) ──
create table audit_logs (
  id           uuid primary key default gen_random_uuid(),
  timestamp    timestamptz not null default now(),
  user_id      text not null references users(id),
  user_name    text not null,
  role         user_role not null,
  action       audit_action not null,
  subject_id   text not null,
  subject_name text,
  ip_address   text not null,
  details      text not null
);

-- ── การแจ้งเตือน (targetRole = บทบาทผู้รับ หรือ ALL) ──
create table notifications (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  message         text not null,
  timestamp       text not null,            -- ข้อความเวลาแบบไทย เช่น '10 นาทีที่แล้ว'
  target_role     user_role check (target_role in ('Teacher','AudioVisual','Operations','Admin')),
  type            notif_type not null default 'info',
  is_read         boolean not null default false,
  related_exam_no text references exams(e_no),
  created_at      timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- Row Level Security (RLS) — สิทธิ์ตามบทบาท
-- หมายเหตุ: helper is_role() อ่านบทบาทจาก JWT (คอลัมน์ user_metadata.role)
-- ═══════════════════════════════════════════════════════════

create or replace function is_role(r user_role) returns boolean
language sql stable security definer as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = r::text, false
  );
$$;

alter table users enable row level security;
alter table courses enable row level security;
alter table exams enable row level security;
alter table audit_logs enable row level security;
alter table notifications enable row level security;

-- users: ทุกคนที่ล็อกอินอ่านได้ / แอดมินเท่านั้นที่แก้ได้
create policy "users_read" on users for select using (auth.role() = 'authenticated');
create policy "users_admin_write" on users for all using (is_role('Admin'));

-- courses: อ่านได้ทุกบทบาท / ครูเพิ่มวิชาของตัวเองได้
create policy "courses_read" on courses for select using (auth.role() = 'authenticated');
create policy "courses_teacher_insert" on courses for insert
  with check (teacher_id = auth.uid()::text or is_role('Admin'));

-- exams: อ่านได้ทุกบทบาท (ตามขอบเขตที่ UI กรอง) / เปลี่ยนสถานะโดยโสตฯ หรือดำเนินการ
create policy "exams_read" on exams for select using (auth.role() = 'authenticated');
create policy "exams_teacher_write" on exams for insert
  with check (is_role('Teacher') or is_role('Admin'));
create policy "exams_staff_update" on exams for update
  using (is_role('AudioVisual') or is_role('Operations') or is_role('Admin'));

-- audit_logs: อ่านได้เฉพาะแอดมิน / สร้างได้ (service role ผ่าน API route) — ไม่มี update/delete
create policy "audit_admin_read" on audit_logs for select using (is_role('Admin'));
create policy "audit_insert" on audit_logs for insert with check (auth.role() = 'authenticated');

-- notifications: อ่านเฉพาะที่ตรงบทบาทตัวเอง / ทำเครื่องหมายอ่านแล้วได้
create policy "notif_read" on notifications for select
  using (target_role = 'ALL' or target_role::text = (auth.jwt() -> 'user_metadata' ->> 'role'));
create policy "notif_update_read" on notifications for update using (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════
-- Storage — bucket สำหรับไฟล์ข้อสอบ (PDF/DOCX, จำกัด 25MB)
-- ตั้งค่าผ่าน Dashboard > Storage หรือ:
--   insert into storage.buckets (id, name, public) values ('exam-files', 'exam-files', false);
-- นโยบาย: อ่านได้เฉพาะผู้ล็อกอิน อัปโหลดโดยครู/โสตฯ
-- ═══════════════════════════════════════════════════════════
