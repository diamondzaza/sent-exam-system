'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useExams.ts
 * หน้าที่ของไฟล์นี้: hook จัดการข้อมูลข้อสอบทั้งหมด (entity หลักของระบบ) —
 *   ครอบคลุมทุกสถานะ 8 สถานะ ตั้งแต่ DRAFT ถึง READY_FOR_EXAM
 * ─────────────────────────────────────────────────────────
 */

import { ExamEntity } from '@/types/entities';
import { INITIAL_EXAMS } from '@/data/mockData';
import { useLocalStorageState } from './useLocalStorageState';

export function useExams() {
  return useLocalStorageState<ExamEntity[]>('sci_exam_records', INITIAL_EXAMS, Array.isArray);
}
