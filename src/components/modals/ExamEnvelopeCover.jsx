/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: ExamEnvelopeCover.jsx
 * หน้าที่ของหน้านี้: ใบปะหน้าซองข้อสอบ มหาวิทยาลัยสงขลานครินทร์ —
 *   ตามแบบฟอร์มต้นฉบับ: โลโก้ (ช่องวาง — ผู้ใช้นำมาใส่เอง), คณะวิทยาศาสตร์,
 *   มหาวิทยาลัยสงขลานครินทร์, ข้อมูลการสอบ (วิชา/รหัสวิชา/วันที่/เวลา/ห้อง/
 *   เลขประจำซอง/จำนวนนักศึกษา/จำนวนข้อสอบ/สำรอง), อุปกรณ์ที่ใช้และคำแนะนำ
 *   ผู้คุมสอบ (checkbox), ผู้ออกข้อสอบ, ห้องทำงาน, รายชื่อนักศึกษาที่ขาดสอบ
 *   (รหัส/ชื่อ-สกุล 3 แถว), ผู้คุมสอบ 3 คน และหมายเหตุ — ทุกช่องเป็นช่องกรอก
 *   เส้นประว่างๆ พิมพ์ได้เฉพาะใบปะหน้าผ่าน body.printing-envelope
 * ผู้ใช้งาน: Teacher / AudioVisual / Operations — เปิดผ่าน AppShell
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, X, FileText } from 'lucide-react';

const initialForm = {
    subject: '',
    subjectCode: '',
    examDay: '',
    examMonth: '',
    examYearBE: '',
    examTime: '',
    examRoom: '',
    envelopeNo: '',
    studentCount: '',
    examCopies: '',
    facultyName: '',
    section: '',
    reserveSets: '',
    optBooks: false,
    optCalculator: false,
    optNoRuler: false,
    examAuthor: '',
    office: '',
    attendedCount: '',
    absentCount: '',
    absentees: [{ code: '', name: '' }, { code: '', name: '' }, { code: '', name: '' }],
    proctors: ['', '', ''],
    note: '',
};

// ช่องกรอกเส้นประแบบเอกสารราชการ
const Field = ({ value, onChange, className = '' }) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        className={`bg-transparent border-0 border-b border-dotted border-slate-500 focus:border-indigo-600 focus:outline-none text-slate-900 text-sm px-1 py-0.5 ${className}`}
    />
);
const Dots = ({ className = '' }) => <span className={`inline-block border-b border-dotted border-slate-500 ${className}`} />;

