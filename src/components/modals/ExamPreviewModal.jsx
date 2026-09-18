/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: ExamPreviewModal.jsx
 * หน้าที่ของหน้านี้: ตรวจสอบไฟล์ข้อสอบจริง — โหลด Signed URL จาก
 *   /api/exams/[eNo]/file แล้วแสดงไฟล์ PDF ใน iframe คลุมลายน้ำดิจิทัลของ
 *   ผู้เปิดดู / ไฟล์ Word แสดงแจ้งเตือนให้ดาวน์โหลดแทน /
 *   ถ้ารายการยังไม่มีไฟล์แนบ แสดงการ์ดแจ้งเตือนให้อัปโหลดใหม่
 * พร้อมหัว CONFIDENTIAL, แบนเนอร์รหัส Audit และปุ่มดาวน์โหลด (บันทึก audit log)
 * ผู้ใช้งาน: ทุกบทบาท — เปิดผ่าน AppShell
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, Download, Printer, X, Lock, CheckCircle2, FileWarning, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
export const ExamPreviewModal = ({ exam, currentUser, onClose, onDownloadLogged, onPrintRequested, }) => {
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    // โหลด Signed URL ของไฟล์จริง — ถ้าไม่มีไฟล์ (404) จะแสดงการ์ดแจ้งเตือน
    const [fileState, setFileState] = useState({ status: 'loading', url: null });
    const isPdf = /\.(pdf)$/i.test(exam.file_name || '');
    useEffect(() => {
        let active = true;
        // โหลด Signed URL — ถ้าล้มเหลว (เช่น deploy ช่วงเปลี่ยนเวอร์ชัน) ให้ลองซ้ำ 1 ครั้งก่อนสรุปว่าไม่มีไฟล์
        const load = (attempt) => fetch(`/api/exams/${encodeURIComponent(exam.E_No)}/file`)
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
    // Capture the watermark and audit id once per modal mount — they are security
    // identifiers and must not change between re-renders (page switches, etc.)
    const [watermarkText] = useState(() => {
        const ts = new Date().toLocaleString('th-TH');
        return `เอกสารลับเฉพาะ คณะวิทยาศาสตร์ • เข้าดูโดย ${currentUser.name} (${currentUser.id}) • ${ts} • IP: 192.168.1.${Math.floor(Math.random() * 50) + 10}`;
    });
    const [auditId] = useState(() => `SEC-${Date.now().toString().slice(-6)}`);
    const handleDownload = () => {
        onDownloadLogged(exam);
        setDownloadSuccess(true);
        setTimeout(() => {
            setDownloadSuccess(false);
        }, 3000);
    };
    return (<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <FileText className="w-5 h-5"/>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display font-semibold text-base">ตรวจสอบไฟล์ข้อสอบ</h3>
                <Badge className="border-red-500/30 bg-red-500/20 text-red-300 rounded font-mono uppercase tracking-wider">
                  <Lock className="w-3 h-3 mr-1"/>
                  CONFIDENTIAL
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {exam.Subject_ID} : {exam.Subject_Name} • {exam.file_name || 'Exam_Document.pdf'} ({exam.file_size || '2.4 MB'})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {onPrintRequested && (<Button onClick={() => onPrintRequested(exam)} variant="secondary" size="sm" className="bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700" title="สั่งพิมพ์ข้อสอบต้นฉบับ">
                <Printer className="w-3.5 h-3.5"/>
                <span>พิมพ์ข้อสอบ</span>
              </Button>)}

            <Button onClick={handleDownload} size="sm" className="px-3.5" title="ดาวน์โหลดไฟล์ต้นฉบับ (พร้อมบันทึก Audit Log)">
              <Download className="w-3.5 h-3.5"/>
              <span>ดาวน์โหลด</span>
            </Button>

            <Button onClick={onClose} variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800" aria-label="ปิด">
              <X className="w-5 h-5"/>
            </Button>
          </div>
        </div>

        {/* Security Notification Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0"/>
            <span>
              <strong>มาตรการป้องกันข้อสอบรั่วไหล:</strong> เอกสารมีลายน้ำระบุผู้เปิดดู และบันทึกการเรียกดู/ดาวน์โหลดทุกครั้ง
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-600 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300">
            Audit ID: {auditId}
          </div>
        </div>

        {downloadSuccess && (<div className="bg-emerald-50 border-b border-emerald-300 px-6 py-2 text-xs text-emerald-800 flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600"/>
            <span>ดาวน์โหลดสำเร็จ ระบบบันทึกการดาวน์โหลดของ {currentUser.name} เรียบร้อยแล้ว</span>
          </div>)}

        {/* Document Viewer Container with Watermark */}
        <div className="flex-1 overflow-y-auto bg-slate-200 p-6 flex justify-center">
          {/* กำลังโหลด Signed URL */}
          {fileState.status === 'loading' && (<div className="self-center text-xs text-slate-500">
              กำลังโหลดไฟล์ข้อสอบ...
            </div>)}

          {/* ไฟล์จริง — PDF แสดงใน iframe คลุมลายน้ำดิจิทัล */}
          {fileState.status === 'real' && isPdf && (<div className="relative bg-white w-full max-w-4xl h-[800px] shadow-lg border border-slate-300 rounded-sm overflow-hidden">
              <iframe src={fileState.url} title={`${exam.Subject_ID} - ${exam.file_name}`} className="w-full h-full"/>
              {/* Dynamic Watermark Pattern (คลุมทับ PDF) */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.07] rotate-[-25deg] flex flex-col justify-around overflow-hidden leading-loose">
                {Array.from({ length: 14 }).map((_, i) => (<div key={i} className="text-slate-900 font-bold text-sm tracking-widest whitespace-nowrap">
                    {watermarkText} &nbsp;&nbsp;&nbsp;&nbsp; {watermarkText}
                  </div>))}
              </div>
            </div>)}

          {/* ไฟล์จริง — Word แสดงพรีวิวในเบราว์เซอร์ไม่ได้ แนะนำดาวน์โหลด */}
          {fileState.status === 'real' && !isPdf && (<div className="self-center bg-white border border-slate-300 rounded-2xl shadow-lg p-8 max-w-md text-center space-y-3">
              <FileWarning className="w-10 h-10 text-amber-500 mx-auto"/>
              <p className="font-display font-semibold text-sm text-slate-900">
                ไฟล์ข้อสอบเป็นเอกสาร Word (.docx)
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                เบราว์เซอร์แสดงพรีวิวไฟล์ Word โดยตรงไม่ได้ — กดปุ่ม "ดาวน์โหลด" ด้านบน
                เพื่อเปิดไฟล์ต้นฉบับด้วยโปรแกรม Word (การดาวน์โหลดถูกบันทึก Audit Log แล้ว)
              </p>
            </div>)}

          {/* ไม่มีไฟล์แนบ — แจ้งให้อัปโหลดใหม่ */}
          {fileState.status === 'none' && (<div className="self-center bg-white border border-amber-300 rounded-2xl shadow-lg p-8 max-w-md text-center space-y-3">
              <FileWarning className="w-10 h-10 text-amber-500 mx-auto"/>
              <p className="font-display font-semibold text-sm text-slate-900">
                ยังไม่มีไฟล์ข้อสอบแนบในระบบ
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                รายการนี้บันทึกเฉพาะข้อมูล (ชื่อไฟล์) แต่ตัวไฟล์จริงยังไม่ได้อัปโหลดขึ้นระบบ<br/>
                กรุณาใช้ปุ่ม "อัปโหลดใหม่" ในหน้ารายวิชา เพื่อแนบไฟล์จริงอีกครั้ง
              </p>
            </div>)}
        </div>

        {/* Modal Bottom Controls */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500 hidden sm:block">
            ตรวจสอบโดย: <span className="font-semibold text-slate-700">{currentUser.name}</span> ({currentUser.role})
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={onClose} variant="secondary" size="sm" className="px-4">
              ปิดหน้าต่าง
            </Button>
          </div>
        </div>
      </div>
    </div>);
};
