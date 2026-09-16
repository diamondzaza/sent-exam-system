'use client';
import { INITIAL_COURSES } from '@/data/mockData';
import { useLocalStorageState } from './useLocalStorageState';
export function useCourses() {
    return useLocalStorageState('sci_exam_courses', INITIAL_COURSES, Array.isArray);
}
