/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: create-users.js (scripts)
 * หน้าที่ของไฟล์นี้: สคริปต์สร้างบัญชีผู้ใช้เริ่มต้น 5 บัญชีลง Supabase —
 *   สร้างทั้งบัญชี Auth (อีเมล + รหัสผ่าน) และแถวในตาราง users
 *   (รวมถึง user_metadata.role ซึ่ง RLS policy ใช้ตรวจสิทธิ์)
 * วิธีรัน:  node --env-file=.env.local scripts/create-users.js
 * หมายเหตุ: รันซ้ำได้ปลอดภัย — บัญชีที่มีอยู่แล้วจะถูกข้าม (แล้วอัปเดตแถวในตารางแทน)
 * ─────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';

// ใช้ service role key — สคริปต์นี้รันฝั่งเครื่องเราเท่านั้น ห้ามเอาไปใช้ในเบราว์เซอร์
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEFAULT_PASSWORD = 'sci123456';

const ACCOUNTS = [
  {
    username: 'somchai.t',
    role: 'Teacher',
    name: 'ผศ.ดร.สมชาย ใจดี',
    email: 'somchai.j@sci.ac.th',
    tel: '081-234-5678',
    department: 'สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์',
    location: null,
  },
  {
    username: 'waree.p',
    role: 'Teacher',
    name: 'รศ.ดร.วารี สุขสวัสดิ์',
    email: 'waree.s@sci.ac.th',
    tel: '089-987-6543',
    department: 'สาขาวิชาคณิตศาสตร์และสถิติ คณะวิทยาศาสตร์',
    location: null,
  },
  {
    username: 'av.staff1',
    role: 'AudioVisual',
    name: 'นายกิตติศักดิ์ ช่างพิมพ์ (หน่วยโสตฯ)',
    email: 'audiovisual@sci.ac.th',
    tel: '02-555-2000 ต่อ 1204',
    department: 'หน่วยเทคโนโลยีการศึกษา (ฝ่ายโสตฯ)',
    location: 'อาคารวิทยาการ ชั้น 2 ห้องปฏิบัติการผลิตสื่อและจัดพิมพ์',
  },
  {
    username: 'ops.officer',
    role: 'Operations',
    name: 'นางสาวธนภรณ์ อำนวยการ (ฝ่ายดำเนินการสอบ)',
    email: 'exam-ops@sci.ac.th',
    tel: '02-555-2000 ต่อ 1100',
    department: 'ฝ่ายดำเนินการสอบและทะเบียนกลาง',
    location: 'อาคารเรียนรวม ศูนย์อำนวยการสอบ ชั้น 1',
  },
  {
    username: 'admin.sci',
    role: 'Admin',
    name: 'นายผู้ดูแลระบบ ศูนย์สารสนเทศ',
    email: 'admin-it@sci.ac.th',
    tel: '02-555-2000 ต่อ 1001',
    department: 'ศูนย์เทคโนโลยีสารสนเทศ คณะวิทยาศาสตร์',
    location: null,
  },
];

async function findAuthUserIdByEmail(email) {
  // paginated listUsers — หา id ของบัญชีที่สร้างไว้แล้ว
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  console.log('เริ่มสร้างบัญชีผู้ใช้... (รหัสผ่านร่วม: %s)', DEFAULT_PASSWORD);

  for (const acc of ACCOUNTS) {
    // 1) สร้างบัญชี Auth (role ใส่ใน user_metadata — RLS policy อ่านจากจุดนี้)
    let userId = await findAuthUserIdByEmail(acc.email);
    let created = false;

    if (userId) {
      console.log(`• [${acc.username}] มีบัญชี Auth อยู่แล้ว — ข้ามการสร้าง`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true, // ไม่ต้องยืนยันอีเมล (โหมดภายในคณะ)
        user_metadata: { username: acc.username, role: acc.role, name: acc.name },
      });
      if (error) {
        console.error(`✗ [${acc.username}] สร้างบัญชี Auth ไม่สำเร็จ:`, error.message);
        continue;
      }
      userId = data.user.id;
      created = true;
    }

    // 2) บันทึกโปรไฟล์ลงตาราง users (upsert — มีอยู่แล้วจะอัปเดต)
    const { error: dbError } = await supabase.from('users').upsert({
      id: userId,
      username: acc.username,
      role: acc.role,
      name: acc.name,
      email: acc.email,
      tel: acc.tel,
      department: acc.department,
      location: acc.location,
      avatar: null,
      status: 'active',
    });

    if (dbError) {
      console.error(`✗ [${acc.username}] บันทึกตาราง users ไม่สำเร็จ:`, dbError.message);
      continue;
    }

    console.log(`✓ [${acc.username}] ${created ? 'สร้างใหม่' : 'อัปเดต'} — ${acc.email} (${acc.role})`);
  }

  console.log('\nเสร็จสิ้น — ล็อกอินได้ที่หน้าเว็บด้วยอีเมลข้างต้น รหัสผ่าน:', DEFAULT_PASSWORD);
}

main().catch((err) => {
  console.error('สคริปต์ล้มเหลว:', err.message);
  process.exit(1);
});
