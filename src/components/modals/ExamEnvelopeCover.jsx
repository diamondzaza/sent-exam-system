/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: ExamEnvelopeCover.jsx
 * หน้าที่ของหน้านี้: ใบปะหน้าซองข้อสอบ ตามแบบฟอร์มมาตรฐาน (นริ. 345-211) —
 *   โครงหัวกระดาษ: ช่องวางโลโก้ (ผู้ใช้นำมาใส่เองภายหลัง), ข้อมูลรายวิชา/การสอบ,
 *   ตัวเลือกการเผยแพร่สำหรับผู้สอน, ข้อมูลหน่วยงานต้นสังกัด และตารางล่าง
 *   (จำนวนนิสิต / ผู้สอน / กรรมการคุมสอบ / หมายเหตุ) — ทุกช่องเป็นช่องกรอก
 *   เส้นประแบบเอกสารราชการ พิมพ์ได้เฉพาะใบปะหน้าผ่าน body.printing-envelope
 * ผู้ใช้งาน: Teacher / AudioVisual / Operations — เปิดผ่าน AppShell
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, X, FileText } from 'lucide-react';

const initialForm = {
    faculty: '',
    subjectName: '',
    subjectCode: '',
    examDate: '',
    examTime: '',
    term: '',
    year: '',
    room: '',
    seatCount: '',
    copyCount: '',
    toFaculty: '',
    opt1: false,
    opt2: false,
    opt3: false,
    opt4: false,
    orgUnit: '',
    phoneFax: '',
    registered: '',
    seated: '',
    teachers: [
        { name: '', room: '', extra: '' },
        { name: '', room: '', extra: '' },
        { name: '', room: '', extra: '' },
    ],
    proctors: ['', '', ''],
    note: '',
};

// ช่องกรอกเส้นประแบบเอกสารราชการ
const Dot = ({ className = '' }) => <span className={`inline-block border-b border-dotted border-slate-500 ${className}`} />;
const Field = ({ value, onChange, className = '', placeholder = '' }) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`bg-transparent border-0 border-b border-dotted border-slate-500 focus:border-indigo-600 focus:outline-none text-slate-900 text-sm px-1 py-0.5 ${className}`}
    />
);

