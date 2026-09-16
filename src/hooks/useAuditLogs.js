'use client';
import { INITIAL_AUDIT_LOGS } from '@/data/mockData';
import { useLocalStorageState } from './useLocalStorageState';
export function useAuditLogs() {
    return useLocalStorageState('sci_exam_logs', INITIAL_AUDIT_LOGS, Array.isArray);
}
