/**หน้าที่ของหน้านี้: ใบปะหน้าซองข้อสอบ */
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

/** ช่อง input**/
const Input = ({ label, value, onChange, className = '' }) => (
    <div className={className}>
        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
        />
    </div>
);

/** เส้นประพร้อมค่าที่กรอก*/
const Line = ({ value, className = '' }) => (
    <span className={`block border-b border-dotted border-slate-600 text-center text-sm leading-snug min-h-[1.6rem] pb-1.5 break-words ${className}`}>
        {value}
    </span>
);
/** เส้นประเปล่า */
const Dots = ({ className = '' }) => <span className={`block border-b border-dotted border-slate-600 ${className}`} />;

export const ExamEnvelopeCover = ({ exam, onClose, onPrintRecorded }) => {
    const [tab, setTab] = useState('form'); // 'form' | 'doc'
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
        const doPrint = () => {
            document.body.classList.add('printing-envelope');
            window.print();
            setTimeout(() => document.body.classList.remove('printing-envelope'), 500);
        };
        if (tab !== 'doc') {
            // สลับไปหน้าเอกสารก่อน แล้วค่อยสั่งพิมพ์ (รอ render สั้นๆ)
            setTab('doc');
            setTimeout(doPrint, 200);
        }
        else {
            doPrint();
        }
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
                {exam ? `${exam.Subject_ID} : ${exam.Subject_Name}` : 'ตัวอย่างแบบฟอร์ม'} — กรอกฟอร์มแล้วดูตัวอย่าง/สั่งพิมพ์
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

        {/* Tabs (สลับระหว่างฟอร์มกรอก กับ เอกสารใบปะหน้า) */}
        <div className="no-print flex space-x-2 px-6 pt-4 border-b border-slate-200 text-xs font-medium">
          <button onClick={() => setTab('form')} className={`px-4 py-2.5 rounded-t-xl transition-all ${tab === 'form' ? 'bg-slate-100 text-indigo-700 font-bold border-t-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
            1. ฟอร์มกรอกข้อมูล
          </button>
          <button onClick={() => setTab('doc')} className={`px-4 py-2.5 rounded-t-xl transition-all ${tab === 'doc' ? 'bg-slate-100 text-indigo-700 font-bold border-t-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
            2. ใบปะหน้า (ตัวอย่าง/พิมพ์)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">

          {/* ═══ แท็บ 1: ฟอร์มกรอกข้อมูล ═══ */}
          {tab === 'form' && (<div className="bg-white shadow border border-slate-200 rounded-xl mx-auto max-w-3xl p-6 space-y-6">
              {/* ข้อมูลการสอบ */}
              <div>
                <p className="font-display font-bold text-sm text-slate-900 mb-3">ข้อมูลการสอบ</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="การสอบวิชา" value={form.subject} onChange={set('subject')}/>
                  <Input label="รหัสวิชา" value={form.subjectCode} onChange={set('subjectCode')}/>
                  <Input label="สอบวันที่" value={form.examDay} onChange={set('examDay')}/>
                  <Input label="เดือน" value={form.examMonth} onChange={set('examMonth')}/>
                  <Input label="พ.ศ." value={form.examYearBE} onChange={set('examYearBE')}/>
                  <Input label="เวลา" value={form.examTime} onChange={set('examTime')}/>
                  <Input label="ห้องสอบ" value={form.examRoom} onChange={set('examRoom')}/>
                  <Input label="เลขประจำซอง" value={form.envelopeNo} onChange={set('envelopeNo')}/>
                  <Input label="จำนวนนักศึกษา (คน)" value={form.studentCount} onChange={set('studentCount')}/>
                  <Input label="ซองนี้มีจำนวนข้อสอบ (จุด)" value={form.examCopies} onChange={set('examCopies')}/>
                  <Input label="นศ. คณะ" value={form.facultyName} onChange={set('facultyName')}/>
                  <Input label="ตอน" value={form.section} onChange={set('section')}/>
                  <Input label="ข้อสอบสำรอง (ชุด)" value={form.reserveSets} onChange={set('reserveSets')}/>
                </div>
              </div>

              {/* อุปกรณ์ที่ใช้ */}
              <div>
                <p className="font-display font-bold text-sm text-slate-900 mb-3">อุปกรณ์ที่ใช้หรือคำแนะนำผู้คุมสอบเพิ่มเติม</p>
                <div className="space-y-2 pl-1">
                  {[['optBooks', 'นำตำราเข้าห้องสอบได้'],
                    ['optCalculator', 'นำเครื่องคิดเลขเข้าห้องสอบได้'],
                    ['optNoRuler', 'ห้ามนำไม้บรรทัดมีสูตรคณิตศาสตร์เข้าสอบ']].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form[key]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                          className="w-4 h-4 accent-indigo-600"
                        />
                        <span>{label}</span>
                      </label>))}
                </div>
              </div>

              {/* ผู้ออกข้อสอบ */}
              <div>
                <p className="font-display font-bold text-sm text-slate-900 mb-3">ผู้ออกข้อสอบ</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="ผู้ออกข้อสอบ" value={form.examAuthor} onChange={set('examAuthor')}/>
                  <Input label="ห้องทำงาน" value={form.office} onChange={set('office')}/>
                  <Input label="จำนวนนักศึกษาที่เข้าสอบ (คน)" value={form.attendedCount} onChange={set('attendedCount')}/>
                  <Input label="จำนวนนักศึกษาที่ขาดสอบ (คน)" value={form.absentCount} onChange={set('absentCount')}/>
                </div>
              </div>

              {/* รายชื่อผู้ขาดสอบ */}
              <div>
                <p className="font-display font-bold text-sm text-slate-900 mb-3">รายชื่อนักศึกษาที่ขาดสอบ</p>
                <div className="space-y-2">
                  {form.absentees.map((a, i) => (<div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label={`รหัส (${i + 1})`} value={a.code} onChange={setAbsentee(i, 'code')}/>
                      <Input label={`ชื่อ-สกุล (${i + 1})`} value={a.name} onChange={setAbsentee(i, 'name')}/>
                    </div>))}
                </div>
              </div>

              {/* ผู้คุมสอบ + หมายเหตุ */}
              <div>
                <p className="font-display font-bold text-sm text-slate-900 mb-3">ผู้คุมสอบและหมายเหตุ</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {form.proctors.map((p, i) => (<Input key={i} label={`ผู้คุมสอบ (${i + 1})`} value={p} onChange={setProctor(i)}/>))}
                  <Input label="หมายเหตุ" value={form.note} onChange={set('note')} className="sm:col-span-2"/>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <p className="text-xs text-slate-500">กรอกเสร็จแล้วสลับไปแท็บ "ใบปะหน้า" เพื่อดูตัวอย่างและสั่งพิมพ์</p>
                <Button onClick={() => setTab('doc')} size="sm">
                  ไปที่ใบปะหน้า
                </Button>
              </div>
            </div>)}

          {/* ═══ แท็บ 2: ใบปะหน้า (เอกสาร — ค่าเป็นตัวอักษรบนเส้นประ) ═══ */}
          {/* id="printable-envelope" — CSS @media print ซ่อนทุกอย่างแล้วเปิดเฉพาะ element นี้ (REQ-0013) */}
          {tab === 'doc' && (<div id="printable-envelope" className="bg-white shadow border border-slate-300 mx-auto max-w-3xl px-8 py-8 text-slate-900 min-h-[900px]">

              {/* ── โลโก้ (ช่องวาง — นำภาพมาใส่เองภายหลัง) ── */}
              <div className="flex justify-center mb-3">
                <img src="/logoscipsu.png" alt="ตราสัญลักษณ์คณะวิทยาศาสตร์ ม.สงขลานครินทร์" className="h-32 object-contain"/>
              </div>

              {/* ── คณะ / มหาวิทยาลัย ── */}
              <div className="text-center space-y-1 mb-6">
                <p className="font-display text-xl font-bold text-slate-900">คณะวิทยาศาสตร์</p>
                <p className="font-display text-xl font-bold text-slate-900">มหาวิทยาลัยสงขลานครินทร์</p>
              </div>

              {/* ── ข้อมูลการสอบ (flex — จุดไข่ปลาชิดตัวอักษรทั้งสองด้าน) ── */}
              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-end">
                  <span className="shrink-0">การสอบวิชา</span>
                  <Line value={form.subject} className="flex-1"/>
                  <span className="shrink-0">รหัสวิชา</span>
                  <Line value={form.subjectCode} className="w-28 shrink-0"/>
                </div>
                <div className="flex items-end">
                  <span className="shrink-0">สอบวันที่</span>
                  <Line value={form.examDay} className="w-24 shrink-0"/>
                  <span className="shrink-0">เดือน</span>
                  <Line value={form.examMonth} className="flex-1"/>
                  <span className="shrink-0">พ.ศ.</span>
                  <Line value={form.examYearBE} className="w-16 shrink-0"/>
                  <span className="shrink-0">เวลา</span>
                  <Line value={form.examTime} className="w-28 shrink-0"/>
                  <span className="shrink-0">น.</span>
                </div>
                <div className="flex items-end">
                  <span className="shrink-0">ห้องสอบ</span>
                  <Line value={form.examRoom} className="flex-1"/>
                  <span className="shrink-0">เลขประจำซอง</span>
                  <Line value={form.envelopeNo} className="w-24 shrink-0"/>
                </div>
                <div className="flex items-end">
                  <span className="shrink-0">จำนวนนักศึกษา</span>
                  <Line value={form.studentCount} className="flex-1"/>
                  <span className="shrink-0">คน</span>
                </div>
                <div className="flex items-end">
                  <span className="shrink-0">ซองนี้มีจำนวนข้อสอบ</span>
                  <Line value={form.examCopies} className="w-16 shrink-0"/>
                  <span className="shrink-0">ชุด</span>
                  <span className="shrink-0">นศ. คณะ</span>
                  <Line value={form.facultyName} className="flex-1"/>
                  <span className="shrink-0">ตอน</span>
                  <Line value={form.section} className="w-14 shrink-0"/>
                </div>
                <div className="flex items-end">
                  <span className="shrink-0">ข้อสอบสำรอง</span>
                  <Line value={form.reserveSets} className="w-16 shrink-0"/>
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
                      <div key={key} className="flex items-center gap-2">
                        <span>(</span>
                        <span className="w-6 inline-block border-b border-slate-500 text-center text-xs">
                          {form[key] ? '✓' : ''}
                        </span>
                        <span>)</span>
                        <span>{label}</span>
                      </div>))}
                </div>
              </div>

              {/* ── ผู้ออกข้อสอบ / ห้องทำงาน ── */}
              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-end">
                  <span className="shrink-0">ผู้ออกข้อสอบ</span>
                  <Line value={form.examAuthor} className="flex-1"/>
                </div>
                <div className="flex items-end">
                  <span className="shrink-0">ห้องทำงาน</span>
                  <Line value={form.office} className="flex-1"/>
                </div>
              </div>

              {/* ── จำนวนเข้าสอบ / ขาดสอบ + รายชื่อผู้ขาด ── */}
              <div className="space-y-3 text-sm mb-6">
                <div className="grid grid-cols-12 items-end gap-x-2">
                  <span className="col-span-4 whitespace-nowrap">จำนวนนักศึกษาที่เข้าสอบ</span>
                  <Line value={form.attendedCount} className="col-span-2"/>
                  <span className="col-span-1">คน</span>
                  <span className="col-span-3 whitespace-nowrap text-right">จำนวนนักศึกษาที่ขาดสอบ</span>
                  <Line value={form.absentCount} className="col-span-1"/>
                  <span className="col-span-1 whitespace-nowrap">คน คือ</span>
                </div>

                {/* ตารางรายชื่อผู้ขาดสอบ: รหัส | ชื่อ-สกุล */}
                <div>
                  <div className="grid grid-cols-12 gap-x-6 mb-1 pl-1">
                    <span className="col-span-4 text-center font-semibold">รหัส</span>
                    <span className="col-span-8 text-center font-semibold">ชื่อ-สกุล</span>
                  </div>
                  {form.absentees.map((a, i) => (<div key={i} className="grid grid-cols-12 gap-x-6 mb-2">
                      <Line value={a.code} className="col-span-4"/>
                      <Line value={a.name} className="col-span-8"/>
                    </div>))}
                </div>
              </div>

              {/* ── ผู้คุมสอบ ── */}
              <div className="space-y-3 text-sm mb-5">
                {form.proctors.map((p, i) => (<div key={i} className="flex items-end">
                    <span className="shrink-0">{i + 1}.</span>
                    <Line value={p} className="flex-1"/>
                    <span className="shrink-0">ผู้คุมสอบ</span>
                  </div>))}
              </div>

              {/* ── หมายเหตุ ── */}
              <div className="flex items-end text-sm">
                <span className="shrink-0">หมายเหตุ</span>
                <Line value={form.note} className="flex-1"/>
              </div>
            </div>)}
        </div>

        {/* Modal Footer */}
        <div className="no-print bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            พิมพ์ได้เฉพาะหน้าใบปะหน้า — ตราสัญลักษณ์คณะแสดงอัตโนมัติ
          </div>
          <Button onClick={onClose} variant="secondary" size="sm" className="px-4">
            ปิดหน้าต่าง
          </Button>
        </div>
      </div>
    </div>);
};
