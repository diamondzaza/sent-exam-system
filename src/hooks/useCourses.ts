'use client';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: useCourses.ts
 * หน้าที่ของไฟล์นี้: hook จัดการรายวิชาทั้งหมด — ใช้โดย TeacherView
 *   (เลือกวิชา/เพิ่มรายวิชา) และ AudioVisualView (ไดเรกทอรีรายวิชา)
 * ─────────────────────────────────────────────────────────
 */

import { CourseEntity } from '@/types/entities';
import { INITIAL_COURSES } from '@/data/mockData';
import { useLocalStorageState } from './useLocalStorageState';

export function useCourses() {
  return useLocalStorageState<CourseEntity[]>('sci_exam_courses', INITIAL_COURSES, Array.isArray);
}
