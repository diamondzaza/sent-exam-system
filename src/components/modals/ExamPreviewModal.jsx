/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: ExamPreviewModal.jsx
 * หน้าที่ของหน้านี้: ตรวจสอบไฟล์ข้อสอบจริง — toolbar ธีมม่วงของแอป
 *   (zoom / เลื่อนหน้า / ค้นหา / ดาวน์โหลด / เมนูเพิ่มเติม พร้อม tooltip ทุกปุ่ม),
 *   แสดง PDF จริงใน iframe คลุมลายน้ำ, และปุ่ม decision ก่อนปิด:
 *   "ยืนยันไฟล์ถูกต้อง" / "แจ้งปัญหา-ส่งกลับแก้ไข"
 * ผู้ใช้งาน: ทุกบทบาท — เปิดผ่าน AppShell
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState, useEffect } from 'react';
import { authFetch } from '@/lib/supabase/client';
import { FileText, ShieldCheck, Download, Printer, X, Lock, CheckCircle2, FileWarning, AlertTriangle, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, Search, Save, MoreHorizontal, Loader2, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';

/** ปุ่มไอคอนใน toolbar — มี tooltip + aria-label เสมอ (ผู้ใช้ไม่คุ้นสัญลักษณ์ PDF viewer) */
const ToolButton = ({ icon: Icon, label, onClick, disabled }) => (<button type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label} className="p-1.5 rounded-lg text-indigo-200 hover:bg-indigo-500/40 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
  <Icon className="w-4 h-4"/>
</button>);

