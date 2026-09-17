-- ═══════════════════════════════════════════════════════════
-- 002_account_requests.sql — ตารางคำขอเปิดบัญชี (ให้ผู้สมัครยื่นคำขอ
-- แล้วให้แอดมินอนุมัติ/ปฏิเสธ ก่อนสร้างบัญชีจริง)
--
-- วิธีใช้: รันใน Supabase Dashboard → SQL Editor (รันครั้งเดียว)
-- ═══════════════════════════════════════════════════════════

create table account_requests (
  id           uuid primary key default gen_random_uuid(),
  username     text not null,
  name         text not null,
  email        text not null,
  tel          text,
  department   text,
  reason       text,
  status       text not null default 'pending'
               check (status in ('pending', 'approved', 'rejected')),
  reviewed_by  uuid references users(id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

alter table account_requests enable row level security;

-- ใครก็ได้ (แม้ไม่ล็อกอิน) ยื่นคำขอได้ — แต่ไม่มีสิทธิ์อ่าน/แก้
create policy "req_public_insert" on account_requests
  for insert with check (true);

-- อ่านได้เฉพาะแอดมิน
create policy "req_admin_read" on account_requests
  for select using (is_role('Admin'));

-- แอดมินอัปเดตสถานะ (อนุมัติ/ปฏิเสธ) ได้เท่านั้น — ไม่มี delete
create policy "req_admin_update" on account_requests
  for update using (is_role('Admin'));
