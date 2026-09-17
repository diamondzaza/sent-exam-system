/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: page.jsx (app/request-account)
 * หน้าที่ของหน้านี้: ฟอร์ม "ขอสมัครบัญชี" — เปิดให้บุคคลทั่วไปยื่นคำขอ
 *   โดยไม่ต้องล็อกอิน ข้อมูลจะเข้าตาราง account_requests สถานะ "pending"
 *   และรอแอดมินพิจารณาอนุมัติ (ดูแท็บคำขอเปิดบัญชีในหน้า Admin)
 * ผู้ใช้งาน: ผู้ที่ยังไม่มีบัญชีในระบบ
 * ─────────────────────────────────────────────────────────
 */

import { RequestAccountForm } from '@/components/auth/RequestAccountForm';

export const metadata = {
    title: 'ขอสมัครบัญชี — ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ คณะวิทยาศาสตร์',
};

export default function RequestAccountPage() {
    return <RequestAccountForm />;
}
