import { cn } from '@/lib/utils';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: status-badge.jsx
 * หน้าที่ของหน้านี้: Badge สถานะแบบ semantic — เรียกผ่าน token เท่านั้น
 *   (ห้ามใช้สีดิบ เช่น bg-amber-400 ในหน้า component)
 * วิธีใช้: <StatusBadge status="pending" label="ยังไม่ส่งข้อสอบ" />
 * ─────────────────────────────────────────────────────────
 */

/** สไตล์ต่อสถานะ — พื้นอ่อน / ตัวอักษรเข้ม / เส้นโปร่ง จาก status tokens */
const STATUS_STYLES = {
  pending: 'bg-status-pending/10 text-status-pending border-status-pending/30',
  inProgress: 'bg-status-in-progress/10 text-status-in-progress border-status-in-progress/30',
  done: 'bg-status-done/10 text-status-done border-status-done/30',
  danger: 'bg-status-danger/10 text-status-danger border-status-danger/30',
};

export function StatusBadge({ status = 'pending', label, className }) {
  return (<span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold', STATUS_STYLES[status], className)}>
      {label}
    </span>);
}
