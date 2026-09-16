/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: seed-data.js (scripts)
 * หน้าที่ของไฟล์นี้: นำข้อมูลตัวอย่างจาก src/data/mockData.js
 *   (รายวิชา, ข้อสอบ, การแจ้งเตือน) เข้าตาราง Supabase — รันหลัง create-users.js
 * วิธีรัน:  node --env-file=.env.local scripts/seed-data.js
 * หมายเหตุ: รันซ้ำได้ปลอดภัย (upsert — มีอยู่แล้วจะอัปเดตค่า)
 * ─────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { INITIAL_COURSES, INITIAL_EXAMS, INITIAL_NOTIFICATIONS } from '../src/data/mockData.js';
import { courseToDb, examToDb, notificationToDb } from '../src/lib/mappers.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seedTable(label, rows, insert) {
  if (!rows.length) {
    console.log(`• ${label}: ไม่มีข้อมูล`);
    return;
  }
  const { error } = await insert();
  if (error) {
    console.error(`✗ ${label}:`, error.message);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${label}: ${rows.length} รายการ`);
  }
}

async function main() {
  // แปลงรหัสอาจารย์แบบเก่า (T001/T002/T003 จาก mockData) → uuid จริงในตาราง users
  const { data: userRows, error: userError } = await supabase.from('users').select('id, username');
  if (userError || !userRows?.length) {
    console.error('✗ อ่านตาราง users ไม่สำเร็จ (รัน scripts/create-users.js ก่อน):', userError?.message);
    process.exit(1);
  }
  const teacherId = Object.fromEntries(
    Object.entries({
      T001: 'somchai.t',
      T002: 'waree.p',
      T003: 'prasit.k',
    }).map(([oldId, username]) => [oldId, userRows.find((u) => u.username === username)?.id])
  );
  const mapTeacher = (row) => ({
    ...row,
    teacher_id: teacherId[row.teacher_id] ?? row.teacher_id,
  });

  console.log('เริ่ม seed ข้อมูลเริ่มต้น...');
  await seedTable('รายวิชา', INITIAL_COURSES, () =>
    supabase.from('courses').upsert(INITIAL_COURSES.map((c) => courseToDb(mapTeacher(c))))
  );
  await seedTable('ข้อสอบ', INITIAL_EXAMS, () =>
    supabase.from('exams').upsert(INITIAL_EXAMS.map((e) => examToDb(mapTeacher(e))))
  );
  await seedTable('การแจ้งเตือน', INITIAL_NOTIFICATIONS, () =>
    supabase.from('notifications').insert(INITIAL_NOTIFICATIONS.map(notificationToDb))
  );
  console.log('เสร็จสิ้น');
}

main().catch((err) => {
  console.error('สคริปต์ล้มเหลว:', err.message);
  process.exit(1);
});
