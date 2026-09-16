/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: ExamPreviewModal.tsx
 * หน้าที่ของหน้านี้: ตัวอย่างเอกสารข้อสอบ (โหมดสาธิต) — หัวกระดาษ CONFIDENTIAL,
 *   แบนเนอร์รหัส Audit, เนื้อข้อสอบตัวอย่าง 2 หน้าพร้อมปุ่มเปลี่ยนหน้า,
 *   ลายน้ำดิจิทัลแบบทแยงซ้ำ (ชื่อผู้ใช้ + เวลา + IP) เพื่อป้องกันการหลุดรอบ,
 *   ปุ่มดาวน์โหลด (บันทึก audit log) และสั่งพิมพ์
 * ผู้ใช้งาน: ทุกบทบาท — เปิดผ่าน AppShell
 * ─────────────────────────────────────────────────────────
 */

'use client';

import React, { useState } from 'react';
import { ExamEntity, UserAccount } from '@/types/entities';
import {
  FileText,
  ShieldCheck,
  Download,
  Printer,
  X,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ExamPreviewModalProps {
  exam: ExamEntity;
  currentUser: UserAccount;
  onClose: () => void;
  onDownloadLogged: (exam: ExamEntity) => void;
  onPrintRequested?: (exam: ExamEntity) => void;
}

export const ExamPreviewModal: React.FC<ExamPreviewModalProps> = ({
  exam,
  currentUser,
  onClose,
  onDownloadLogged,
  onPrintRequested,
}) => {
  const [activePage, setActivePage] = useState<number>(1);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display font-semibold text-base">ตรวจสอบไฟล์ข้อสอบ</h3>
                <Badge className="border-red-500/30 bg-red-500/20 text-red-300 rounded font-mono uppercase tracking-wider">
                  <Lock className="w-3 h-3 mr-1" />
                  CONFIDENTIAL
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {exam.Subject_ID} : {exam.Subject_Name} • {exam.file_name || 'Exam_Document.pdf'} ({exam.file_size || '2.4 MB'})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {onPrintRequested && (
              <Button
                onClick={() => onPrintRequested(exam)}
                variant="secondary"
                size="sm"
                className="bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
                title="สั่งพิมพ์ข้อสอบต้นฉบับ"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ข้อสอบ</span>
              </Button>
            )}

            <Button
              onClick={handleDownload}
              size="sm"
              className="px-3.5"
              title="ดาวน์โหลดไฟล์ต้นฉบับ (พร้อมบันทึก Audit Log)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Security Notification Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>มาตรการป้องกันข้อสอบรั่วไหล:</strong> เอกสารมีลายน้ำระบุผู้เปิดดู และบันทึกการเรียกดู/ดาวน์โหลดทุกครั้ง
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-600 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300">
            Audit ID: {auditId}
          </div>
        </div>

        {downloadSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-300 px-6 py-2 text-xs text-emerald-800 flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ดาวน์โหลดสำเร็จ ระบบบันทึกการดาวน์โหลดของ {currentUser.name} เรียบร้อยแล้ว</span>
          </div>
        )}

        {/* Document Viewer Container with Watermark */}
        <div className="flex-1 overflow-y-auto bg-slate-200 p-6 flex justify-center">
          <div className="relative bg-white w-full max-w-3xl min-h-[750px] shadow-lg border border-slate-300 rounded-sm p-12 select-none overflow-hidden">
            {/* Dynamic Watermark Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.07] rotate-[-25deg] flex flex-col justify-around overflow-hidden leading-loose">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="text-slate-900 font-bold text-sm tracking-widest whitespace-nowrap">
                  {watermarkText} &nbsp;&nbsp;&nbsp;&nbsp; {watermarkText}
                </div>
              ))}
            </div>

            {/* Exam Header */}
            <div className="text-center border-b-2 border-slate-900 pb-5 mb-6 relative z-10">
              <div className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">
                FACULTY OF SCIENCE • EXAMINATION PAPER
              </div>
              <h2 className="font-display text-xl font-bold text-slate-950">
                คณะวิทยาศาสตร์ มหาวิทยาลัย
              </h2>
              <h3 className="font-display text-lg font-semibold text-slate-800 mt-1">
                ข้อสอบวัดผลการเรียนรู้ ประจำภาคการศึกษาที่ {exam.term}/{exam.Course_year} ({exam.exam_type})
              </h3>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-left bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-700">รหัสวิชา: </span>
                  <span className="font-bold font-mono">{exam.Subject_ID}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">ชื่อวิชา: </span>
                  <span className="font-medium">{exam.Subject_Name}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">วัน/เวลาสอบ: </span>
                  <span>{exam.E_Date} ({exam.E_Time})</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">อาจารย์ผู้สอน: </span>
                  <span>{exam.teacher_name}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">ห้องสอบ: </span>
                  <span className="font-semibold text-indigo-700">{exam.room}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">ยอดพิมพ์ที่ต้องใช้: </span>
                  <span className="font-bold">{exam.total_copies} ชุด (+ สำรอง {exam.copies_reserve} ชุด)</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="relative z-10 mb-6 bg-slate-50/70 border-l-4 border-indigo-600 p-3 text-xs text-slate-800 space-y-1">
              <p className="font-bold text-indigo-950">คำชี้แจงสำหรับนักศึกษา:</p>
              <p>1. ข้อสอบมีทั้งหมด {exam.total_pages} หน้า แบ่งเป็น 2 ตอน คะแนนเต็ม 100 คะแนน</p>
              <p>2. ห้ามเปิดข้อสอบจนกว่ากรรมการคุมสอบจะให้สัญญาณเริ่มทำข้อสอบ</p>
              <p>3. {exam.envelope_notes || 'เขียนชื่อ-นามสกุล และรหัสนักศึกษาบนกระดาษคำถามและคำตอบทุกแผ่น'}</p>
            </div>

            {/* Sample Exam Questions Content */}
            <div className="relative z-10 text-slate-900 text-sm space-y-6">
              {activePage === 1 && (
                <>
                  <div className="border-b border-slate-200 pb-4">
                    <p className="font-semibold text-slate-950 mb-2">
                      ข้อที่ 1 (20 คะแนน) : จงอธิบายและเปรียบเทียบประสิทธิภาพเชิงเวลา (Time Complexity)
                    </p>
                    <p className="text-slate-700 leading-relaxed text-xs">
                      กำหนดให้อาร์เรย์มีขนาดข้อมูลเท่ากับ n รายการ จงเปรียบเทียบความแตกต่างระหว่าง
                      Binary Search Tree (BST) ที่เกิดกรณี Worst-case กับ Self-Balancing AVL Tree
                      พร้อมทั้งเขียนภาพตัวอย่างการ Rotate (Single Left Rotation และ Double Left-Right Rotation)
                    </p>
                    <div className="mt-3 h-28 border border-dashed border-slate-300 rounded bg-slate-50/50 p-2 flex items-center justify-center text-xs text-slate-400">
                      [พื้นที่สำหรับวาดภาพประกอบและอธิบายคำตอบ]
                    </div>
                  </div>

                  <div className="border-b border-slate-200 pb-4">
                    <p className="font-semibold text-slate-950 mb-2">
                      ข้อที่ 2 (25 คะแนน) : การวิเคราะห์ขั้นตอนวิธีเชิงละโมบ (Greedy Algorithm)
                    </p>
                    <p className="text-slate-700 leading-relaxed text-xs">
                      จงแสดงขั้นตอนวิธีของ Dijkstra ในการหาระยะทางที่สั้นที่สุดจากจุดยอดต้นทาง S ไปยังจุดยอดปลายทางทุกจุด
                      ในกราฟมีทิศทางแบบถ่วงน้ำหนักต่อไปนี้ พร้อมแจกแจงค่าใน Priority Queue แต่ละรอบ
                    </p>
                    <div className="mt-3 h-28 border border-dashed border-slate-300 rounded bg-slate-50/50 p-2 flex items-center justify-center text-xs text-slate-400">
                      [พื้นที่แสดงตารางสถานะและคำตอบ]
                    </div>
                  </div>
                </>
              )}

              {activePage === 2 && (
                <>
                  <div className="border-b border-slate-200 pb-4">
                    <p className="font-semibold text-slate-950 mb-2">
                      ข้อที่ 3 (30 คะแนน) : การแปลงแบบจำลองเชิงสัมพันธ์และ Normalization (1NF - BCNF)
                    </p>
                    <p className="text-slate-700 leading-relaxed text-xs">
                      จากตารางข้อมูลการลงทะเบียนและจัดสอบของคณะวิทยาศาสตร์ที่มี Functional Dependencies
                      (FDs) ดังนี้ จงทำการ Normalize ให้อยู่ในรูป Boyce-Codd Normal Form (BCNF)
                      โดยระบุ Candidate Key และตารางย่อยทั้งหมด
                    </p>
                    <div className="mt-3 h-32 border border-dashed border-slate-300 rounded bg-slate-50/50 p-2 flex items-center justify-center text-xs text-slate-400">
                      [พื้นที่เขียนแบบจำลองตารางฐานข้อมูลย่อย]
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-950 mb-2">
                      ข้อที่ 4 (25 คะแนน) : การเขียนคำสั่ง SQL สำหรับเรียกดูสถิติการสอบ
                    </p>
                    <p className="text-slate-700 leading-relaxed text-xs">
                      จงเขียน SQL Query เพื่อสรุปรายวิชาที่มีจำนวนนักศึกษาเข้าสอบมากกว่า 50 คน
                      พร้อมแสดงชื่ออาจารย์ผู้สอน วันที่สอบ และสถานะการพิมพ์ข้อสอบจากหน่วยโสตฯ
                    </p>
                    <div className="mt-3 h-28 border border-dashed border-slate-300 rounded bg-slate-50/50 p-2 flex items-center justify-center text-xs text-slate-400 font-mono">
                      [พื้นที่เขียนคำสั่ง SQL]
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Page Footer */}
            <div className="absolute bottom-4 left-12 right-12 flex items-center justify-between text-xs text-slate-400 border-t border-slate-200 pt-2 z-10">
              <span>{exam.Subject_ID} : {exam.Subject_Name}</span>
              <span className="font-semibold text-slate-700">
                หน้าที่ {activePage} จากทั้งหมด {Math.min(exam.total_pages || 2, 2)} หน้า (ตัวอย่าง)
              </span>
              <span>รหัสสอบ: {exam.E_No}</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Controls */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          {/* Pagination */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 mr-2">หน้าเอกสาร:</span>
            {[1, 2].map((pageNum) => (
              <Button
                key={pageNum}
                onClick={() => setActivePage(pageNum)}
                size="sm"
                variant={activePage === pageNum ? 'default' : 'secondary'}
              >
                หน้า {pageNum}
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-xs text-slate-500 hidden sm:block">
              ตรวจสอบโดย: <span className="font-semibold text-slate-700">{currentUser.name}</span> ({currentUser.role})
            </div>
            <Button onClick={onClose} variant="secondary" size="sm" className="px-4">
              ปิดหน้าต่าง
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
