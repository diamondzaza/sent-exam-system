'use client';
import { INITIAL_NOTIFICATIONS } from '@/data/mockData';
import { useLocalStorageState } from './useLocalStorageState';
export function useNotifications() {
    return useLocalStorageState('sci_exam_notifs', INITIAL_NOTIFICATIONS, Array.isArray);
}