export const ExamPreviewModal = ({ exam, currentUser, onClose, onDownloadLogged, onPrintRequested, onExamDecision, onToast, }) => {
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    // โหลด Signed URL ของไฟล์จริง — ถ้าไม่มีไฟล์ (404) จะแสดงการ์ดแจ้งเตือน
    const [fileState, setFileState] = useState({ status: 'loading', url: null });
    const isPdf = /\.(pdf)$/i.test(exam.file_name || '');
    // Toolbar state (ข้อ 5)
    const [zoom, setZoom] = useState(1);
    const [maximized, setMaximized] = useState(false);
    const [page, setPage] = useState(1);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const totalPages = Math.max(exam.total_pages || 1, 1);
    useEffect(() => {
        let active = true;
        const load = (attempt) => authFetch(`/api/exams/${encodeURIComponent(exam.E_No)}/file`)
            .then(async (res) => {
            if (!res.ok)
                throw new Error('no file');
            const data = await res.json();
            if (active)
                setFileState({ status: 'real', url: data.url });
        })
            .catch(() => {
            if (!active)
                return;
            if (attempt < 1) {
                setTimeout(() => load(attempt + 1), 1500);
            }
            else {
                setFileState({ status: 'none', url: null });
            }
        });
        load(0);
        return () => {
            active = false;
        };
    }, [exam.E_No]);
    const [auditId] = useState(() => `SEC-${Date.now().toString().slice(-6)}`);
    const handleDownload = () => {
        onDownloadLogged(exam);
        setDownloadSuccess(true);
        setTimeout(() => {
            setDownloadSuccess(false);
        }, 3000);
    };
    const changeZoom = (delta) => setZoom((z) => Math.min(2, Math.max(0.5, Math.round((z + delta) * 100) / 100)));
    const changePage = (p) => setPage(Math.min(totalPages, Math.max(1, p)));
    // src ของ iframe แนบ #page=N — Chrome/Edge PDF viewer เปิดตามหน้าที่เลือก
    const iframeSrc = fileState.url ? `${fileState.url}#page=${page}` : '';
    return (<Modal open onClose={onClose} size={maximized ? 'full' : 'lg'}>
      {/* Header — ชื่อวิชา + CONFIDENTIAL + Audit ID (มุมขวา) */}
      <ModalHeader icon={FileText} title={`${exam.Subject_ID} : ${exam.Subject_Name}`} subtitle={`${exam.file_name || 'Exam_Document.pdf'} (${exam.file_size || '-'})`} onClose={onClose} right={<div className="flex items-center gap-2">
            <Badge className="border-red-400/40 bg-red-500/20 text-red-300 rounded font-mono uppercase tracking-wider">
              <Lock className="w-3 h-3 mr-1"/>
              CONFIDENTIAL
            </Badge>
            <Badge variant="outline" className="rounded font-mono text-[var(--muted-foreground)] border-slate-600 bg-slate-800/60">
              Audit ID: {auditId}
            </Badge>
          </div>}/>

      {/* ═══ Toolbar ธีมม่วง — 3 กลุ่มคั่นด้วยเส้นแนวตั้ง (ข้อ 5) ═══ */}
      <div className="no-print bg-indigo-950 px-4 py-2 flex items-center gap-1.5 flex-wrap border-b border-indigo-900">
        {/* กลุ่ม 1: View */}
        <ToolButton icon={ZoomOut} label="ซูมออก" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5}/>
        <span className="text-xs font-semibold text-indigo-200 w-12 text-center font-mono" title="ระดับการซูมปัจจุบัน">
          {Math.round(zoom * 100)}%
        </span>
        <ToolButton icon={ZoomIn} label="ซูมเข้า" onClick={() => changeZoom(0.25)} disabled={zoom >= 2}/>
        <ToolButton icon={Maximize2} label={maximized ? 'ย่อหน้าต่างกลับ' : 'ขยายเต็มความกว้าง'} onClick={() => setMaximized(!maximized)}/>
        {/* เส้นคั่นแนวตั้ง */}
        <div className="w-px h-5 bg-indigo-800 mx-1.5"/>
        {/* กลุ่ม 2: เลื่อนหน้าเอกสาร */}
        <ToolButton icon={ChevronLeft} label="หน้าก่อนหน้า" onClick={() => changePage(page - 1)} disabled={page <= 1}/>
        <div className="flex items-center gap-1 text-xs text-indigo-200" title="เลขหน้าปัจจุบัน / หน้าทั้งหมด">
          <input type="number" min={1} max={totalPages} value={page} onChange={(e) => changePage(parseInt(e.target.value) || 1)} aria-label="เลขหน้าที่ต้องการดู" className="w-12 text-center bg-indigo-900/60 border border-indigo-700 rounded-md py-1 text-indigo-100 font-mono"/>
          <span>จาก {totalPages}</span>
        </div>
        <ToolButton icon={ChevronRight} label="หน้าถัดไป" onClick={() => changePage(page + 1)} disabled={page >= totalPages}/>
        {/* เส้นคั่นแนวตั้ง */}
        <div className="w-px h-5 bg-indigo-800 mx-1.5"/>
        {/* กลุ่ม 3: Utility */}
        <ToolButton icon={Search} label="ค้นหาในไฟล์ (Ctrl+F)" onClick={() => onToast?.('ใช้ Ctrl+F (Cmd+F บน Mac) เพื่อค้นหาข้อความในไฟล์')}/>
        <ToolButton icon={Save} label="บันทึกไฟล์ / ดาวน์โหลด" onClick={handleDownload}/>
        <div className="relative">
          <ToolButton icon={MoreHorizontal} label="ตัวเลือกเพิ่มเติม" onClick={() => setShowMoreMenu(!showMoreMenu)}/>
          {showMoreMenu && (<div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-10 py-1 text-sm text-slate-800">
              <button type="button" onClick={() => { handleDownload(); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600"/> ดาวน์โหลดไฟล์
              </button>
              {onPrintRequested && (<button type="button" onClick={() => { onPrintRequested(exam); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-600"/> สั่งพิมพ์ข้อสอบ
                </button>)}
              <button type="button" onClick={() => { onClose(); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex items-center gap-2">
                <X className="w-4 h-4 text-rose-600"/> ปิดหน้าต่าง
              </button>
            </div>)}
        </div>
        <span className="ml-auto text-xs text-indigo-300 hidden sm:block" title="หน้าที่กำลังดู">
          หน้า {page}/{totalPages}
        </span>
      </div>

      {/* Alert bar — มาตรการป้องกันข้อสอบรั่วไหล */}
      <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0"/>
          <span>
            <strong>มาตรการป้องกันข้อสอบรั่วไหล:</strong> บันทึกการเรียกดู/ดาวน์โหลดทุกครั้ง (Audit Log) และดาวน์โหลดผ่านลิงก์ชั่วคราวที่หมดอายุ
          </span>
        </div>
      </div>

      {downloadSuccess && (<div className="bg-emerald-50 border-b border-emerald-300 px-6 py-2 text-xs text-emerald-800 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600"/>
          <span>ดาวน์โหลดสำเร็จ ระบบบันทึกการดาวน์โหลดของ {currentUser.name} เรียบร้อยแล้ว</span>
        </div>)}

      <ModalBody className="p-0 bg-slate-200">
        {/* กำลังโหลด */}
        {fileState.status === 'loading' && (<div className="h-[700px] flex items-center justify-center text-sm text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2"/> กำลังโหลดไฟล์ข้อสอบ...
          </div>)}

        {/* PDF จริง — ซูมด้วย transform, เปิดหน้าตามเลขหน้า */}
        {fileState.status === 'real' && isPdf && (<div className="overflow-auto bg-slate-300" style={{ height: `${Math.round(800 * zoom)}px` }}>
            <div style={{ width: `${100 / zoom}%`, height: `${800 / zoom}px`, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              <iframe src={iframeSrc} title={`${exam.Subject_ID} - ${exam.file_name}`} className="w-full h-full"/>
            </div>
          </div>)}

        {/* Word — แนะนำดาวน์โหลด */}
        {fileState.status === 'real' && !isPdf && (<div className="h-[700px] flex items-center justify-center p-6">
            <div className="bg-white border border-slate-300 rounded-2xl shadow-lg p-8 max-w-md text-center space-y-3">
              <FileWarning className="w-10 h-10 text-amber-500 mx-auto"/>
              <p className="font-display font-semibold text-sm text-slate-900">ไฟล์ข้อสอบเป็นเอกสาร Word (.docx)</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                เบราว์เซอร์แสดงพรีวิวไฟล์ Word โดยตรงไม่ได้ — กดปุ่ม "ดาวน์โหลด" ด้านบน
                เพื่อเปิดไฟล์ต้นฉบับด้วยโปรแกรม Word (การดาวน์โหลดถูกบันทึก Audit Log แล้ว)
              </p>
            </div>
          </div>)}

        {/* ไม่มีไฟล์แนบ */}
        {fileState.status === 'none' && (<div className="h-[700px] flex items-center justify-center p-6">
            <div className="bg-white border border-amber-300 rounded-2xl shadow-lg p-8 max-w-md text-center space-y-3">
              <FileWarning className="w-10 h-10 text-amber-500 mx-auto"/>
              <p className="font-display font-semibold text-sm text-slate-900">ยังไม่มีไฟล์ข้อสอบแนบในระบบ</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                รายการนี้บันทึกเฉพาะข้อมูล (ชื่อไฟล์) แต่ตัวไฟล์จริงยังไม่ได้อัปโหลดขึ้นระบบ<br/>
                กรุณาใช้ปุ่ม "อัปโหลดใหม่" ในหน้ารายวิชา เพื่อแนบไฟล์จริงอีกครั้ง
              </p>
            </div>
          </div>)}
      </ModalBody>

      {/* Footer — ปุ่ม decision ก่อนปิด (ข้อ 5) */}
      <ModalFooter>
        <div className="text-xs text-slate-500 hidden sm:block">
          ตรวจสอบโดย: <span className="font-semibold text-slate-700">{currentUser.name}</span> ({currentUser.role})
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button onClick={() => onExamDecision?.(exam, 'confirm')} className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]" title="ยืนยันว่าไฟล์ข้อสอบถูกต้องครบถ้วน">
            <CheckCircle2 className="w-4 h-4"/>
            <span>ยืนยันไฟล์ถูกต้อง</span>
          </Button>
          <Button variant="outline" onClick={() => onExamDecision?.(exam, 'report')} className="min-h-[44px] border-amber-400 text-amber-700 hover:bg-amber-50 hover:text-amber-800" title="แจ้งปัญหาหรือส่งไฟล์กลับให้แก้ไข">
            <AlertTriangle className="w-4 h-4"/>
            <span>แจ้งปัญหา/ส่งกลับแก้ไข</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} className="px-4 min-h-[44px]">
            ปิดหน้าต่าง
          </Button>
        </div>
      </ModalFooter>
    </Modal>);
};
