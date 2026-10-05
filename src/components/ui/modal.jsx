'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: modal.jsx
 * หน้าที่ของหน้านี้: Modal กลางของระบบ — header style เดียวกันทุกที่
 *   (แถบเข้ม gradient + icon chip + ปุ่มปิด), รองรับ Escape + lock scroll,
 *   ขนาด: sm / md / lg / full
 * วิธีใช้:
 *   <Modal open={open} onClose={...} size="lg">
 *     <ModalHeader icon={FileText} title="..." subtitle="..." onClose={...} />
 *     <ModalBody>...</ModalBody>
 *     <ModalFooter>...</ModalFooter>
 *   </Modal>
 * ─────────────────────────────────────────────────────────
 */

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  full: 'max-w-6xl',
};

export function Modal({ open, onClose, size = 'md', children, className }) {
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);
    if (!open)
        return null;
    return (<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-start sm:items-center justify-center p-4">
      <div className={cn('relative w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]', SIZES[size], className)}>
        {children}
      </div>
    </div>);
}

export function ModalHeader({ icon: Icon, title, subtitle, onClose, right, className }) {
    return (<div className={cn('no-print bg-[#1A4B7A] text-white px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#153D63]', className)}>
      <div className="flex items-center space-x-3 min-w-0">
        {Icon && (<div className="p-2 bg-white/15 text-white/90 rounded-lg border border-white/25 shrink-0">
            <Icon className="w-5 h-5"/>
          </div>)}
        <div className="min-w-0">
          <h2 className="font-display font-semibold text-base break-words">{title}</h2>
          {subtitle && (<p className="text-xs text-white/70 mt-0.5 break-words">{subtitle}</p>)}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0 max-w-full">
        {right}
        {onClose && (<button type="button" onClick={onClose} aria-label="ปิดหน้าต่าง" className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors">
            <X className="w-5 h-5"/>
          </button>)}
      </div>
    </div>);
}

export function ModalBody({ children, className }) {
    return (<div className={cn('flex-1 overflow-y-auto p-4 sm:p-6', className)}>{children}</div>);
}

export function ModalFooter({ children, className }) {
    return (<div className={cn('no-print bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3', className)}>
      {children}
    </div>);
}
