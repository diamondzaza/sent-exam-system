/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: ExamEnvelopeCover.jsx
 * หน้าที่ของหน้านี้: ใบปะหน้าซองข้อสอบ แบ่งเป็น 2 หน้า (สลับดู/พิมพ์ได้):
 *   1. หน้าปกซอง — ช่องวางโลโก้ (ผู้ใช้นำมาใส่เอง) + คณะวิทยาศาสตร์ +
 *      มหาวิทยาลัยราชภัฏสวนดุสิต
 *   2. แบบฟอร์มรายละเอียด — ตามแบบฟอร์มมาตรฐาน: ภาคการศึกษา/รหัสวิชา/ชื่อวิชา/
 *      วันสอบ/จำนวนนิสิต, ตัวเลือกสำนวนข้อสอบ, ผู้สอนรายวิชา/ผู้ประสานงาน,
 *      ตารางห้องสอบ และผู้คุมสอบ — ทุกช่องเป็นช่องกรอกเส้นประ ว่างไว้ให้กรอก
 *   พิมพ์ได้เฉพาะหน้าที่กำลังดู ผ่าน body.printing-envelope
 * ผู้ใช้งาน: Teacher / AudioVisual / Operations — เปิดผ่าน AppShell
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, X, FileText } from 'lucide-react';

