'use client';
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: step-progress.jsx
 * หน้าที่ของหน้านี้: แถบแสดงขั้นตอนแนวนอน แยก 3 สถานะชัดเจน:
 *   done        = เขียว + CheckCircle2
 *   in-progress = วงแหวน pulse รอบวงกลมปัจจุบัน (ปิดอัตโนมัติเมื่อ
 *                 ผู้ใช้ตั้ง prefers-reduced-motion)
 *   pending     = วงกลมเทา + เลขลำดับ
 * วิธีใช้: <StepProgress steps={['ส่งแล้ว','ตรวจสอบ','พิมพ์','บรรจุซอง','พร้อมสอบ']} current={1} />
 *   current = ลำดับขั้นที่กำลังดำเนินการ (0-based)
 * ─────────────────────────────────────────────────────────
 */

export function StepProgress({ steps, current = 0, className }) {
    return (<div className={cn('overflow-x-auto', className)}>
      <ol className="flex items-start min-w-[560px]">
        {steps.map((label, i) => {
            const state = i < current ? 'done' : i === current ? 'active' : 'pending';
            const isLast = i === steps.length - 1;
            return (<li key={label} className={cn('flex items-start', !isLast && 'flex-1')}>
              <div className="flex flex-col items-center text-center gap-1 shrink-0">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center border-2',
                state === 'done' && 'bg-status-done border-status-done text-white',
                state === 'active' && 'bg-white border-status-in-progress text-status-in-progress ring-4 ring-status-in-progress/20 animate-pulse',
                state === 'pending' && 'bg-slate-100 border-slate-300 text-slate-400')}>
                  {state === 'done' ? (<CheckCircle2 className="w-5 h-5"/>) : (<span className="text-xs font-bold">{i + 1}</span>)}
                </div>
                <span className={cn('text-[11px] leading-tight max-w-[88px]',
                state === 'done' && 'text-status-done font-semibold',
                state === 'active' && 'text-status-in-progress font-bold',
                state === 'pending' && 'text-slate-400')}>{label}</span>
              </div>
              {!isLast && (<div className={cn('flex-1 h-0.5 mt-4 mx-1', i < current ? 'bg-status-done' : 'bg-slate-300')}/>)}
            </li>);
        })}
      </ol>
    </div>);
}
