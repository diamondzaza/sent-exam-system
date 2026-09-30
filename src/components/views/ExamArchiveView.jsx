/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: ExamArchiveView.jsx
 * หน้าที่ของหน้านี้: คลังข้อสอบเก่า — จัดเก็บแบ่งตามปีการศึกษา แต่ละปีแบ่งเป็นเทอม
 *   (ภาคเรียนที่ 1 / ภาคเรียนที่ 2 / ฤดูร้อน) เลือกปี → เลือกเทอม → ดูรายการ
 *   ข้อสอบที่จัดเก็บ พร้อมดูตัวอย่าง/ดาวน์โหลด (บันทึก Audit Log ตามระบบ)
 *   อาจารย์เห็นเฉพาะของตนเอง (AppShell กรองให้ก่อนส่งมา) ส่วนเจ้าหน้าที่เห็นทั้งหมด
 * ผู้ใช้งาน: ทุกบทบาท
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { STATUS_LABELS } from '@/lib/statusLabels';
import { formatThaiDate } from '@/lib/formatDate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, Download, Eye, Inbox, } from 'lucide-react';
const TERM_LABELS = { '1': 'ภาคเรียนที่ 1', '2': 'ภาคเรียนที่ 2', '3': 'ภาคฤดูร้อน' };
export const ExamArchiveView = ({ currentUser, exams, onPreviewExam, onDownloadLogged, }) => {
    // ปีการศึกษาที่มีข้อสอบจัดเก็บ — เรียงใหม่ → เก่า
    const years = Array.from(new Set(exams.map((e) => e.Course_year).filter(Boolean))).sort().reverse();
    const [year, setYear] = useState(years[0] || '');
    const termsInYear = Array.from(new Set(exams.filter((e) => e.Course_year === year).map((e) => e.term))).sort();
    const [term, setTerm] = useState(termsInYear[0] || '1');
    // ถ้าเลือกปีใหม่แล้วเทอมที่เคยเลือกไม่มีในปีนั้น — สลับไปเทอมแรกที่มี
    const activeTerm = termsInYear.includes(term) ? term : (termsInYear[0] || term);
    const archivedExams = exams.filter((e) => e.Course_year === year && e.term === activeTerm);
    return (<div className="max-w-6xl mx-auto space-y-6">
      {/* Hero */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          ข้อสอบเก่า
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          {currentUser.role === 'Teacher'
        ? 'คลังข้อสอบของท่าน จัดเก็บแยกตามปีการศึกษาและภาคเรียน'
        : 'คลังข้อสอบทั้งหมด จัดเก็บแยกตามปีการศึกษาและภาคเรียน'}
        </p>
      </div>

      {/* เลือกปีการศึกษา */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2">ปีการศึกษา</p>
        <div className="flex flex-wrap gap-2">
          {years.length === 0 ? (<span className="text-xs text-slate-500">ยังไม่มีข้อสอบจัดเก็บในระบบ</span>) : (years.map((y) => (<button key={y} onClick={() => setYear(y)} aria-pressed={year === y} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${year === y
                ? 'bg-[#1A4B7A] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-[#1A4B7A]/40 hover:text-[#1A4B7A]'}`}>
                ปีการศึกษา {y}
              </button>)))}
        </div>
      </div>

      {/* เลือกภาคเรียน */}
      {years.length > 0 && (<div>
          <p className="text-xs font-semibold text-slate-500 mb-2">ภาคเรียน</p>
          <div className="flex flex-wrap gap-2">
            {termsInYear.map((t) => (<button key={t} onClick={() => setTerm(t)} aria-pressed={activeTerm === t} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTerm === t
                ? 'bg-white text-[#1A4B7A] font-semibold border-2 border-[#1A4B7A]'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-[#1A4B7A]/40'}`}>
                {TERM_LABELS[t] || `ภาคเรียนที่ ${t}`}
              </button>))}
          </div>
        </div>)}

      {/* รายการข้อสอบ */}
      {years.length > 0 && (<div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <h3 className="font-display font-bold text-base text-slate-900">
              ข้อสอบจัดเก็บ · ปีการศึกษา {year} · {TERM_LABELS[activeTerm] || activeTerm}
            </h3>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200 shrink-0">
              {archivedExams.length} รายการ
            </Badge>
          </div>

          <div className="divide-y divide-slate-100">
            {archivedExams.length === 0 ? (<div className="p-12 text-center">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
                <p className="text-sm text-slate-500">ไม่มีข้อสอบจัดเก็บในภาคเรียนนี้</p>
                <p className="text-xs text-slate-500 mt-1">เลือกภาคเรียนอื่นด้านบน หรือปีการศึกษาอื่น</p>
              </div>) : (archivedExams.map((exam) => (<div key={exam.E_No} className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-slate-900">{exam.Subject_ID}</span>
                      <span className="inline-flex items-center rounded-md bg-[#1A4B7A]/10 text-[#1A4B7A] border border-[#1A4B7A]/20 px-2 py-0.5 text-xs font-bold">
                        ชุด {exam.exam_set || 'A'}
                      </span>
                      <h4 className="font-display text-sm font-bold text-slate-900">{exam.Subject_Name}</h4>
                      <Badge className={(STATUS_LABELS[exam.status] || STATUS_LABELS.DRAFT).badgeClass}>
                        {(STATUS_LABELS[exam.status] || STATUS_LABELS.DRAFT).label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      อาจารย์: {exam.teacher_name} · สอบ {formatThaiDate(exam.E_Date)} ({exam.E_Time}) · ห้อง {exam.room}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => onPreviewExam?.(exam)} title="เปิดดูตัวอย่างไฟล์ข้อสอบ" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                      <Eye className="w-3.5 h-3.5 text-[#1A4B7A]"/>
                      <span>ดูข้อสอบ</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDownloadLogged?.(exam)} title="ดาวน์โหลดไฟล์ข้อสอบ (บันทึก Audit Log)" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                      <Download className="w-3.5 h-3.5 text-[#1A4B7A]"/>
                      <span>ดาวน์โหลด</span>
                    </Button>
                  </div>
                </div>)))}
          </div>
        </div>)}

      {/* หมายเหตุ */}
      {years.length > 0 && (<p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Archive className="w-3.5 h-3.5"/>
          <span>ข้อสอบทุกรายการในคลังนี้เปิดดู/ดาวน์โหลดได้ตามสิทธิ์ — ระบบบันทึก Audit Log ทุกครั้ง</span>
        </p>)}
    </div>);
};