export const ExamEnvelopeCover = ({ exam, onClose, onPrintRecorded }) => {
    const [form, setForm] = useState(initialForm);
    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
    const setAbsentee = (i, key) => (e) => {
        const arr = form.absentees.map((a, idx) => (idx === i ? { ...a, [key]: e.target.value } : a));
        setForm({ ...form, absentees: arr });
    };
    const setProctor = (i) => (e) => {
        const arr = form.proctors.map((p, idx) => (idx === i ? e.target.value : p));
        setForm({ ...form, proctors: arr });
    };
    const handlePrint = () => {
        if (onPrintRecorded)
            onPrintRecorded();
        document.body.classList.add('printing-envelope');
        window.print();
        setTimeout(() => document.body.classList.remove('printing-envelope'), 500);
    };
    return (<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <FileText className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-display font-semibold text-base">ใบปะหน้าซองข้อสอบ</h3>
              <p className="text-xs text-slate-400">
                {exam ? `${exam.Subject_ID} : ${exam.Subject_Name}` : 'ตัวอย่างแบบฟอร์ม'} — กรอกข้อมูลแล้วสั่งพิมพ์
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handlePrint} size="sm" className="px-3.5" title="พิมพ์ใบปะหน้าซองข้อสอบ (พร้อมบันทึก Audit Log)">
              <Printer className="w-3.5 h-3.5"/>
              <span>พิมพ์ใบปะหน้า</span>
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800" aria-label="ปิด">
              <X className="w-5 h-5"/>
            </Button>
          </div>
        </div>

        {/* ═══ แบบฟอร์ม (printable) ═══ */}
        <div id="printable-envelope" className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
          <div className="bg-white shadow border border-slate-300 mx-auto max-w-3xl px-8 py-8 text-slate-900 min-h-[900px]">

            {/* ── โลโก้ (ช่องวาง — นำภาพมาใส่เองภายหลัง) ── */}
            <div className="flex justify-center mb-3">
              <div className="w-28 h-28 border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-300 text-center leading-tight">
                ที่วาง<br/>โลโก้
              </div>
            </div>

            {/* ── คณะ / มหาวิทยาลัย ── */}
            <div className="text-center space-y-1 mb-6">
              <p className="font-display text-xl font-bold text-slate-900">คณะวิทยาศาสตร์</p>
              <p className="font-display text-xl font-bold text-slate-900">มหาวิทยาลัยสงขลานครินทร์</p>
            </div>

            {/* ── ข้อมูลการสอบ ── */}
            <div className="space-y-2.5 text-sm mb-6">
              <div className="flex items-center gap-2">
                <span className="shrink-0">การสอบวิชา</span>
                <Dots className="flex-1"/>
                <Field value={form.subject} onChange={set('subject')} className="w-64 text-center"/>
                <span className="shrink-0">รหัสวิชา</span>
                <Dots className="w-6"/>
                <Field value={form.subjectCode} onChange={set('subjectCode')} className="w-28 text-center"/>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="shrink-0">สอบวันที่</span>
                <Field value={form.examDay} onChange={set('examDay')} className="w-14 text-center"/>
                <span className="shrink-0">เดือน</span>
                <Field value={form.examMonth} onChange={set('examMonth')} className="w-28 text-center"/>
                <span className="shrink-0">พ.ศ.</span>
                <Field value={form.examYearBE} onChange={set('examYearBE')} className="w-16 text-center"/>
                <span className="shrink-0">เวลา</span>
                <Field value={form.examTime} onChange={set('examTime')} className="w-32 text-center"/>
                <span className="shrink-0">น.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0">ห้องสอบ</span>
                <Dots className="flex-1"/>
                <Field value={form.examRoom} onChange={set('examRoom')} className="w-44 text-center"/>
                <span className="shrink-0 ml-4">เลขประจำซอง</span>
                <Dots className="w-6"/>
                <Field value={form.envelopeNo} onChange={set('envelopeNo')} className="w-24 text-center"/>
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0">จำนวนนักศึกษา</span>
                <Dots className="flex-1"/>
                <Field value={form.studentCount} onChange={set('studentCount')} className="w-20 text-center"/>
                <span className="shrink-0">คน</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="shrink-0">ซองนี้มีจำนวนข้อสอบ</span>
                <Field value={form.examCopies} onChange={set('examCopies')} className="w-16 text-center"/>
                <span className="shrink-0">จุด</span>
                <span className="shrink-0 ml-8">นศ. คณะ</span>
                <Field value={form.facultyName} onChange={set('facultyName')} className="w-44 text-center"/>
                <span className="shrink-0">ตอน</span>
                <Field value={form.section} onChange={set('section')} className="w-20 text-center"/>
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0">ข้อสอบสำรอง</span>
                <Dots className="flex-1"/>
                <Field value={form.reserveSets} onChange={set('reserveSets')} className="w-16 text-center"/>
                <span className="shrink-0">ชุด</span>
              </div>
            </div>

            {/* ── อุปกรณ์ที่ใช้ / คำแนะนำผู้คุมสอบ ── */}
            <div className="border-t border-slate-300 pt-3 mb-6 text-sm">
              <p className="font-semibold mb-2">อุปกรณ์ที่ใช้หรือคำแนะนำผู้คุมสอบเพิ่มเติม</p>
              <div className="space-y-1.5 pl-2">
                {[['optBooks', 'นำตำราเข้าห้องสอบได้'],
                  ['optCalculator', 'นำเครื่องคิดเลขเข้าห้องสอบได้'],
                  ['optNoRuler', 'ห้ามนำไม้บรรทัดมีสูตรคณิตศาสตร์เข้าสอบ']].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        className="w-3.5 h-3.5 accent-indigo-600"
                      />
                      <span>(</span>
                      <span className="w-6 inline-block border-b border-slate-400"/>
                      <span>)</span>
                      <span>{label}</span>
                    </label>))}
              </div>
            </div>

            {/* ── ผู้ออกข้อสอบ / ห้องทำงาน ── */}
            <div className="space-y-2 text-sm mb-6">
              <div className="flex items-center gap-2">
                <span className="w-32 shrink-0">ผู้ออกข้อสอบ</span>
                <Dots className="flex-1"/>
                <Field value={form.examAuthor} onChange={set('examAuthor')} className="w-56 text-center"/>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-32 shrink-0">ห้องทำงาน</span>
                <Dots className="flex-1"/>
                <Field value={form.office} onChange={set('office')} className="w-56 text-center"/>
              </div>
            </div>

            {/* ── จำนวนเข้าสอบ / ขาดสอบ + รายชื่อผู้ขาด ── */}
            <div className="space-y-3 text-sm mb-6">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                <div className="flex items-center gap-2">
                  <span>จำนวนนักศึกษาที่เข้าสอบ</span>
                  <Field value={form.attendedCount} onChange={set('attendedCount')} className="w-16 text-center"/>
                  <span>คน</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>จำนวนนักศึกษาที่ขาดสอบ</span>
                  <Field value={form.absentCount} onChange={set('absentCount')} className="w-16 text-center"/>
                  <span>คน คือ</span>
                </div>
              </div>

              {/* ตารางรายชื่อผู้ขาดสอบ: รหัส | ชื่อ-สกุล */}
              <div>
                <div className="flex items-center gap-6 mb-1 pl-1">
                  <span className="w-44 shrink-0 text-center font-semibold">รหัส</span>
                  <span className="flex-1 text-center font-semibold">ชื่อ-สกุล</span>
                </div>
                {form.absentees.map((a, i) => (<div key={i} className="flex items-center gap-6 mb-2">
                    <Field value={a.code} onChange={setAbsentee(i, 'code')} className="w-44 text-center"/>
                    <Field value={a.name} onChange={setAbsentee(i, 'name')} className="flex-1"/>
                  </div>))}
              </div>
            </div>

            {/* ── ผู้คุมสอบ ── */}
            <div className="space-y-2.5 text-sm mb-5">
              {form.proctors.map((p, i) => (<div key={i} className="flex items-center gap-2 pl-8">
                  <span className="w-5 shrink-0">{i + 1}.</span>
                  <Dots className="flex-1"/>
                  <Field value={p} onChange={setProctor(i)} className="w-64 text-center"/>
                  <span className="shrink-0">ผู้คุมสอบ</span>
                </div>))}
            </div>

            {/* ── หมายเหตุ ── */}
            <div className="flex items-center gap-2 text-sm">
              <span className="shrink-0">หมายเหตุ</span>
              <Dots className="flex-1"/>
              <Field value={form.note} onChange={set('note')} className="flex-1"/>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="no-print bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            พิมพ์ได้เฉพาะใบปะหน้า — โลโก้จะแสดงเมื่อนำภาพมาใส่ในช่องวางโลโก้
          </div>
          <Button onClick={onClose} variant="secondary" size="sm" className="px-4">
            ปิดหน้าต่าง
          </Button>
        </div>
      </div>
    </div>);
};
