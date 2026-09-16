'use client';
import { INITIAL_USERS } from '@/data/mockData';
import { useLocalStorageState } from './useLocalStorageState';
export function useUsers() {
    return useLocalStorageState('sci_exam_users', INITIAL_USERS, Array.isArray);
}
