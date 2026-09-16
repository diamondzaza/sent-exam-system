'use client';
import { INITIAL_USERS } from '@/data/mockData';
import { useLocalStorageState } from './useLocalStorageState';
export function useCurrentUser() {
    // defaults to Teacher (สมชาย)
    return useLocalStorageState('sci_exam_curr_user', INITIAL_USERS[0], (v) => v && typeof v.id === 'string');
}
