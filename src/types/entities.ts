export type UserRole = 'Teacher' | 'AudioVisual' | 'Operations' | 'Admin';

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email: string;
  tel: string;
  department: string;
  location?: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

export interface TeacherEntity {
  T_ID: string;
  T_Name: string;
  T_Lname: string;
  T_Email: string;
  T_Tel: string;
  Department: string;
}

export interface CourseEntity {
  Course_id: string;
  Course_Name: string;
  Course_year: string;
  term: string;
  sec: string;
  credits: number;
  student_count: number;
  teacher_id: string;
  teacher_name: string;
}

export type ExamStatus =
  | 'DRAFT'           // รอจัดส่งข้อสอบ
  | 'SUBMITTED'       // จัดส่งแล้ว / รอฝ่ายโสตตรวจสอบ
  | 'REJECTED'        // ส่งกลับแก้ไข / ให้อัปโหลดใหม่
  | 'VERIFIED'        // ผ่านการตรวจสอบแล้ว
  | 'PRINTING'        // กำลังดำเนินการจัดพิมพ์
  | 'PRINTED'         // พิมพ์และบรรจุซองเสร็จสิ้น
  | 'DELIVERED_OD'    // ส่งมอบให้ฝ่ายดำเนินการสอบแล้ว
  | 'READY_FOR_EXAM'; // พร้อมสำหรับการสอบในห้องสอบ

export interface ExamEntity {
  E_No: string;
  E_Date: string;        // เช่น 2026-10-15
  E_Time: string;        // เช่น 09:00 - 12:00
  Subject_ID: string;
  Subject_Name: string;
  exam_type: 'กลางภาค' | 'ปลายภาค' | 'สอบแก้ตัว';
  Course_year: string;
  term: string;
  teacher_id: string;
  teacher_name: string;
  teacher_tel: string;
  room: string;
  total_pages: number;
  total_copies: number;
  copies_reserve: number;
  status: ExamStatus;
  file_name?: string;
  file_size?: string;
  upload_date?: string;
  checked_by?: string;
  verified_date?: string;
  print_date?: string;
  envelope_notes?: string;
  allowed_materials?: string[];
  rejection_reason?: string;
  proctors?: string[];
}

export interface AudioVisualDeptEntity {
  AVD_ID: string;
  AVD_Name: string;
  AVD_Location: string;
  AVD_Tel: string;
}

export interface OperationsDeptEntity {
  OD_ID: string;
  OD_Email: string;
  OD_Location: string;
  OD_Tel: string;
}

export interface AdminEntity {
  Admin_ID: string;
  Admin_Name: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: 'LOGIN' | 'VIEW_EXAM' | 'DOWNLOAD_EXAM' | 'PRINT_EXAM' | 'PRINT_ENVELOPE' | 'UPLOAD_EXAM' | 'REUPLOAD_EXAM' | 'DELETE_EXAM' | 'UPDATE_STATUS';
  subjectId: string;
  subjectName?: string;
  ipAddress: string;
  details: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  targetRole?: UserRole | 'ALL';
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  relatedExamNo?: string;
}
