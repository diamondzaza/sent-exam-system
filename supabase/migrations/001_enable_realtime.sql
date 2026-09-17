-- ═══════════════════════════════════════════════════════════
-- 001_enable_realtime.sql — เปิด Supabase Realtime ให้ตารางที่ต้องการ
-- แจ้งเตือน/อัปเดตสด ข้ามผู้ใช้แบบทันที
--
-- วิธีใช้: รันใน Supabase Dashboard → SQL Editor (รันครั้งเดียว)
-- หลังรัน: ทุก INSERT/UPDATE/DELETE ของตารางเหล่านี้จะถูกยิง event
--   ไปยังเบราว์เซอร์ของผู้ที่ล็อกอินอยู่ (ตามสิทธิ์ RLS ของแต่ละคน)
-- ═══════════════════════════════════════════════════════════

alter publication supabase_realtime add table exams;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table audit_logs;