const initialForm = {
    semester: '',
    subjectCode: '',
    subjectName: '',
    revisedTimes: '',
    buddhistYear: '',
    term: '',
    termNo: '',
    examDate: '',
    examTime: '',
    studentCount: '',
    presentCount: '',
    approvedBy: '',
    backupCount: '',
    opt1: false,
    opt2: false,
    opt3: false,
    lecturer: '',
    coordinator: '',
    registered: '',
    seated: '',
    rooms: ['', ''],
    seating: ['', ''],
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
    const [tab, setTab] = useState('cover'); // 'cover' | 'form'
    const [form, setForm] = useState(initialForm);
    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
    const setListItem = (key, i) => (e) => {
        const arr = form[key].map((v, idx) => (idx === i ? e.target.value : v));
        setForm({ ...form, [key]: arr });
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
                {exam ? `${exam.Subject_ID} : ${exam.Subject_Name}` : 'ตัวอย่างแบบฟอร์ม'} — เลือกหน้าที่ต้องการแล้วสั่งพิมพ์
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handlePrint} size="sm" className="px-3.5" title="พิมพ์หน้าที่กำลังดู (พร้อมบันทึก Audit Log)">
              <Printer className="w-3.5 h-3.5"/>
              <span>พิมพ์หน้านี้</span>
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800" aria-label="ปิด">
              <X className="w-5 h-5"/>
            </Button>
          </div>
        </div>

        {/* Tabs (สลับหน้า) */}
        <div className="no-print flex space-x-2 px-6 pt-4 border-b border-slate-200 text-xs font-medium">
          <button onClick={() => setTab('cover')} className={`px-4 py-2.5 rounded-t-xl transition-all ${tab === 'cover' ? 'bg-slate-100 text-indigo-700 font-bold border-t-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
            1. หน้าปกซอง
          </button>
          <button onClick={() => setTab('form')} className={`px-4 py-2.5 rounded-t-xl transition-all ${tab === 'form' ? 'bg-slate-100 text-indigo-700 font-bold border-t-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
            2. แบบฟอร์มรายละเอียด
          </button>
        </div>

        {/* ═══ Printable sheet — เนื้อหาตามแท็บที่เลือก ═══ */}
        <div id="printable-envelope" className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
          <div className="bg-white shadow border border-slate-300 mx-auto max-w-3xl px-8 py-8 text-slate-900 min-h-[900px]">

            {/* ═══ หน้า 1: หน้าปกซองข้อสอบ ═══ */}
            {tab === 'cover' && (<div className="min-h-[820px]">
                {/* ช่องวางโลโก้ — ผู้ใช้นำภาพมาใส่เองภายหลัง */}
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-300 text-center leading-tight">
                    ที่วางโลโก้
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <p className="font-display text-2xl font-bold text-slate-900">คณะวิทยาศาสตร์</p>
                  <p className="font-display text-2xl font-bold text-slate-900">มหาวิทยาลัยราชภัฏสวนดุสิต</p>
                </div>
              </div>)}

            {/* ═══ หน้า 2: แบบฟอร์มรายละเอียด ═══ */}
            {tab === 'form' && (<div className="space-y-3 text-sm">
                {/* แถว 1: ภาคการศึกษา | รหัสวิชา */}
                <div className="flex items-center gap-2">
                  <span className="shrink-0">ภาคการศึกษา</span>
                  <Dots className="flex-1"/>
                  <Field value={form.semester} onChange={set('semester')} className="w-32 text-center"/>
                  <span className="shrink-0 ml-4">รหัสวิชา</span>
                  <Dots className="flex-1"/>
                  <Field value={form.subjectCode} onChange={set('subjectCode')} className="w-40 text-center"/>
                </div>

                {/* แถว 2: ชื่อวิชา | ปรับปรุงครั้งที่ | ปี พ.ศ. | ภาคเรียนที่ */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="shrink-0">ชื่อวิชา</span>
                  <Dots className="w-40"/>
                  <Field value={form.subjectName} onChange={set('subjectName')} className="flex-1 min-w-40 text-center"/>
                  <span className="shrink-0">ที่ปรับปรุงครั้งที่</span>
                  <Field value={form.revisedTimes} onChange={set('revisedTimes')} className="w-16 text-center"/>
                  <span className="shrink-0">ปี พ.ศ.</span>
                  <Field value={form.buddhistYear} onChange={set('buddhistYear')} className="w-20 text-center"/>
                  <span className="shrink-0">ภาคเรียนที่</span>
                  <Field value={form.term} onChange={set('term')} className="w-14 text-center"/>
                  <span className="shrink-0">ที่</span>
                  <Field value={form.termNo} onChange={set('termNo')} className="w-14 text-center"/>
                </div>

                {/* แถว 3: วันสอบ | เวลาสอบ */}
                <div className="flex items-center gap-2">
                  <span className="shrink-0">วันสอบ</span>
                  <Dots className="flex-1"/>
                  <Field value={form.examDate} onChange={set('examDate')} className="w-44 text-center"/>
                  <span className="shrink-0 ml-4">เวลาสอบ</span>
                  <Dots className="flex-1"/>
                  <Field value={form.examTime} onChange={set('examTime')} className="w-36 text-center"/>
                </div>

                {/* แถว 4: จำนวนนิสิต */}
                <div className="flex items-center gap-2">
                  <span className="shrink-0">จำนวนนิสิต</span>
                  <Dots className="flex-1"/>
                  <Field value={form.studentCount} onChange={set('studentCount')} className="w-20 text-center"/>
                  <span className="shrink-0">คน</span>
                </div>

                {/* แถว 5: สอบวันนี้สอบได้ | ลงชื่อคณบดี */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="shrink-0">สอบวันนี้สอบได้</span>
                  <Dots className="w-20"/>
                  <Field value={form.presentCount} onChange={set('presentCount')} className="w-16 text-center"/>
                  <span className="shrink-0">คน</span>
                  <span className="shrink-0 ml-6">ลงชื่อ คณบดี</span>
                  <Dots className="flex-1"/>
                  <Field value={form.approvedBy} onChange={set('approvedBy')} className="w-40 text-center"/>
                  <span className="shrink-0">ตรวจสอบแล้ว</span>
                </div>

                {/* แถว 6: จำนวนสำรอง */}
                <div className="flex items-center gap-2">
                  <span className="shrink-0">จำนวนสำรอง</span>
                  <Dots className="flex-1"/>
                  <Field value={form.backupCount} onChange={set('backupCount')} className="w-20 text-center"/>
                  <span className="shrink-0">คน</span>
                </div>

                {/* ตัวเลือกสำนวนข้อสอบ */}
                <div className="border-t border-slate-300 pt-3 space-y-2">
                  <p className="font-semibold">ผู้ประพันธ์ที่มีสิทธิ์จะเป็นผู้ชี้ขาดผู้เข้าสอบได้หรือไม่ได้</p>
                  <div className="space-y-1.5 pl-2">
                    {[['opt1', 'เป็นสำนวนที่ยืมได้'],
                      ['opt2', 'เป็นสำนวนตัวอย่างที่ยืมได้'],
                      ['opt3', 'เป็นสำนวนในบริเวณห้องสมุดและอ่านได้ที่ไหนก็ได้']].map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form[key]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                            className="w-3.5 h-3.5 accent-indigo-600"
                          />
                          <span>( )</span>
                          <span>{label}</span>
                        </label>))}
                  </div>
                </div>

                {/* ลงชื่อ: ผู้สอนรายวิชา / ผู้ประสานงาน */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-40 shrink-0">ผู้สอนรายวิชา</span>
                    <Dots className="flex-1"/>
                    <Field value={form.lecturer} onChange={set('lecturer')} className="w-56 text-center"/>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-40 shrink-0">ผู้ประสานงาน</span>
                    <Dots className="flex-1"/>
                    <Field value={form.coordinator} onChange={set('coordinator')} className="w-56 text-center"/>
                  </div>
                </div>

                {/* จำนวนนิสิตลงทะเบียน / นั่งสอบได้ */}
                <div className="border-t border-slate-300 pt-3 flex flex-wrap items-center gap-x-8 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span>จำนวนนิสิตที่ลงทะเบียน</span>
                    <Dots className="w-16"/>
                    <Field value={form.registered} onChange={set('registered')} className="w-16 text-center"/>
                    <span>คน</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>จำนวนนิสิตที่นั่งสอบได้</span>
                    <Dots className="w-16"/>
                    <Field value={form.seated} onChange={set('seated')} className="w-16 text-center"/>
                    <span>คนที่</span>
                  </div>
                </div>

                {/* ตารางห้องสอบ: ห้องที่ | ที่นั่งสอบ */}
                <div className="pt-2">
                  <div className="flex items-center gap-8 mb-1 pl-1">
                    <span className="w-40 shrink-0 text-center font-semibold">ห้องที่</span>
                    <span className="flex-1 text-center font-semibold">ที่นั่งสอบ</span>
                  </div>
                  {form.rooms.map((room, i) => (<div key={i} className="flex items-center gap-8 mb-2">
                      <Field value={room} onChange={setListItem('rooms', i)} className="w-40 text-center"/>
                      <Field value={form.seating[i]} onChange={setListItem('seating', i)} className="flex-1 text-center"/>
                    </div>))}
                </div>

                {/* ผู้คุมสอบ */}
                <div className="pt-2 space-y-2">
                  {form.proctors.map((p, i) => (<div key={i} className="flex items-center gap-2 pl-8">
                      <span className="w-5 shrink-0">{i + 1}.</span>
                      <Dots className="flex-1"/>
                      <Field value={p} onChange={setListItem('proctors', i)} className="w-64 text-center"/>
                      <span className="shrink-0">ผู้คุมสอบ</span>
                    </div>))}
                </div>

                {/* หมายเหตุ */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-300">
                  <span className="shrink-0">หมายเหตุ</span>
                  <Dots className="flex-1"/>
                  <Field value={form.note} onChange={set('note')} className="flex-1"/>
                </div>
              </div>)}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="no-print bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            พิมพ์ได้เฉพาะหน้าที่กำลังดู — โลโก้จะแสดงเมื่อนำภาพมาใส่ในช่องวางโลโก้
          </div>
          <Button onClick={onClose} variant="secondary" size="sm" className="px-4">
            ปิดหน้าต่าง
          </Button>
        </div>
      </div>
    </div>);
};