export const ExamEnvelopeCover = ({ exam, onClose, onPrintRecorded }) => {
    const [form, setForm] = useState(initialForm);
    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
    const setTeacher = (i, key) => (e) => {
        const arr = form.teachers.map((t, idx) => (idx === i ? { ...t, [key]: e.target.value } : t));
        setForm({ ...form, teachers: arr });
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
              <h3 className="font-display font-semibold text-base">ใบปะหน้าซองข้อสอบ (แบบ นริ. 345-211)</h3>
              <p className="text-xs text-slate-400">
                {exam ? `${exam.Subject_ID} : ${exam.Subject_Name}` : 'ตัวอย่างแบบฟอร์ม'} — กรอกข้อมูลแล้วสั่งพิมพ์ได้
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
          <div className="bg-white shadow border border-slate-300 mx-auto max-w-3xl px-8 py-6 text-slate-900">

            {/* ── หัวกระดาษ: โลโก้ (ช่องวาง — นำภาพมาใส่เองภายหลัง) ── */}
            <div className="flex justify-center mb-2">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-300 text-center leading-tight">
                ที่วาง<br/>โลโก้
              </div>
            </div>

            {/* คณะ / หน่วยงาน + รหัสแบบฟอร์ม */}
            <div className="text-center space-y-1 mb-5">
              <div className="flex items-center justify-center gap-2 text-lg">
                <span className="font-semibold">คณะ</span>
                <Field value={form.faculty} onChange={set('faculty')} className="w-64 text-center"/>
              </div>
              <p className="text-xs text-slate-500">แบบ นริ. 345-211</p>
            </div>

            {/* ── ข้อมูลรายวิชา / การสอบ ── */}
            <div className="space-y-2.5 text-sm mb-6">
              <div className="flex items-center gap-2">
                <span className="w-36 shrink-0">รายวิชา</span>
                <Field value={form.subjectName} onChange={set('subjectName')} className="flex-1"/>
                <span className="shrink-0">รหัสวิชา</span>
                <Field value={form.subjectCode} onChange={set('subjectCode')} className="w-28 text-center"/>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-36 shrink-0">วันที่สอบ</span>
                <Field value={form.examDate} onChange={set('examDate')} className="w-44 text-center"/>
                <span className="shrink-0">เวลาสอบ</span>
                <Field value={form.examTime} onChange={set('examTime')} className="flex-1 text-center"/>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-36 shrink-0">ภาคการศึกษาที่</span>
                <Field value={form.term} onChange={set('term')} className="w-16 text-center"/>
                <span className="shrink-0">ปีการศึกษา</span>
                <Field value={form.year} onChange={set('year')} className="w-24 text-center"/>
                <span className="shrink-0 ml-4">เลขที่ห้องสอบ</span>
                <Field value={form.room ?? ''} onChange={set('room')} className="flex-1 text-center"/>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-36 shrink-0">จำนวนที่นั่งสอบ</span>
                <Field value={form.seatCount} onChange={set('seatCount')} className="w-20 text-center"/>
                <span className="shrink-0">ที่นั่ง</span>
                <span className="shrink-0 ml-4">จำนวนข้อสอบ</span>
                <Field value={form.copyCount} onChange={set('copyCount')} className="w-20 text-center"/>
                <span className="shrink-0">ฉบับ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-36 shrink-0">ส่งถึงคุณครูผู้คุมสอบ คณะ</span>
                <Field value={form.toFaculty} onChange={set('toFaculty')} className="flex-1 text-center"/>
              </div>
            </div>

            {/* ── คำแนะนำ + ตัวเลือกการเผยแพร่ ── */}
            <div className="border-t-2 border-slate-800 pt-3 mb-5 text-sm">
              <p className="text-center font-semibold mb-2">
                คุณครูผู้สอนที่ส่งข้อสอบในเวลาปกติ โปรดทำเครื่องหมายลงในช่องที่ถูกต้อง
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 px-2">
                {[['opt1', 'นำเข้าที่ทำการสอบได้'],
                  ['opt2', 'ไม่บรรจุตีพิมพ์ผู้เข้าสอบได้'],
                  ['opt3', 'นำเข้าในห้องสมุดยืมได้ คืนได้'],
                  ['opt4', 'ห้ามนำเข้าห้องสอบเด็ดขาด']].map(([key, label]) => (
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

            {/* ── หน่วยงานต้นสังกัด ── */}
            <div className="space-y-2 text-sm mb-6">
              <div className="flex items-center gap-2">
                <span className="w-44 shrink-0">หน่วยงานต้นสังกัด</span>
                <Field value={form.orgUnit} onChange={set('orgUnit')} className="flex-1 text-center"/>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-44 shrink-0">โทรศัพท์/โทรสาร</span>
                <Field value={form.phoneFax} onChange={set('phoneFax')} className="flex-1 text-center"/>
              </div>
            </div>

            {/* ── ตารางด้านล่าง (กรอบใหญ่) ── */}
            <div className="border-2 border-slate-800 p-3 space-y-3 text-sm">
              {/* จำนวนนิสิต */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <span>จำนวนนิสิตที่ลงทะเบียน</span>
                  <Field value={form.registered} onChange={set('registered')} className="w-16 text-center"/>
                  <span>คน</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>จำนวนนิสิตที่นั่งสอบได้</span>
                  <Field value={form.seated} onChange={set('seated')} className="w-16 text-center"/>
                  <span>คน</span>
                </div>
              </div>

              {/* ตารางผู้สอน */}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-y border-slate-800">
                    <th className="border-x border-slate-800 px-2 py-1 w-12 font-semibold">ลำดับ</th>
                    <th className="border-x border-slate-800 px-2 py-1 w-2/5 font-semibold">ผู้สอน</th>
                    <th className="border-x border-slate-800 px-2 py-1 w-1/4 font-semibold">ชื่อ-สกุล</th>
                    <th className="border-x border-slate-800 px-2 py-1 w-1/5 font-semibold">ห้องสอบ</th>
                    <th className="border-x border-slate-800 px-2 py-1 w-20 font-semibold">จำนวนซ้ำ</th>
                  </tr>
                </thead>
                <tbody>
                  {form.teachers.map((t, i) => (<tr key={i} className="border-b border-slate-400">
                      <td className="border-x border-slate-800 px-2 py-1.5 text-center">{i + 1}.</td>
                      <td className="border-x border-slate-800 px-1"><Field value={t.name} onChange={setTeacher(i, 'name')} className="w-full"/></td>
                      <td className="border-x border-slate-800 px-1"><Field value={t.room} onChange={setTeacher(i, 'room')} className="w-full"/></td>
                      <td className="border-x border-slate-800 px-1"><Field value={t.extra} onChange={setTeacher(i, 'extra')} className="w-full text-center"/></td>
                      <td className="border-x border-slate-800"/>
                    </tr>))}
                </tbody>
              </table>

              {/* กรรมการคุมสอบ */}
              <div className="space-y-1.5">
                <p className="font-semibold">กรรมการคุมสอบ</p>
                {form.proctors.map((p, i) => (<div key={i} className="flex items-center gap-2 pl-4">
                    <span className="w-5">{i + 1}.</span>
                    <Field value={p} onChange={setProctor(i)} className="flex-1"/>
                    <span className="shrink-0">ผู้คุมสอบ</span>
                  </div>))}
              </div>

              {/* หมายเหตุ */}
              <div className="flex items-center gap-2 pt-1">
                <span className="shrink-0">หมายเหตุ</span>
                <Field value={form.note} onChange={set('note')} className="flex-1"/>
              </div>
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
