/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: approve-request.js (scripts)
 * หน้าที่ของไฟล์นี้: อนุมัติคำขอเปิดบัญชีจากตาราง account_requests ผ่าน command line —
 *   สร้างบัญชี Auth + โปรไฟล์จริง พร้อมกำหนดบทบาทและรหัสผ่าน
 *   ใช้เป็นเครื่องมือ "เปิดบัญชีแรก" ของระบบ (เพราะการอนุมัติผ่านหน้าเว็บ
 *   ต้องมีแอดมินล็อกอินอยู่ก่อน)
 * วิธีรัน:
 *   node --env-file=.env.local scripts/approve-request.js            ← แสดงคำขอที่รออยู่
 *   node --env-file=.env.local scripts/approve-request.js <อีเมล> <รหัสผ่าน> <บทบาท>
 *   ตัวอย่าง: node --env-file=.env.local scripts/approve-request.js admin@sci.ac.th mypass123 Admin
 *   บทบาทที่ใช้ได้: Teacher | AudioVisual | Operations | Admin
 * ─────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const VALID_ROLES = ['Teacher', 'AudioVisual', 'Operations', 'Admin'];

async function listPending() {
  const { data, error } = await supabase
    .from('account_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('อ่านคำขอไม่สำเร็จ:', error.message);
    process.exit(1);
  }
  if (!data.length) {
    console.log('ไม่มีคำขอเปิดบัญชีที่รอพิจารณา (ยื่นคำขอได้ที่หน้า /request-account ของเว็บ)');
    return;
  }
  console.log('คำขอที่รอพิจารณา:', data.length, 'รายการ');
  data.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name} | ${r.email} | ชื่อผู้ใช้: ${r.username} | ยื่นเมื่อ ${new Date(r.created_at).toLocaleString('th-TH')}`);
  });
  console.log('\nอนุมัติด้วยคำสั่ง: node --env-file=.env.local scripts/approve-request.js <อีเมล> <รหัสผ่าน> <บทบาท>');
}

async function approve(email, password, role) {
  if (!VALID_ROLES.includes(role)) {
    console.error('บทบาทไม่ถูกต้อง — ใช้ได้แค่:', VALID_ROLES.join(' | '));
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    process.exit(1);
  }
  const { data: req, error: readError } = await supabase
    .from('account_requests')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .single();
  if (readError || !req) {
    console.error('ไม่พบคำขอ pending ของอีเมลนี้ — รันสคริปต์โดยไม่ใส่พารามิเตอร์เพื่อดูรายการ');
    process.exit(1);
  }

  // สร้างบัญชี Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: req.email,
    password,
    email_confirm: true,
    user_metadata: { username: req.username, role, name: req.name },
  });
  if (authError) {
    console.error('สร้างบัญชี Auth ไม่สำเร็จ:', authError.message);
    process.exit(1);
  }
  // สร้างโปรไฟล์
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    username: req.username,
    role,
    name: req.name,
    email: req.email,
    tel: req.tel ?? '',
    department: req.department ?? '',
    status: 'active',
  });
  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.error('สร้างโปรไฟล์ไม่สำเร็จ:', profileError.message);
    process.exit(1);
  }
  // มาร์คคำขอว่าอนุมัติ
  await supabase
    .from('account_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', req.id);

  console.log(`✓ อนุมัติสำเร็จ — ${req.name} (${req.email}) บทบาท: ${role}`);
  console.log('  ล็อกอินได้ทันทีด้วยอีเมลนี้ + รหัสผ่านที่กำหนด');
}

async function main() {
  const [email, password, role] = process.argv.slice(2);
  if (!email) {
    await listPending();
    return;
  }
  await approve(email, password, role);
}

main().catch((err) => {
  console.error('สคริปต์ล้มเหลว:', err.message);
  process.exit(1);
});
