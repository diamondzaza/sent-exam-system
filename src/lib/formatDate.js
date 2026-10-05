/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: formatDate.js
 * หน้าที่ของหน้านี้: ฟังก์ชันช่วยแปลงวันที่เป็นรูปแบบไทยสั้น (เช่น 30 ก.ย. 2569)
 *   — รับค่าที่ parse เป็นวันที่ได้ (ISO จาก input date, Date object)
 *     ถ้าแปลงไม่ได้คืนค่าเดิม (กันข้อมูลเก่าที่เก็บเป็นข้อความไทยอยู่แล้ว)
 * ผู้ใช้งาน: ทุก view ที่แสดงวันสอบ
 * ─────────────────────────────────────────────────────────
 */
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const formatThaiDate = (value) => {
    if (!value)
        return '';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime()))
        return String(value);
    return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
};

/** เวลาแบบสัมพัทธ์ภาษาไทย — คำนวณสด ๆ ตอนเรียก (เช่น เมื่อสักครู่, 15 นาทีที่แล้ว, 2 ชั่วโมงที่แล้ว) */
export const relativeTimeThai = (value) => {
    if (!value)
        return '';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime()))
        return String(value);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1)
        return 'เมื่อสักครู่';
    if (mins < 60)
        return `${mins} นาทีที่แล้ว`;
    const hours = Math.floor(mins / 60);
    if (hours < 24)
        return `${hours} ชั่วโมงที่แล้ว`;
    const days = Math.floor(hours / 24);
    if (days < 7)
        return `${days} วันที่แล้ว`;
    return formatThaiDate(d);
};
