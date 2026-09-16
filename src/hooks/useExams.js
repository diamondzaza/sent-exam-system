'use client';
import { INITIAL_EXAMS } from '@/data/mockData';
import { useLocalStorageState } from './useLocalStorageState';
export function useExams() {
    return useLocalStorageState('sci_exam_records', INITIAL_EXAMS, Array.isArray);
}
