-- ═══════════════════════════════════════════════════════════
-- 001_enable_realtime.sql — เปิด Supabase Realtime ให้ตารางที่ต้องการ
-- แจ้งเตือน/อัปเดตสด ข้ามผู้ใช้แบบทันที
-- ═══════════════════════════════════════════════════════════

alter publication supabase_realtime add table exams;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table audit_logs;
