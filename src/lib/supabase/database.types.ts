/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: database.types.ts (lib/supabase)
 * หน้าที่ของไฟล์นี้: type ของฐานข้อมูล Supabase เขียนมือให้ตรงกับ
 *   supabase/schema.sql — ใช้กับ createClient<Database>() เมื่อเชื่อมต่อจริง
 * หมายเหตุ: เมื่อตารางเปลี่ยน สามารถ generate ใหม่ด้วย:
 *   npx supabase gen types typescript --project-id <PROJECT_ID> > src/lib/supabase/database.types.ts
 * ─────────────────────────────────────────────────────────
 */

export type UserRole = 'Teacher' | 'AudioVisual' | 'Operations' | 'Admin';
export type UserStatus = 'active' | 'inactive';

export interface UserRow {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email: string;
  tel: string;
  department: string;
  location: string | null;
  avatar: string | null;
  status: UserStatus;
  created_at: string;
}

export interface CourseRow {
  id: string;
  course_id: string;
  course_name: string;
  course_year: string;
  term: string;
  sec: string;
  credits: number;
  student_count: number;
  teacher_id: string;
  teacher_name: string;
  created_at: string;
}

export type ExamStatusDb =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REJECTED'
  | 'VERIFIED'
  | 'PRINTING'
  | 'PRINTED'
  | 'DELIVERED_OD'
  | 'READY_FOR_EXAM';

export interface ExamRow {
  e_no: string;
  e_date: string;
  e_time: string;
  subject_id: string;
  subject_name: string;
  exam_type: string;
  course_year: string;
  term: string;
  teacher_id: string;
  teacher_name: string;
  teacher_tel: string;
  room: string;
  total_pages: number;
  total_copies: number;
  copies_reserve: number;
  status: ExamStatusDb;
  file_name: string | null;
  file_size: string | null;
  file_path: string | null; // Supabase Storage path ของไฟล์ข้อสอบ
  upload_date: string | null;
  checked_by: string | null;
  verified_date: string | null;
  print_date: string | null;
  envelope_notes: string | null;
  allowed_materials: string[] | null;
  rejection_reason: string | null;
  proctors: string[] | null;
  created_at: string;
}

export type AuditAction =
  | 'LOGIN'
  | 'VIEW_EXAM'
  | 'DOWNLOAD_EXAM'
  | 'PRINT_EXAM'
  | 'PRINT_ENVELOPE'
  | 'UPLOAD_EXAM'
  | 'REUPLOAD_EXAM'
  | 'DELETE_EXAM'
  | 'UPDATE_STATUS';

export interface AuditLogRow {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  role: UserRole;
  action: AuditAction;
  subject_id: string;
  subject_name: string | null;
  ip_address: string;
  details: string;
}

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  target_role: UserRole | 'ALL' | null;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  related_exam_no: string | null;
  created_at: string;
}

/** รูปแบบที่ createClient<Database>() คาดหวัง */
export interface Database {
  public: {
    Tables: {
      users: { Row: UserRow };
      courses: { Row: CourseRow };
      exams: { Row: ExamRow };
      audit_logs: { Row: AuditLogRow };
      notifications: { Row: NotificationRow };
    };
  };
}
