/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: TeacherView.jsx
 * หน้าที่ของหน้านี้: เนื้อหาแดชบอร์ดอาจารย์ผู้สอน 4 หน้าย่อย (แสดงภายใน SidebarShell
 *   สลับหน้าผ่านเมนูข้าง) —
 *   1. courses    : ตารางรายวิชา + สถิติสรุป + banner แจ้งเตือน + เมนู ⋮ ต่อรายวิชา
 *   2. tracking   : ติดตามสถานะข้อสอบรายวิชา — banner สถานะ, vertical stepper 5 ขั้น,
 *                   ประวัติการดำเนินงาน, รายละเอียดการสอบ (ดาวน์โหลด / แก้ไขการส่ง)
 *   3. new-course : ฟอร์มเพิ่มรายวิชาใหม่ (ฟอร์มซ้าย + คำแนะนำขวา)
 *   4. cancel     : ยืนยันการยกเลิกการส่งข้อสอบ — ระบุเหตุผลก่อนยืนยัน
 * ผู้ใช้งาน: อาจารย์ผู้สอน (Teacher)
 * ฟีเจอร์หลัก:
 *   1. ตารางรายวิชา + สถานะข้อสอบล่าสุด (STATUS_LABELS)
 *   2. จัดส่งข้อสอบ / อัปโหลดใหม่ (PDF/DOCX ไม่เกิน 25MB)
 *   3. ดูตัวอย่างข้อสอบ, พิมพ์ใบปะหน้า, ยกเลิกการส่ง (ผ่าน onRemoveExam เดิม)
 * หมายเหตุ: มีเงื่อนไขพิเศษ hardcoded — อาจารย์ T001 เห็นทุกรายวิชา (โหมดสาธิต)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { STATUS_LABELS, NO_EXAM_STATUS, EDITABLE_STATUSES, CANCELABLE_STATUSES } from '@/lib/statusLabels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, UploadCloud, RefreshCw, Trash2, Eye, AlertTriangle, AlertCircle, Plus, Printer, Download, MoreVertical, Check, FileText, FileCheck, LoaderCircle, CheckCircle2, Inbox, } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { formatThaiDate } from '@/lib/formatDate';
// ข้อความสรุปสถานะสำหรับ banner หน้าติดตามสถานะ
const STATUS_HEADLINE = {
    SUBMITTED: 'รับไฟล์แล้ว · รอเจ้าหน้าที่ตรวจสอบ',
    VERIFIED: 'ผ่านการตรวจสอบแล้ว · รอจัดพิมพ์',
    PRINTING: 'ระหว่างจัดพิมพ์',
    PRINTED: 'พิมพ์และบรรจุซองเสร็จสิ้น',
    DELIVERED_OD: 'ส่งมอบฝ่ายดำเนินการสอบแล้ว',
    READY_FOR_EXAM: 'พร้อมสอบ',
    REJECTED: 'ไฟล์ไม่ได้รับอนุมัติ · กรุณาส่งฉบับใหม่',
};
// เดือนไทยสำหรับใบปะหน้าซองข้อสอบ
const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
/** เส้นประพร้อมค่าที่กรอก (ใช้ในตัวอย่างใบปะหน้า) */
const Line = ({ value, className = '' }) => (<span className={`block border-b border-dotted border-slate-600 text-center text-sm leading-snug min-h-[1.6rem] pb-1.5 break-words ${className}`}>
    {value}
  </span>);
/** ตัวอย่างใบปะหน้าซองข้อสอบสำหรับดูบนหน้าจอเท่านั้น
 *  ส่วนจำนวนเข้าสอบ/ขาดสอบ/ผู้คุมสอบ/หมายเหตุ เว้นบรรทัดไว้เขียนด้วยลายมือที่หน้างานจริง */
const EnvelopeDocument = ({ form }) => (<div className="no-print bg-white shadow border border-slate-300 mx-auto max-w-3xl px-8 py-8 text-slate-900 min-h-[900px]">

    {/* ── โลโก้ ── */}
    <div className="flex justify-center mb-3">
      <img src="/logoscipsu.png" alt="ตราสัญลักษณ์คณะวิทยาศาสตร์ ม.สงขลานครินทร์" className="h-32 object-contain"/>
    </div>

    {/* ── คณะ / มหาวิทยาลัย ── */}
    <div className="text-center space-y-1 mb-6">
      <p className="font-display text-xl font-bold text-slate-900">คณะวิทยาศาสตร์</p>
      <p className="font-display text-xl font-bold text-slate-900">มหาวิทยาลัยสงขลานครินทร์</p>
    </div>

    {/* ── ข้อมูลการสอบ ── */}
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
          ['optNoRuler', 'ห้ามนำไม้บรรทัดมีสูตรคณิตศาสตร์เข้าสอบ']].map(([key, label]) => (<div key={key} className="flex items-center gap-2">
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

    {/* ── จำนวนเข้าสอบ / ขาดสอบ + รายชื่อผู้ขาด (เขียนด้วยลายมือ) ── */}
    <div className="space-y-3 text-sm mb-6">
      <div className="grid grid-cols-12 items-end gap-x-2">
        <span className="col-span-4 whitespace-nowrap">จำนวนนักศึกษาที่เข้าสอบ</span>
        <Line value={form.attendedCount} className="col-span-2"/>
        <span className="col-span-1">คน</span>
        <span className="col-span-3 whitespace-nowrap text-right">จำนวนนักศึกษาที่ขาดสอบ</span>
        <Line value={form.absentCount} className="col-span-1"/>
        <span className="col-span-1 whitespace-nowrap">คน คือ</span>
      </div>

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

    {/* ── ผู้คุมสอบ (เขียนด้วยลายมือ) ── */}
    <div className="space-y-3 text-sm mb-5">
      {['', '', ''].map((p, i) => (<div key={i} className="flex items-end">
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
  </div>);
// ───────── ฟอร์มจัดส่งข้อสอบแบบ 3 ขั้นตอน (ย้าย logic จาก ExamUploadModal เดิม) ─────────
// payload / validation / การนับหน้า PDF / การส่งไฟล์ = เหมือนเดิมทุกอย่าง แค่เปลี่ยน UI เป็น wizard
const EXAM_UPLOAD_STEPS = [
    { n: 1, label: 'ไฟล์ข้อสอบ' },
    { n: 2, label: 'ข้อมูลการสอบ' },
    { n: 3, label: 'ใบปะหน้าซอง' },
    { n: 4, label: 'ตรวจสอบและส่ง' },
];
const ExamUploadWizard = ({ course, existingExam, isReupload, usedSets = [], prefillExam = null, onDone, onUploadSubmit, onPreviewExam, }) => {
    const [step, setStep] = useState(1);
    // ค่าเริ่มต้น: อัปโหลดซ้ำ = จากข้อสอบเดิม / ชุดใหม่ = ดึงจากชุดล่าสุดของวิชาเดียวกัน (ไม่ต้องกรอกซ้ำ)
    const prefill = existingExam ?? prefillExam ?? {};
    const [examType, setExamType] = useState(prefill.exam_type || '');
    const [examDate, setExamDate] = useState(prefill.E_Date || '');
    const [examTime, setExamTime] = useState(prefill.E_Time || '');
    const [room, setRoom] = useState(prefill.room || '');
    const [totalPages, setTotalPages] = useState(prefill.total_pages ?? '');
    const [totalCopies, setTotalCopies] = useState(prefill.total_copies || '');
    const [copiesReserve, setCopiesReserve] = useState(prefill.copies_reserve ?? '');
    const [envelopeNotes, setEnvelopeNotes] = useState(prefill.envelope_notes || '');
    const [selectedMaterials] = useState(prefill.allowed_materials || ['เครื่องคิดเลขวิทยาศาสตร์', 'ปากกาน้ำเงิน/ดำ', 'ดินสอ 2B']);
    const [fileName, setFileName] = useState(existingExam?.file_name || '');
    const [fileSize, setFileSize] = useState(existingExam?.file_size || '');
    const [fileObject, setFileObject] = useState(null); // ไฟล์จริงส่งขึ้น Supabase Storage
    const [isDragging, setIsDragging] = useState(false);
    const [fileUploaded, setFileUploaded] = useState(Boolean(existingExam?.file_name));
    const [countingPages, setCountingPages] = useState(false);
    const [autoCountMsg, setAutoCountMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);
    const [securityAgreed, setSecurityAgreed] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    // ชุดข้อสอบ (A/B/C...) — ส่งได้หลายชุดต่อรายวิชา; เดาชุดถัดไปจากที่ยังไม่ถูกใช้
    const [examSet, setExamSet] = useState(() => {
        if (existingExam?.exam_set)
            return existingExam.exam_set;
        const used = new Set(usedSets);
        for (const L of ['A', 'B', 'C', 'D', 'E', 'F']) {
            if (!used.has(L))
                return L;
        }
        return 'A';
    });
    // ฟอร์มใบปะหน้าซองข้อสอบ — auto-fill จากข้อมูลที่ระบบมี ส่วนเข้าสอบ/ขาดสอบ/ผู้คุมสอบ/หมายเหตุ เว้นไว้เขียนมือที่หน้างาน
    const [env, setEnv] = useState(() => {
        const d = examDate ? new Date(examDate) : null;
        const valid = d && !isNaN(d.getTime());
        return {
            subject: course.Course_Name ?? '',
            subjectCode: course.Course_id ?? '',
            examDay: valid ? String(d.getDate()) : '',
            examMonth: valid ? THAI_MONTHS[d.getMonth()] : '',
            examYearBE: valid ? String(d.getFullYear() + 543) : '',
            examTime: examTime ?? '',
            examRoom: room ?? '',
            studentCount: String(course.student_count ?? ''),
            examCopies: String(totalCopies || ''),
            facultyName: 'คณะวิทยาศาสตร์',
            section: course.sec || '',
            reserveSets: String(copiesReserve || ''),
            optBooks: false,
            optCalculator: false,
            optNoRuler: false,
            examAuthor: course.teacher_name ?? '',
            office: '',
            attendedCount: '', absentCount: '',
            absentees: [{ code: '', name: '' }, { code: '', name: '' }, { code: '', name: '' }],
            note: envelopeNotes ?? '',
        };
    });
    const acceptFile = (file) => {
        if (!/\.(pdf|docx?)$/i.test(file.name) || file.size > 25 * 1024 * 1024) {
            setErrorMsg('รองรับเฉพาะไฟล์ PDF หรือ DOCX ขนาดไม่เกิน 25MB');
            return;
        }
        setFileName(file.name);
        setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
        setFileObject(file);
        setFileUploaded(true);
        setErrorMsg('');
        setAutoCountMsg('');
        // นับจำนวนหน้าอัตโนมัติเฉพาะ PDF — Word แจ้งเตือนให้กรอกเองทันที
        if (/\.pdf$/i.test(file.name)) {
            handlePageCount(file);
        }
        else {
            setAutoCountMsg('ไฟล์ Word — ระบบนับจำนวนหน้าไม่ได้ กรุณากรอกจำนวนหน้าเองในขั้นถัดไป');
        }
    };
    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            acceptFile(e.dataTransfer.files[0]);
        }
    };
    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            acceptFile(e.target.files[0]);
        }
    };
    // นับจำนวนหน้าของไฟล์ PDF — นับจากโครงสร้าง /Type /Page ในไฟล์
    const countPdfPages = async (file) => {
        try {
            const buf = await file.arrayBuffer();
            const bytes = new Uint8Array(buf);
            let text = '';
            const chunk = 0x8000;
            for (let i = 0; i < bytes.length; i += chunk) {
                text += String.fromCharCode(...bytes.subarray(i, i + chunk));
            }
            const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
            if (pageMatches && pageMatches.length > 0) {
                return pageMatches.length;
            }
            // สำรอง: ใช้ค่า /Count ที่มากที่สุดใน page tree
            const counts = [...text.matchAll(/\/Count\s+(\d+)/g)].map((m) => parseInt(m[1], 10));
            return counts.length ? Math.max(...counts) : 0;
        }
        catch {
            return 0;
        }
    };
    const handlePageCount = async (file) => {
        setCountingPages(true);
        const n = await countPdfPages(file);
        setCountingPages(false);
        if (n > 0) {
            setTotalPages(n);
            setAutoCountMsg(`นับจำนวนหน้าอัตโนมัติจากไฟล์: ${n} หน้า`);
        }
        else {
            setAutoCountMsg('นับจำนวนหน้าอัตโนมัติไม่ได้ — กรุณากรอกเอง');
        }
    };
    // ตรวจช่องจำเป็นของขั้นตอนที่ 1 (ข้อมูลการสอบ)
    const missingStep1 = () => {
        const missing = [];
        if (!examType) missing.push('ประเภทการสอบ');
        if (!examDate) missing.push('วันที่สอบ');
        if (!examTime) missing.push('เวลาสอบ');
        if (!room) missing.push('ห้องสอบ');
        if (!Number(totalCopies)) missing.push('จำนวนชุดที่พิมพ์');
        if (!Number(totalPages)) missing.push('จำนวนหน้าข้อสอบ');
        return missing;
    };
    // ขั้น 1 (ไฟล์) → ขั้น 2 (ข้อมูลการสอบ) — ต้องแนบไฟล์ก่อน เพื่อให้ระบบนับจำนวนหน้าอัตโนมัติ
    const goNextToInfo = () => {
        if (!fileUploaded || !fileName) {
            setErrorMsg('กรุณาเลือกไฟล์ข้อสอบก่อนไปข้อมูลการสอบ');
            return;
        }
        setErrorMsg('');
        setStep(2);
    };
    // ขั้น 2 (ข้อมูลการสอบ) → ขั้น 3 (ใบปะหน้าซอง)
    const goNextToEnvelope = () => {
        const missing = missingStep1();
        if (missing.length) {
            setErrorMsg('กรุณาระบุ: ' + missing.join(', '));
            return;
        }
        setErrorMsg('');
        setStep(3);
    };
    // ขั้น 3 (ใบปะหน้าซอง) → ขั้น 4 (ตรวจสอบและส่ง) — ซิงก์ค่าจากขั้นตอนที่ 2 ลงฟอร์มใบปะหน้า (คงค่าที่แก้เองไว้)
    const goNextToReview = () => {
        setEnv((prev) => {
            const d = examDate ? new Date(examDate) : null;
            const valid = d && !isNaN(d.getTime());
            return {
                ...prev,
                examRoom: room,
                examTime: examTime,
                examDay: valid ? String(d.getDate()) : prev.examDay,
                examMonth: valid ? THAI_MONTHS[d.getMonth()] : prev.examMonth,
                examYearBE: valid ? String(d.getFullYear() + 543) : prev.examYearBE,
                examCopies: String(totalCopies || ''),
                reserveSets: String(copiesReserve || ''),
                note: envelopeNotes || prev.note,
            };
        });
        setErrorMsg('');
        setStep(4);
    };
    // ดูข้อสอบจากขั้นตอนสุดท้าย — ไฟล์ที่เพิ่งแนบ (blob) หรือไฟล์เดิมบนระบบ (ผ่าน preview modal พร้อมลายน้ำ)
    const handleViewExam = () => {
        if (fileObject) {
            const url = URL.createObjectURL(fileObject);
            window.open(url, '_blank', 'noopener');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
        else if (existingExam) {
            onPreviewExam?.(existingExam);
            return;
        }
    };
    const handleSubmit = async () => {
        if (!fileUploaded || !fileName) {
            setErrorMsg('กรุณาเลือกไฟล์ข้อสอบก่อนส่ง');
            return;
        }
        if (!securityAgreed) {
            setErrorMsg('กรุณายืนยันข้อกำหนดด้านความลับของข้อสอบ');
            return;
        }
        const missing = missingStep1();
        if (missing.length) {
            setErrorMsg('กรุณาระบุ: ' + missing.join(', '));
            setStep(2); // ฟิลด์บังคับทั้งหมดอยู่ขั้นที่ 2 — พาไปที่ขั้นนั้น ไม่ใช่ขั้นไฟล์
            return;
        }
        const payload = {
            E_No: existingExam?.E_No || `EX-${course.Course_year}-${Math.floor(100 + Math.random() * 900)}`,
            Subject_ID: course.Course_id,
            Subject_Name: course.Course_Name,
            Course_year: course.Course_year,
            term: course.term,
            teacher_id: course.teacher_id,
            teacher_name: course.teacher_name,
            teacher_tel: '',
            exam_type: examType,
            E_Date: examDate,
            E_Time: examTime,
            room: room,
            exam_set: examSet,
            total_pages: Number(totalPages),
            total_copies: Number(totalCopies),
            copies_reserve: Number(copiesReserve),
            status: 'SUBMITTED',
            file_name: fileName,
            file_size: fileSize,
            upload_date: new Date().toISOString(), // ISO — DB เป็น timestamptz (แสดงผลไทยตอนอ่าน)
            envelope_notes: envelopeNotes,
            allowed_materials: selectedMaterials,
            proctors: [],
        };
        setSending(true);
        setErrorMsg('');
        try {
            const ok = await onUploadSubmit(payload, isReupload, fileObject);
            if (ok) {
                // ส่งสำเร็จ — แสดง overlay แล้วกลับหน้าตารางรายวิชา
                setSentSuccess(true);
                setTimeout(() => {
                    onDone();
                }, 1600);
                return;
            }
        }
        finally {
            setSending(false);
        }
    };
    return (<div className="space-y-6">
      {/* Hero */}
      <div>        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
          แนบไฟล์ข้อสอบ
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          {course.Course_id} · {course.Course_Name} / กลุ่มเรียน {course.sec}
          {isReupload && (<span className="ml-2 inline-flex items-center rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold">
              อัปโหลดฉบับใหม่
            </span>)}
        </p>
      </div>

      {/* แถบลำดับขั้นตอน */}
      <div className="rounded-2xl bg-white border border-slate-200/80 px-5 py-3.5 flex items-center gap-5 sm:gap-8 overflow-x-auto">
        {EXAM_UPLOAD_STEPS.map((s, i) => {
        const done = step > s.n;
        const current = step === s.n;
        return (<React.Fragment key={s.n}>
              {i > 0 && <span className="h-px w-8 sm:w-14 bg-slate-200 shrink-0" aria-hidden="true"/>}
              <button type="button" disabled={s.n >= step} onClick={() => {
                if (s.n < step)
                    setStep(s.n); // ย้อนไปขั้นก่อนหน้าได้เสมอ
            }} aria-current={current ? 'step' : undefined} className={`flex items-center gap-2 text-sm shrink-0 transition-colors disabled:cursor-default ${current
                ? 'text-[#1A4B7A] font-bold'
                : done
                    ? 'text-slate-700 font-semibold hover:text-[#1A4B7A]'
                    : 'text-slate-500 cursor-default'}`}>
                {done ? (<span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="w-3.5 h-3.5"/>
                  </span>) : (<span className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${current
                ? 'border-2 border-[#1A4B7A] text-[#1A4B7A] bg-white'
                : 'bg-slate-100 text-slate-500'}`}>
                    {s.n}
                  </span>)}
                <span>{s.label}</span>
              </button>
            </React.Fragment>);
    })}
      </div>

      {errorMsg && (<div className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600"/>
          <span>{errorMsg}</span>
        </div>)}

      {isReupload && step === 1 && (<div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"/>
          <div>
            <p className="font-semibold">การอัปโหลดไฟล์ใหม่จะแทนที่ฉบับเดิม</p>
            <p className="text-amber-800 mt-0.5">
              ระบบจะปรับสถานะเป็น รอโสตฯ ตรวจสอบ และบันทึกประวัติการแทนที่ไฟล์โดยอัตโนมัติ
            </p>
          </div>
        </div>)}

      {/* ═══ ขั้นตอนที่ 2: ข้อมูลการสอบ ═══ */}
      {step === 2 && (<div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">ข้อมูลการสอบ</h3>
            <p className="text-xs text-slate-500 mt-1">กรอกรายละเอียดการจัดสอบและจำนวนพิมพ์</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="exam-set" className="text-slate-700 mb-1">ชุดข้อสอบ (Set) <span className="text-rose-500">*</span></Label>
              {isReupload ? (<Input id="exam-set" type="text" value={`ชุด ${examSet} (แก้ไขไม่ได้)`} disabled/>) : (<Select id="exam-set" value={examSet} onChange={(e) => setExamSet(e.target.value)} required aria-required="true">
                  {['A', 'B', 'C', 'D', 'E', 'F'].map((L) => (<option key={L} value={L}>
                      ชุด {L}{usedSets.includes(L) && examSet !== L ? ' (ใช้แล้ว)' : ''}
                    </option>))}
                </Select>)}
              <p className="mt-1 text-xs text-slate-500">
                รายวิชาเดียวกันส่งได้หลายชุด — ชุดที่ใช้ไปแล้ว: {usedSets.length > 0 ? usedSets.map((L) => L).join(', ') : 'ยังไม่มี'}
              </p>
            </div>

            <div>
              <Label htmlFor="exam-type" className="text-slate-700 mb-1">ประเภทการจัดสอบ <span className="text-rose-500">*</span></Label>
              <Select id="exam-type" value={examType} onChange={(e) => setExamType(e.target.value)} required aria-required="true">
                <option value="">— เลือกประเภทการสอบ —</option>
                <option value="กลางภาค">สอบกลางภาค</option>
                <option value="ปลายภาค">สอบปลายภาค</option>
                <option value="สอบแก้ตัว">สอบแก้ตัว / ประมวลความรู้</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="exam-date" className="text-slate-700 mb-1">วันที่จัดสอบ <span className="text-rose-500">*</span></Label>
              <Input id="exam-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)}/>
            </div>

            <div>
              <Label htmlFor="exam-time" className="text-slate-700 mb-1">เวลาจัดสอบ <span className="text-rose-500">*</span></Label>
              <Input id="exam-time" type="text" value={examTime} onChange={(e) => setExamTime(e.target.value)} placeholder="เช่น 09:00 - 12:00 น."/>
            </div>

            <div>
              <Label htmlFor="exam-room" className="text-slate-700 mb-1">ห้องสอบที่จัด <span className="text-rose-500">*</span></Label>
              <Input id="exam-room" type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="เช่น SC-401, SC-LAB-3"/>
            </div>

            <div>
              <Label htmlFor="exam-pages" className="text-slate-700 mb-1">
                จำนวนหน้าข้อสอบ (หน้า) <span className="text-rose-500">*</span>
              </Label>
              <Input id="exam-pages" type="number" min="1" max="500" placeholder="ระบุจำนวนหน้าของไฟล์ที่แนบ" value={totalPages} onChange={(e) => setTotalPages(parseInt(e.target.value) || '')} required aria-required="true"/>
              <p className={`mt-1 text-xs flex items-center space-x-1 ${countingPages ? 'text-[#1A4B7A]' : autoCountMsg.includes('ไม่ได้') ? 'text-amber-500' : 'text-emerald-600'}`}>
                {countingPages ? (<>
                  <LoaderCircle className="w-3 h-3 animate-spin"/>
                  <span>กำลังนับจำนวนหน้าจากไฟล์...</span>
                </>) : autoCountMsg && (<>
                  <CheckCircle2 className="w-3 h-3 shrink-0"/>
                  <span>{autoCountMsg}</span>
                </>)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="exam-copies" className="text-slate-700 mb-1">จำนวนชุดที่พิมพ์ <span className="text-rose-500">*</span></Label>
                <Input id="exam-copies" type="number" min="1" value={totalCopies} onChange={(e) => setTotalCopies(parseInt(e.target.value) || 1)} className="px-2.5"/>
              </div>
              <div>
                <Label htmlFor="exam-reserve" className="text-slate-700 mb-1">ชุดสำรอง</Label>
                <Input id="exam-reserve" type="number" min="0" max="20" value={copiesReserve} onChange={(e) => setCopiesReserve(parseInt(e.target.value) || 0)} className="px-2.5"/>
              </div>
            </div>
          </div>

          {/* คำชี้แจง */}
          <div>
            <Label htmlFor="exam-notes" className="text-slate-800 mb-1">
              คำชี้แจงสำหรับกรรมการคุมสอบ / เจ้าหน้าที่หน่วยโสตฯ
            </Label>
            <Textarea id="exam-notes" rows={2} value={envelopeNotes} onChange={(e) => setEnvelopeNotes(e.target.value)} placeholder="ระบุคำสั่งพิเศษ เช่น ให้เย็บมุมบนซ้าย, ห้ามเปิดซองก่อน 10 นาที, แจกกระดาษคำตอบแผ่นคู่"/>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
              ย้อนกลับ
            </Button>
            <Button type="button" onClick={goNextToEnvelope} className="">
              <span>ถัดไป: ใบปะหน้าซอง</span>
            </Button>
          </div>
        </div>)}

      {/* ═══ ขั้นตอนที่ 1: ไฟล์ข้อสอบ ═══ */}
      {step === 1 && (<div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
          <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-7">
            <h3 className="font-display font-bold text-base text-slate-900">ไฟล์ข้อสอบ</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">แนบไฟล์ข้อสอบที่พร้อมจัดพิมพ์</p>

            {/* Dropzone */}
            <div onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
        }} onDragLeave={() => setIsDragging(false)} onDrop={handleFileDrop} className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
            ? 'border-[#1A4B7A] bg-[#1A4B7A]/5'
            : fileUploaded
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'}`}>
              {fileUploaded && fileName ? (<div className="flex items-center justify-between bg-white border border-emerald-300 p-3 rounded-lg shadow-2xs">
                  <div className="flex items-center space-x-3 text-left">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md">
                      <FileCheck className="w-6 h-6"/>
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-slate-900">{fileName}</p>
                      <p className="text-xs text-slate-500">ขนาด {fileSize} · พร้อมจัดส่ง</p>
                    </div>
                  </div>
                  <label className="text-xs text-[#1A4B7A] hover:text-[#153D63] font-medium cursor-pointer underline px-2">
                    เปลี่ยนไฟล์
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileInput} className="hidden"/>
                  </label>
                </div>) : (<div className="space-y-2">
                  <p className="text-[11px] font-bold tracking-widest text-[#1A4B7A]">PDF</p>
                  <p className="font-display text-lg font-bold text-slate-900">ลากไฟล์มาวางที่นี่</p>
                  <p className="text-xs text-slate-500">หรือเลือกไฟล์จากเครื่องของคุณ</p>
                  <label className="inline-block mt-2 cursor-pointer">
                    <span className="inline-flex items-center gap-2 rounded-lg  text-sm font-medium px-4 py-2 transition-colors">
                      <UploadCloud className="w-4 h-4"/>
                      <span>เลือกไฟล์ข้อสอบ</span>
                    </span>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileInput} className="hidden"/>
                  </label>
                </div>)}
            </div>

            {autoCountMsg && (<p className={`mt-3 text-xs flex items-center space-x-1 ${autoCountMsg.includes('ไม่ได้') ? 'text-amber-500' : 'text-emerald-600'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0"/>
                <span>{autoCountMsg}</span>
              </p>)}

            <p className="mt-4 text-xs text-slate-500">
              ตรวจสอบหน้าข้อสอบและลำดับก่อนกดยืนยันจัดส่งข้อสอบ
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onDone} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                ยกเลิก
              </Button>
              <Button type="button" onClick={goNextToInfo} disabled={!fileUploaded} title={fileUploaded ? 'ไปกรอกข้อมูลการสอบ' : 'กรุณาเลือกไฟล์ก่อน'} className="">
                <span>ถัดไป: ข้อมูลการสอบ</span>
              </Button>
            </div>
          </div>

          {/* สรุปข้อมูลรายวิชา */}
          <aside className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            {!isReupload && (<span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold">
                ยังไม่อนุมัติ · รอเจ้าหน้าที่ตรวจสอบ
              </span>)}
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs text-slate-500">รหัสวิชา</dt>
                <dd className="text-sm font-bold text-slate-900 mt-0.5">{course.Course_id}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">ชื่อรายวิชา</dt>
                <dd className="text-sm font-bold text-slate-900 mt-0.5">{course.Course_Name}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">กลุ่มเรียน</dt>
                <dd className="text-sm font-bold text-slate-900 mt-0.5">Sec {course.sec}</dd>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <dt className="text-xs text-slate-500">จำนวนนักศึกษา</dt>
                <dd className="text-sm font-bold text-slate-900 mt-0.5">{course.student_count} คน</dd>
              </div>
            </dl>
            <p className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
              ระบบจะนับจำนวนหน้าจากไฟล์ PDF อัตโนมัติและส่งให้เจ้าหน้าที่โสตทัศน์ตรวจสอบก่อนจัดพิมพ์
            </p>
          </aside>
        </div>)}

      {/* ═══ ขั้นตอนที่ 3: ใบปะหน้าซองข้อสอบ ═══ */}
      {step === 3 && (<div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">ใบปะหน้าซองข้อสอบ</h3>
            <p className="text-xs text-slate-500 mt-1">
              ตรวจสอบข้อมูลบนใบปะหน้า — ส่วนที่ระบบเติมให้แก้ได้ ส่วนที่เหลือเขียนด้วยลายมือที่หน้างานจริง
            </p>
          </div>

          {/* ข้อมูลการสอบ */}
          <div>
            <p className="font-display font-bold text-sm text-slate-900 mb-3">ข้อมูลการสอบ</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
            ['การสอบวิชา', 'subject'],
            ['รหัสวิชา', 'subjectCode'],
            ['สอบวันที่', 'examDay'],
            ['เดือน', 'examMonth'],
            ['พ.ศ.', 'examYearBE'],
            ['เวลา', 'examTime'],
            ['ห้องสอบ', 'examRoom'],
            ['จำนวนนักศึกษา (คน)', 'studentCount'],
            ['ซองนี้มีจำนวนข้อสอบ (ชุด)', 'examCopies'],
            ['นศ. คณะ', 'facultyName'],
            ['ตอน', 'section'],
            ['ข้อสอบสำรอง (ชุด)', 'reserveSets'],
        ].map(([label, key]) => (<div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input type="text" value={env[key] ?? ''} onChange={(e) => setEnv({ ...env, [key]: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#1A4B7A] focus:ring-1 focus:ring-[#1A4B7A] focus:outline-none bg-white"/>
                </div>))}
              <div>
                <Label htmlFor="envelope-number" className="block text-xs font-medium text-slate-600 mb-1">เลขประจำซองข้อสอบ</Label>
                <Input id="envelope-number" type="text" value={examSet} readOnly aria-describedby="envelope-number-help"/>
                <p id="envelope-number-help" className="mt-1 text-xs text-slate-500">ตรงกับชุดข้อสอบที่เลือก เช่น A, B, C — เปลี่ยนได้ที่ขั้นตอนข้อมูลการสอบ</p>
              </div>
            </div>
          </div>

          {/* อุปกรณ์ที่ใช้ */}
          <div>
            <p className="font-display font-bold text-sm text-slate-900 mb-3">อุปกรณ์ที่ใช้หรือคำแนะนำผู้คุมสอบเพิ่มเติม</p>
            <div className="space-y-2 pl-1">
              {[['optBooks', 'นำตำราเข้าห้องสอบได้'],
            ['optCalculator', 'นำเครื่องคิดเลขเข้าห้องสอบได้'],
            ['optNoRuler', 'ห้ามนำไม้บรรทัดมีสูตรคณิตศาสตร์เข้าสอบ']].map(([key, label]) => (<label key={key} className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={env[key]} onChange={(e) => setEnv({ ...env, [key]: e.target.checked })} className="w-4 h-4 accent-[#1A4B7A]"/>
                  <span>{label}</span>
                </label>))}
            </div>
          </div>

          {/* ผู้ออกข้อสอบ */}
          <div>
            <p className="font-display font-bold text-sm text-slate-900 mb-3">ผู้ออกข้อสอบ</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ผู้ออกข้อสอบ</label>
                <input type="text" value={env.examAuthor ?? ''} onChange={(e) => setEnv({ ...env, examAuthor: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#1A4B7A] focus:ring-1 focus:ring-[#1A4B7A] focus:outline-none bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ห้องทำงาน</label>
                <input type="text" value={env.office ?? ''} onChange={(e) => setEnv({ ...env, office: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#1A4B7A] focus:ring-1 focus:ring-[#1A4B7A] focus:outline-none bg-white"/>
              </div>
            </div>
          </div>

          {/* ส่วนที่เขียนด้วยลายมือในห้องสอบ — ไม่มี input ในฟอร์ม */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs">
            <p className="font-semibold text-amber-950 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5"/>
              <span>ส่วนที่เว้นไว้เขียนด้วยลายมือในห้องสอบ</span>
            </p>
            <p className="text-amber-800 mt-1 leading-relaxed">
              จำนวนนักศึกษาที่เข้าสอบ/ขาดสอบ · รายชื่อนักศึกษาที่ขาดสอบ · ผู้คุมสอบและภาระหน้าที่ · หมายเหตุ
              — ในใบปะหน้าที่พิมพ์ออกมาจะเป็นบรรทัดว่างสำหรับเขียนเองที่หน้างาน
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setStep(2)} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
              ย้อนกลับ
            </Button>
            <Button type="button" onClick={goNextToReview} className="">
              <span>ถัดไป: ตรวจสอบและส่ง</span>
            </Button>
          </div>
        </div>)}

      {/* ═══ ขั้นตอนที่ 4: ตรวจสอบและส่ง ═══ */}
      {step === 4 && (<div className="space-y-5">
          <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-7">
            <h3 className="font-display font-bold text-base text-slate-900">ตรวจสอบข้อมูลการสอบ</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">ตรวจสอบความถูกต้องก่อนยืนยันจัดส่ง</p>

            <dl className="space-y-3.5">
              {[
            ['ประเภทการสอบ', examType],
            ['วันที่จัดสอบ', examDate],
            ['เวลาจัดสอบ', examTime],
            ['ห้องสอบ', room],
            ['จำนวนหน้าข้อสอบ', totalPages ? `${totalPages} หน้า` : ''],
            ['จำนวนชุดที่พิมพ์', `${totalCopies} ชุด + สำรอง ${copiesReserve || 0} ชุด`],
            ['สิ่งที่อนุญาตให้นำเข้าห้อง', selectedMaterials.join(', ')],
            ['คำชี้แจงพิเศษ', envelopeNotes || '—'],
        ].map(([label, value]) => (<div key={label} className="flex items-start justify-between gap-4 text-sm">
                  <dt className="text-slate-500 shrink-0">{label}</dt>
                  <dd className="font-semibold text-slate-900 text-right">{value || '—'}</dd>
                </div>))}
            </dl>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                ย้อนกลับ
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <h3 className="font-display font-bold text-base text-slate-900">ไฟล์ข้อสอบ</h3>
            <div className="mt-4 flex items-center space-x-3 bg-slate-50 border border-slate-200 p-3 rounded-lg">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md shrink-0">
                <FileCheck className="w-6 h-6"/>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs text-slate-900 truncate">{fileName}</p>
                <p className="text-xs text-slate-500">ขนาด {fileSize}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleViewExam} title="เปิดดูไฟล์ข้อสอบที่แนบ" className="shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                <Eye className="w-3.5 h-3.5"/>
                <span>ดูข้อสอบ</span>
              </Button>
            </div>

            <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-start space-x-2.5">
                <input type="checkbox" id="security-agree" checked={securityAgreed} onChange={(e) => setSecurityAgreed(e.target.checked)} className="mt-0.5 rounded border-slate-300 text-[#1A4B7A] focus:ring-[#1A4B7A]"/>
                <label htmlFor="security-agree" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
                  ข้าพเจ้ารับรองว่าไฟล์นี้เป็นข้อสอบฉบับจริง และยินยอมให้ระบบบันทึกประวัติการเข้าถึงทุกครั้ง (Audit Log) เพื่อป้องกันข้อสอบรั่วไหล
                </label>
              </div>
            </div>

            <Button type="button" onClick={handleSubmit} disabled={sending || sentSuccess} className="mt-5 w-full ">
              {sending ? (<LoaderCircle className="w-4 h-4 animate-spin"/>) : (<UploadCloud className="w-4 h-4"/>)}
              <span>{sending ? 'กำลังส่งข้อสอบ...' : isReupload ? 'ยืนยันอัปโหลดฉบับใหม่' : 'ยืนยันส่งข้อสอบ'}</span>
            </Button>
            <p className="mt-3 text-xs text-slate-500 text-center">
              ระบบบันทึก Audit Log ทุกครั้ง · แจ้งเตือนเจ้าหน้าที่โสตฯ อัตโนมัติ
            </p>
          </div>
        </div>)}

      {/* ═══ ตัวอย่างใบปะหน้าซองข้อสอบ (แสดงเฉพาะขั้นตอนสุดท้าย — พิมพ์ได้ / ย้อนไปแก้ที่ขั้น 3 ได้) ═══ */}
      {step === 4 && (<div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="no-print px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">ตัวอย่างใบปะหน้าซองข้อสอบ</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ดูอย่างเดียว (พิมพ์ผ่านเมนู ⋮ "ใบปะหน้าซอง") · แก้ได้ที่ขั้นตอน "ใบปะหน้าซอง" · ส่วนเข้าสอบ/ขาดสอบ/ผู้คุมสอบ/หมายเหตุ เว้นไว้เขียนด้วยลายมือที่หน้างานจริง
              </p>
            </div>
          </div>
          {/* ตัวอย่างเอกสาร — จอแคบเลื่อนดูแนวนอนได้ ไม่ถูกตัดขอบ */}
          <div className="overflow-x-auto px-2 sm:px-4 pb-4">
            <div className="min-w-[640px]">
              <EnvelopeDocument form={{ ...env, envelopeNo: examSet }}/>
            </div>
          </div>
        </div>)}

      {/* Overlay ส่งสำเร็จ */}
      {sentSuccess && (<div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center space-y-4 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-popCheck"/>
          </div>
          <p className="font-display text-lg font-bold text-slate-900">ส่งข้อสอบสำเร็จ!</p>
          <p className="text-xs text-slate-500">ระบบได้ส่งข้อสอบถึงหน่วยโสตทัศน์เพื่อตรวจสอบแล้ว</p>
        </div>)}
    </div>);
};
export const TeacherView = ({ currentUser, courses, exams, notifications = [], onMarkNotificationRead, page = 'courses', onNavigate, selectedCourseId, onSelectCourse, selectedExamNo, onSelectExam, uploadContext = null, onUploadSubmit, onOpenUpload, onPreviewExam, onRemoveExam, onAddNewCourse, onOpenEnvelope, onDownloadLogged, onEnvelopePrintRecorded, }) => {
    const [newCourseCode, setNewCourseCode] = useState('');
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseTerm, setNewCourseTerm] = useState('1');
    const [newCourseYear, setNewCourseYear] = useState('2567');
    const [newCourseStudents, setNewCourseStudents] = useState(45);
    const [newCourseCredits, setNewCourseCredits] = useState(3);
    const [newCourseSec, setNewCourseSec] = useState('01');
    const [newCourseError, setNewCourseError] = useState('');
    const [rowMenuId, setRowMenuId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    // Filter courses for this teacher or all if academic affairs
    const myCourses = courses.filter((c) => c.teacher_id === currentUser.id || currentUser.id === 'T001');
    // ข้อสอบทุกชุดของรายวิชา (1 วิชาส่งได้หลายชุด เช่น A, B, C)
    const getExamsForCourse = (courseId) => exams.filter((e) => e.Subject_ID === courseId);
    const myExams = exams.filter((e) => myCourses.some((c) => c.Course_id === e.Subject_ID));
    const countByStatus = (statuses) => myExams.filter((e) => statuses.includes(e.status)).length;
    const rejectedExams = myExams.filter((e) => e.status === 'REJECTED');
    // รายวิชาที่ยังไม่ได้จัดส่งข้อสอบ — ใช้โชว์แถบเตือนด้านบน
    const unsubmittedCourses = myCourses.filter((c) => getExamsForCourse(c.Course_id).length === 0);
    const term = myCourses[0]?.term || '1';
    const year = myCourses[0]?.Course_year || String(new Date().getFullYear() + 543);
    // รายวิชา + ชุดข้อสอบที่เลือกไว้ (สำหรับหน้า tracking / cancel)
    const selectedCourse = myCourses.find((c) => c.Course_id === selectedCourseId) || null;
    const selectedExams = selectedCourse ? getExamsForCourse(selectedCourse.Course_id) : [];
    const selectedExam = selectedExams.find((e) => e.E_No === selectedExamNo)
        || selectedExams[0] || null;
    // เปิดหน้าติดตามสถานะของรายวิชา
    const openTracking = (courseId) => {
        onSelectCourse?.(courseId);
        setCancelReason('');
        onNavigate?.('tracking');
    };
    const handleCreateCourse = (e) => {
        e.preventDefault();
        if (!newCourseCode || !newCourseName)
            return;
        const courseId = newCourseCode.trim().toUpperCase();
        if (courses.some((c) => c.Course_id === courseId)) {
            setNewCourseError(`มีรหัสวิชา ${courseId} อยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
            return;
        }
        const newCourse = {
            Course_id: courseId,
            Course_Name: newCourseName.trim(),
            Course_year: newCourseYear,
            term: newCourseTerm,
            sec: newCourseSec.trim() || '01',
            credits: newCourseCredits,
            student_count: Number(newCourseStudents) || 30,
            teacher_id: currentUser.id,
            teacher_name: currentUser.name,
        };
        onAddNewCourse(newCourse);
        onNavigate?.('courses');
        setNewCourseCode('');
        setNewCourseName('');
        setNewCourseError('');
    };
    const steps = [
        { title: 'ส่งข้อสอบ', desc: 'อัปโหลดไฟล์ข้อสอบเรียบร้อยแล้ว' },
        { title: 'โสตฯ ตรวจสอบ', desc: 'เจ้าหน้าที่ตรวจสอบความสมบูรณ์' },
        { title: 'จัดพิมพ์', desc: 'อยู่ระหว่างดำเนินการจัดพิมพ์' },
        { title: 'ส่งมอบฝ่ายจัดสอบ', desc: 'รอการดำเนินการ' },
        { title: 'พร้อมสอบ', desc: 'รอส่งมอบข้อสอบ' },
    ];
    const getStepProgress = (status) => {
        switch (status) {
            case 'SUBMITTED':
                return 1;
            case 'VERIFIED':
                return 2;
            case 'PRINTING':
                return 3;
            case 'PRINTED':
                return 4;
            case 'DELIVERED_OD':
            case 'READY_FOR_EXAM':
                return 5;
            default:
                return 0;
        }
    };
    // ───────── หน้า 1: ตารางรายวิชา ─────────
    const renderCoursesPage = () => (<>
      {/* Hero */}
      <div>        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
          รายวิชาของคุณครู
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          สวัสดี {currentUser.name} — ดูภาพรวมสถานะข้อสอบ และจัดส่ง / ติดตามข้อสอบในแต่ละรายวิชาได้จากหน้านี้
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
            { label: 'รายวิชาของฉัน', value: myCourses.length },
            { label: 'รอตรวจสอบ', value: countByStatus(['SUBMITTED']) },
            { label: 'กำลังจัดพิมพ์', value: countByStatus(['PRINTING', 'PRINTED', 'DELIVERED_OD']) },
            { label: 'พร้อมสอบ', value: countByStatus(['READY_FOR_EXAM']) },
        ].map((stat) => (<div key={stat.label} className="rounded-2xl bg-white border border-slate-200/80 px-5 py-4">
              <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>))}
      </div>

      {/* Alert banner — ไฟล์ไม่ได้รับอนุมัติ (REJECTED) */}
      {rejectedExams.length > 0 && (<div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-950">
                มี {rejectedExams.length} รายการที่ไฟล์ไม่ได้รับอนุมัติ
              </p>
              <p className="text-xs text-amber-800 mt-0.5 truncate">
                {rejectedExams.map((e) => `${e.Subject_ID} ชุด ${e.exam_set || 'A'}`).join(', ')} — {rejectedExams[0].rejection_reason || 'กรุณาอัปโหลดไฟล์ฉบับใหม่'}
              </p>
            </div>
            <Button onClick={() => {
                const course = myCourses.find((c) => c.Course_id === rejectedExams[0].Subject_ID);
                if (course)
                    onOpenUpload(course, rejectedExams[0], true);
            }} className="shrink-0 ">
              ส่งฉบับใหม่
            </Button>
          </div>)}

      {/* Alert banner — รายวิชาที่ยังไม่ได้จัดส่งข้อสอบ */}
      {unsubmittedCourses.length > 0 && (<div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-950">
                มี {unsubmittedCourses.length} รายวิชาที่ยังไม่ได้จัดส่งข้อสอบ
              </p>
              <p className="text-xs text-amber-800 mt-0.5 truncate">
                {unsubmittedCourses[0].Course_id} · {unsubmittedCourses[0].Course_Name} — กรุณาจัดส่งไฟล์ก่อนวันสอบ
              </p>
            </div>
            <Button onClick={() => onOpenUpload(unsubmittedCourses[0], null, false)} className="shrink-0 ">
              จัดส่งข้อสอบ
            </Button>
          </div>)}

      {/* พื้นหลังดักคลิก — ปิดเมนู ⋮ เมื่อคลิกที่อื่นนอกเมนู */}
      {rowMenuId && (<div className="fixed inset-0 z-[44]" onClick={() => setRowMenuId(null)} aria-hidden="true"/>)}

      {/* รายวิชาในภาคเรียนนี้ */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <h3 className="font-display font-bold text-base text-slate-900">รายวิชาในภาคเรียนนี้</h3>
          <Button variant="outline" size="sm" onClick={() => onNavigate?.('new-course')}>
            <Plus className="w-4 h-4"/>
            <span>เพิ่มรายวิชา</span>
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          {myCourses.length === 0 ? (<div className="p-10 text-center text-slate-500 text-xs">
              ไม่พบรายวิชาในบัญชีของท่าน
            </div>) : (myCourses.map((course) => {
            const courseExams = getExamsForCourse(course.Course_id);
            return (<div key={course.Course_id} className="px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  {/* หัวกลุ่มรายวิชา */}
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-slate-900">{course.Course_id}</span>
                        <span className="font-bold text-sm text-slate-900">{course.Course_Name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Sem {course.term} · Sec {course.sec} · {course.student_count} คน
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onOpenUpload(course, null, false)} className="shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                      <Plus className="w-3.5 h-3.5"/>
                      <span>{courseExams.length === 0 ? 'จัดส่งข้อสอบ' : 'จัดส่งชุดเพิ่ม'}</span>
                    </Button>
                  </div>

                  {/* แถวข้อสอบแต่ละชุด */}
                  {courseExams.length === 0 ? (<div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0"/>
                        <span>ยังไม่ส่งข้อสอบ</span>
                      </p>
                      <Button size="sm" onClick={() => onOpenUpload(course, null, false)} className="shrink-0">
                        <Upload className="w-3.5 h-3.5"/>
                        <span>จัดส่งข้อสอบ</span>
                      </Button>
                    </div>) : (courseExams.map((exam) => {
                  const statusConfig = STATUS_LABELS[exam.status] || NO_EXAM_STATUS;
                  const setLabel = exam.exam_set || 'A';
                  const isCancelable = CANCELABLE_STATUSES.includes(exam.status);
                  return (<div key={exam.E_No} id={'exam-row-' + exam.E_No} className="mt-3 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center rounded-md bg-[#1A4B7A]/10 text-[#1A4B7A] border border-[#1A4B7A]/20 px-2 py-0.5 text-xs font-bold">
                                ชุด {setLabel}
                              </span>
                              <h4 className="font-display text-sm font-bold text-slate-900">{exam.Subject_Name}</h4>
                              <Badge className={statusConfig.badgeClass}>{statusConfig.label}</Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 md:justify-end shrink-0">
                            <Button variant="outline" size="sm" onClick={() => openTracking(course.Course_id)} title="ติดตามสถานะข้อสอบของรายวิชานี้" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                              <Eye className="w-4 h-4 text-[#1A4B7A]"/>
                              <span>ดูรายละเอียด</span>
                            </Button>

                            {/* เมนูจัดการเพิ่มเติม */}
                            <div className="relative">
                              <button onClick={() => setRowMenuId(rowMenuId === exam.E_No ? null : exam.E_No)} aria-label="จัดการเพิ่มเติม" aria-expanded={rowMenuId === exam.E_No} aria-haspopup="true" className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 transition-colors">
                                <MoreVertical className="w-4 h-4"/>
                              </button>
                              {rowMenuId === exam.E_No && (<div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-[45] p-1.5">
                                  <button onClick={() => { setRowMenuId(null); onOpenEnvelope(exam); }} className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-100 flex items-center space-x-2">
                                    <Printer className="w-3.5 h-3.5"/>
                                    <span>ใบปะหน้าซอง</span>
                                  </button>
                                  {EDITABLE_STATUSES.includes(exam.status) && (<button onClick={() => { setRowMenuId(null); onOpenUpload(course, exam, true); }} className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-100 flex items-center space-x-2">
                                      <RefreshCw className="w-3.5 h-3.5"/>
                                      <span>อัปโหลดไฟล์ใหม่</span>
                                    </button>)}
                                  {isCancelable && (<button onClick={() => { setRowMenuId(null); onSelectCourse(course.Course_id); onSelectExam?.(exam.E_No); setCancelReason(''); onNavigate?.('cancel'); }} className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2">
                                      <Trash2 className="w-3.5 h-3.5"/>
                                      <span>ยกเลิกการส่ง</span>
                                    </button>)}
                                </div>)}
                            </div>
                          </div>
                        </div>

                        {/* แจ้งเหตุผลกรณีถูกส่งกลับแก้ไข */}
                        {exam.status === 'REJECTED' && exam.rejection_reason && (<div className="mt-3 text-xs text-rose-800 bg-rose-50 px-3 py-2.5 rounded-lg border border-rose-200 flex items-start space-x-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5"/>
                            <span>
                              <strong>ถูกส่งกลับแก้ไข:</strong> {exam.rejection_reason} — เปิดเมนู ⋮ เพื่ออัปโหลดไฟล์ใหม่
                            </span>
                          </div>)}
                      </div>);
                }))}
                </div>);
        }))}
        </div>
      </div>

    </>);
    // ───────── หน้า 2: ติดตามสถานะข้อสอบ ─────────
    const renderTrackingPage = () => {
        // ยังไม่ได้เลือกรายวิชา — แสดงรายการให้เลือก
        if (!selectedCourse) {
            return (<div>
            <div>              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
                ติดตามสถานะข้อสอบ
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                เลือกรายวิชาที่ต้องการติดตามสถานะข้อสอบ
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {myCourses.length === 0 ? (<div className="p-10 text-center text-slate-500 text-xs">ไม่พบรายวิชาในบัญชีของท่าน</div>) : (myCourses.flatMap((course) => {
                    const courseExams = getExamsForCourse(course.Course_id);
                    if (courseExams.length === 0) {
                        return [(<div key={course.Course_id + '-none'} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900">
                                {course.Course_id} · {course.Course_Name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">กลุ่มเรียน {course.sec} · ยังไม่ส่งข้อสอบ</p>
                            </div>
                            <Button size="sm" onClick={() => onOpenUpload(course, null, false)} className="shrink-0">
                              <Upload className="w-3.5 h-3.5"/>
                              <span>จัดส่งข้อสอบ</span>
                            </Button>
                          </div>)];
                    }
                    return courseExams.map((exam) => {
                        const statusConfig = STATUS_LABELS[exam.status] || NO_EXAM_STATUS;
                        return (<div key={exam.E_No} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center rounded-md bg-[#1A4B7A]/10 text-[#1A4B7A] border border-[#1A4B7A]/20 px-2 py-0.5 text-xs font-bold">
                                  ชุด {exam.exam_set || 'A'}
                                </span>
                                {course.Course_id} · {course.Course_Name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">กลุ่มเรียน {course.sec}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <Badge className={statusConfig.badgeClass}>{statusConfig.label}</Badge>
                              <Button size="sm" variant="outline" onClick={() => openTracking(course.Course_id)}>
                                ดูสถานะ
                              </Button>
                            </div>
                          </div>);
                    });
                }))}
              </div>
            </div>
          </div>);
        }
        return (<>
        {/* Hero */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            ติดตามสถานะข้อสอบ
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {selectedCourse.Course_id} · {selectedCourse.Course_Name} / กลุ่มเรียน {selectedCourse.sec}
          </p>
        </div>

        {selectedExams.length === 0 ? (<div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-10 text-center">
            <p className="text-sm text-slate-500">ยังไม่ได้จัดส่งไฟล์ข้อสอบสำหรับรายวิชานี้</p>
            <Button onClick={() => onOpenUpload(selectedCourse, null, false)} className="mt-3 ">
              <Upload className="w-4 h-4"/>
              <span>จัดส่งข้อสอบ</span>
            </Button>
          </div>) : (selectedExams.map((exam, examIdx) => {
          const statusConfig = STATUS_LABELS[exam.status] || NO_EXAM_STATUS;
          const progress = getStepProgress(exam?.status);
          const setLabel = exam.exam_set || 'A';
          const isEditable = EDITABLE_STATUSES.includes(exam.status);
          const isCancelable = CANCELABLE_STATUSES.includes(exam.status);
          // ประวัติการดำเนินงาน — สร้างจากข้อมูลที่มีในระบบ
          const historyEntries = exam ? [
              { date: exam.upload_date, label: 'จัดส่งไฟล์ข้อสอบเข้าระบบ' },
              ...(exam.verified_date ? [{ date: exam.verified_date, label: `ผ่านการตรวจสอบโดย ${exam.checked_by || 'เจ้าหน้าที่'}` }] : []),
              ...(exam.print_date ? [{ date: exam.print_date, label: 'พิมพ์และบรรจุซองเสร็จสิ้น' }] : []),
          ].filter((h) => h.date) : [];
          return (<div key={exam.E_No} className="space-y-5">
          {/* ป้ายชุดข้อสอบ */}
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center rounded-md bg-[#1A4B7A]/10 text-[#1A4B7A] border border-[#1A4B7A]/20 px-2.5 py-1 text-sm font-bold">
              ชุด {setLabel}
            </span>
            <Badge className={statusConfig.badgeClass}>{statusConfig.label}</Badge>
          </div>

          {/* Banner สถานะปัจจุบัน */}
          <div className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${exam.status === 'REJECTED'
                ? 'border-rose-200 bg-rose-50'
                : 'border-emerald-200 bg-emerald-50'}`}>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${exam.status === 'REJECTED' ? 'text-rose-900' : 'text-emerald-900'}`}>
                {STATUS_HEADLINE[exam.status] || statusConfig.label}
              </p>
              <p className={`text-xs mt-0.5 ${exam.status === 'REJECTED' ? 'text-rose-800' : 'text-emerald-800/80'}`}>
                สอบ {formatThaiDate(exam.E_Date)} เวลา {exam.E_Time} · เลขที่ข้อสอบ {exam.E_No}
              </p>
            </div>
            {examIdx === 0 && (<Button variant="outline" onClick={() => { onSelectCourse?.(null); onNavigate?.('tracking'); }} className="shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
              กลับรายวิชา
            </Button>)}
          </div>

          {/* สองคอลัมน์: ความคืบหน้า + รายละเอียด */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* ความคืบหน้าข้อสอบ — vertical stepper */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
              <h3 className="font-display font-bold text-base text-slate-900">ความคืบหน้าข้อสอบ</h3>
              <ol className="mt-5">
                {steps.map((st, i) => {
                const stepNo = i + 1;
                const done = progress >= stepNo;
                const isNext = progress + 1 === stepNo;
                return (<li key={st.title} className="relative flex gap-3.5 pb-6 last:pb-0">
                      {/* เส้นเชื่อม */}
                      {i < steps.length - 1 && (<span className="absolute left-3.5 top-8 bottom-0 w-px bg-slate-200" aria-hidden="true"/>)}
                      <span className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done
                        ? 'bg-emerald-500 text-white'
                        : isNext
                            ? 'border-2 border-[#1A4B7A] text-[#1A4B7A] bg-white'
                            : 'bg-slate-100 text-slate-500'}`}>
                        {done ? (<Check className="w-4 h-4"/>) : (stepNo)}
                      </span>
                      <div className="pt-0.5">
                        <p className={`text-sm font-bold ${done || isNext ? 'text-slate-900' : 'text-slate-500'}`}>
                          {st.title}
                        </p>
                        <p className={`text-xs mt-0.5 ${done || isNext ? 'text-slate-500' : 'text-slate-300'}`}>
                          {st.desc}
                        </p>
                      </div>
                    </li>);
            })}
              </ol>

              {exam.status === 'REJECTED' && exam.rejection_reason && (<div className="mt-4 text-xs text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-200 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"/>
                  <span>
                    <strong>ถูกส่งกลับแก้ไข:</strong> {exam.rejection_reason}
                  </span>
                </div>)}

              {/* ประวัติการดำเนินงาน */}
              {historyEntries.length > 0 && (<div className="mt-6 pt-5 border-t border-slate-100">
                  <h4 className="font-display text-sm font-bold text-slate-900">ประวัติการดำเนินงาน</h4>
                  <div className="mt-3 space-y-2">
                    {historyEntries.map((h, i) => (<div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-slate-500 shrink-0 w-24">{h.date}</span>
                        <span className="text-slate-600">{h.label}</span>
                      </div>))}
                  </div>
                </div>)}
            </div>

            {/* รายละเอียดการสอบ */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
              <h3 className="font-display font-bold text-base text-slate-900">รายละเอียดการสอบ</h3>

              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="text-xs text-slate-500">วันและเวลาสอบ</dt>
                  <dd className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatThaiDate(exam.E_Date)} · {exam.E_Time}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">ห้องสอบ</dt>
                  <dd className="text-sm font-bold text-slate-900 mt-0.5">{exam.room}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">จำนวนนักศึกษา</dt>
                  <dd className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedCourse.student_count} คน · จำนวนพิมพ์ {exam.total_copies + exam.copies_reserve} ชุด
                  </dd>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <dt className="text-xs text-slate-500">ไฟล์ข้อสอบ</dt>
                  <dd className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0"/>
                    <span className="truncate">{exam.file_name}</span>
                  </dd>
                </div>
              </dl>

              <div className="mt-6 space-y-2.5">
                <Button variant="outline" onClick={() => onDownloadLogged?.(exam)} className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                  <Download className="w-4 h-4"/>
                  <span>ดาวน์โหลด</span>
                </Button>

                {isEditable && (<Button variant="outline" onClick={() => onOpenUpload(selectedCourse, exam, true)} className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                    <RefreshCw className="w-4 h-4"/>
                    <span>แก้ไขการส่งข้อสอบ</span>
                  </Button>)}

                {isCancelable && (<Button variant="outline" onClick={() => { setCancelReason(''); onSelectExam?.(exam.E_No); onNavigate?.('cancel'); }} className="w-full border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                  <Trash2 className="w-4 h-4"/>
                  <span>ยกเลิกการส่งข้อสอบ</span>
                </Button>)}
              </div>

              <p className="mt-4 text-xs text-slate-500">
                การอัปโหลดใหม่จะบันทึกในประวัติการตรวจสอบ
              </p>
            </div>
          </div>

          {/* ทั้งแก้ไขและยกเลิกไม่ได้ — แจ้งทางออก */}
          {!isEditable && !isCancelable && (<div className="rounded-2xl bg-slate-100 border border-slate-200 px-5 py-3 text-xs text-slate-600">
              ชุดนี้อยู่ระหว่างจัดพิมพ์หรือส่งมอบแล้ว — หากต้องการเปลี่ยนแปลง กรุณาติดต่อเจ้าหน้าที่หน่วยโสตทัศน์
            </div>)}
        </div>);
        }))}
      </>);
    };
    // ───────── หน้า 3: เพิ่มรายวิชา ─────────
    const renderNewCoursePage = () => (<>
      {/* Hero */}
      <div>        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
          เพิ่มรายวิชา
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          แต่งรายวิชาใหม่เข้าสู่ระบบ เพื่อเริ่มจัดส่งข้อสอบ
        </p>
      </div>

      {/* สองคอลัมน์: ฟอร์ม + คำแนะนำ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* ฟอร์มข้อมูลรายวิชา */}
        <form onSubmit={handleCreateCourse} className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
          <h3 className="font-display font-bold text-base text-slate-900">ข้อมูลรายวิชา</h3>

          {newCourseError && (<div className="bg-rose-50 border border-rose-300 text-rose-800 px-3 py-2 rounded-lg flex items-center space-x-1.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600"/>
              <span>{newCourseError}</span>
            </div>)}

          <div>
            <Label htmlFor="new-course-id" className="text-slate-700 mb-1.5 block">
              รหัสวิชา <span className="text-rose-500">*</span>
            </Label>
            <Input id="new-course-id" type="text" placeholder="เช่น CS 5555" value={newCourseCode} onChange={(e) => {
            setNewCourseCode(e.target.value);
            setNewCourseError('');
        }} required className="uppercase"/>
          </div>

          <div>
            <Label htmlFor="new-course-name" className="text-slate-700 mb-1.5 block">
              ชื่อรายวิชา <span className="text-rose-500">*</span>
            </Label>
            <Input id="new-course-name" type="text" placeholder="เช่น โครงสร้างข้อมูล" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} required/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-course-sec" className="text-slate-700 mb-1.5 block">
                กลุ่มเรียน (Sec) <span className="text-rose-500">*</span>
              </Label>
              <Input id="new-course-sec" type="text" placeholder="01" value={newCourseSec} onChange={(e) => setNewCourseSec(e.target.value)} required/>
            </div>
            <div>
              <Label htmlFor="new-course-students" className="text-slate-700 mb-1.5 block">
                จำนวนนักศึกษา <span className="text-rose-500">*</span>
              </Label>
              <Input id="new-course-students" type="number" min="1" placeholder="45" value={newCourseStudents} onChange={(e) => setNewCourseStudents(parseInt(e.target.value) || 1)} required/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-course-credits" className="text-slate-700 mb-1.5 block">
                หน่วยกิต <span className="text-rose-500">*</span>
              </Label>
              <Input id="new-course-credits" type="number" min="0" placeholder="3" value={newCourseCredits} onChange={(e) => setNewCourseCredits(parseInt(e.target.value) || 0)} required/>
            </div>
            <div>
              <Label className="text-slate-700 mb-1.5 block">
                ภาคเรียน · ปีการศึกษา <span className="text-rose-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Select value={newCourseTerm} onChange={(e) => setNewCourseTerm(e.target.value)} aria-label="ภาคเรียน" className="flex-1">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">ฤดูร้อน</option>
                </Select>
                <span className="text-slate-500">/</span>
                <Input type="text" value={newCourseYear} onChange={(e) => setNewCourseYear(e.target.value)} aria-label="ปีการศึกษา" className="flex-1"/>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => onNavigate?.('courses')} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
              ยกเลิก
            </Button>
            <Button type="submit" className="">
              <Plus className="w-4 h-4"/>
              <span>เพิ่มรายวิชาเข้าสู่ระบบ</span>
            </Button>
          </div>
        </form>

        {/* คำแนะนำก่อนเริ่ม */}
        <aside className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h3 className="font-display font-bold text-base text-slate-900">เตรียมก่อนเริ่ม</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            ตรวจสอบว่าข้อมูลรายวิชาถูกต้องก่อนเพิ่มเข้าสู่ระบบ เพื่อให้ข้อสอบออกถูกต้องตั้งแต่ต้น
          </p>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-sm font-bold text-[#1A4B7A]">หลังเพิ่มรายวิชา</p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              สามารถจัดส่งข้อสอบ ตั้งค่าข้อสอบต่าง ๆ และแก้ไขไฟล์ได้ในภายหลัง
            </p>
          </div>
        </aside>
      </div>
    </>);
    // ───────── หน้า 5: การแจ้งปัญหาจากทุก role ─────────
    const renderIssuesPage = () => {
        // รายงานปัญหามาพร้อม notification ที่ title ขึ้นต้นด้วย "แจ้งปัญหา:" (จาก /api/issues)
        const issueReports = notifications.filter((n) => n.title && n.title.startsWith('แจ้งปัญหา:'));
        const unreadIssues = issueReports.filter((n) => !n.isRead).length;
        return (<>
      {/* Hero */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            การแจ้งปัญหา
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            รวมปัญหาการใช้งานที่ผู้ใช้ทุก role แจ้งเข้ามา — ตรวจสอบและติดตามการแก้ไข
          </p>
        </div>
        {unreadIssues > 0 && (<Badge className="bg-amber-50 text-amber-800 border-amber-300 shrink-0">
            ใหม่ {unreadIssues} รายการ
          </Badge>)}
      </div>

      <div className="space-y-3">
        {issueReports.length === 0 ? (<div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
            <p className="text-sm text-slate-500">ยังไม่มีรายงานปัญหาเข้ามา</p>
            <p className="text-xs text-slate-500 mt-1">
              เมื่อผู้ใช้กด "แจ้งปัญหา" จากเมนูของตัวเอง รายงานจะแสดงที่นี่
            </p>
          </div>) : (issueReports.map((notif) => (<div key={notif.id} onClick={() => !notif.isRead && onMarkNotificationRead?.(notif.id)} className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 cursor-pointer transition-colors ${!notif.isRead
                ? 'bg-white border-[#1A4B7A]/30 shadow-sm'
                : 'bg-white/70 border-slate-200'}`}>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-slate-900 truncate">{notif.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500 whitespace-nowrap">{notif.timestamp}</span>
                {!notif.isRead && (<span className="w-2 h-2 rounded-full bg-[#1A4B7A] shrink-0" aria-label="ยังไม่ได้อ่าน"/>)}
              </div>
            </div>)))}
      </div>

      {issueReports.length > 0 && (<p className="text-xs text-slate-400">
          กดที่รายการเพื่อทำเครื่องหมายว่าอ่านแล้ว · ปัญหาทุกรายการถูกส่งถึงผู้ดูแลระบบพร้อมบันทึก Audit Log
        </p>)}
    </>);
    };
    // ───────── หน้า 4: ยืนยันการยกเลิก ─────────
    const renderCancelPage = () => {
        if (!selectedCourse) {
            onNavigate?.('courses');
            return null;
        }
        // ยกเลิกได้ถึงก่อนเริ่มจัดพิมพ์เท่านั้น
        const isCancelable = selectedExam && CANCELABLE_STATUSES.includes(selectedExam.status);
        const setLabel = selectedExam ? (selectedExam.exam_set || 'A') : '';
        return (<div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            ยืนยันการยกเลิก
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            ตรวจสอบรายการก่อนดำเนินการยกเลิกข้อสอบ
          </p>
        </div>

        {selectedExam && !isCancelable ? (<div className="mt-6 rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8 max-w-2xl">
            <span className="inline-block text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1">
              ยกเลิกไม่ได้
            </span>
            <h2 className="font-display text-xl font-bold text-slate-900 mt-3">
              ชุด {setLabel} อยู่ระหว่างจัดพิมพ์หรือส่งมอบแล้ว
            </h2>
            <p className="text-sm text-slate-600 mt-1.5">
              {selectedCourse.Course_id} · {selectedCourse.Course_Name} / กลุ่มเรียน {selectedCourse.sec}
            </p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              เมื่อข้อสอบเริ่มเข้าสู่ขั้นตอนจัดพิมพ์แล้ว อาจารย์ไม่สามารถยกเลิกได้ — กรุณาติดต่อเจ้าหน้าที่หน่วยโสตทัศน์เพื่อดำเนินการ
            </p>
            <Button variant="outline" onClick={() => onNavigate?.('tracking')} className="mt-5 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
              ย้อนกลับ
            </Button>
          </div>) : (<>
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8 max-w-2xl">
          <span className="inline-block text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-1">
            ต้องการแก้ไขไฟล์หรือ?
          </span>
          <h2 className="font-display text-xl font-bold text-slate-900 mt-3">
            ยกเลิกการส่งข้อสอบชุด {setLabel}?
          </h2>
          <p className="text-sm text-slate-600 mt-1.5">
            {selectedCourse.Course_id} · {selectedCourse.Course_Name} / กลุ่มเรียน {selectedCourse.sec}
          </p>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            แค่ต้องการแก้ไฟล์? — ไม่ต้องยกเลิก ใช้ "แก้ไขการส่งข้อสอบ" อัปโหลดฉบับใหม่ทับได้เลย
          </p>
          {selectedExam && (<Button variant="outline" size="sm" onClick={() => onOpenUpload(selectedCourse, selectedExam, true)} className="mt-2 border-[#1A4B7A]/30 bg-white text-[#1A4B7A] hover:bg-[#1A4B7A]/5">
              <FileText className="w-3.5 h-3.5"/>
              <span>ไม่ยกเลิก — อัปโหลดไฟล์ใหม่แทน</span>
            </Button>)}
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            หากยืนยันยกเลิก: รายการข้อสอบชุดนี้และไฟล์แนบจะถูกลบออกจากระบบทันที และต้องจัดส่งใหม่ทั้งหมดในภายหลัง (ชุดอื่นของรายวิชาเดียวกันไม่กระทบ)
          </p>

          <div className="mt-6">
            <Label htmlFor="cancel-reason" className="text-slate-700 mb-1.5 block">
              เหตุผลการยกเลิก <span className="text-rose-500">*</span>
            </Label>
            <textarea id="cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} placeholder="อธิบายเหตุผลการยกเลิกข้อสอบ" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A4B7A] focus-visible:border-[#1A4B7A]"/>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs">
            <p className="font-bold text-amber-950 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5"/>
              <span>การยืนยันมีผลทันที</span>
            </p>
            <p className="text-amber-800 mt-0.5">
              ระบบจะลบไฟล์แนบและบันทึกประวัติ Audit Log ของการยกเลิกนี้โดยอัตโนมัติ
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Button variant="outline" onClick={() => onNavigate?.('tracking')} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
              ย้อนกลับ
            </Button>
            <Button variant="destructive" onClick={() => {
            if (selectedExam) {
                onRemoveExam(selectedExam.E_No);
            }
            setCancelReason('');
            onNavigate?.('courses');
        }} disabled={!cancelReason.trim()} title={cancelReason.trim() ? 'ยืนยันการยกเลิกการส่งข้อสอบ' : 'กรุณาระบุเหตุผลการยกเลิกก่อน'}>
            <Trash2 className="w-4 h-4"/>
            <span>ยืนยันการยกเลิก</span>
          </Button>
          </div>
        </div>
        </>)}
      </div>);
    };
    // ───────── หน้า 5: แนบไฟล์ข้อสอบ (wizard 4 ขั้น: ไฟล์ → ข้อมูลการสอบ → ใบปะหน้าซอง → ตรวจสอบและส่ง) ─────────
    const renderUploadPage = () => {
        if (!uploadContext?.course) {
            onNavigate?.('courses');
            return null;
        }
        // ชุดใหม่ — ดึงข้อมูลการสอบจากชุดล่าสุดของวิชาเดียวกันมาเติมให้ ไม่ต้องกรอกซ้ำ
        const courseExamList = exams.filter((e) => e.Subject_ID === uploadContext.course.Course_id && e.E_No !== uploadContext.existingExam?.E_No);
        const prefillExam = courseExamList[courseExamList.length - 1] || null;
        return (<ExamUploadWizard key={`${uploadContext.course.Course_id}-${uploadContext.existingExam?.E_No ?? 'new'}-${uploadContext.isReupload}`} course={uploadContext.course} existingExam={uploadContext.existingExam} isReupload={uploadContext.isReupload} usedSets={courseExamList.map((e) => e.exam_set || 'A')} prefillExam={prefillExam} onDone={() => onNavigate?.('courses')} onUploadSubmit={onUploadSubmit} onPreviewExam={onPreviewExam} onEnvelopePrintRecorded={onEnvelopePrintRecorded}/>);
    };
    return (<div className="max-w-6xl mx-auto space-y-6">
      {/* แถบบน: ภาคเรียน/ปี (ชื่อระบบอยู่ที่แถบบนของ SidebarShell แล้ว) */}
      <div className="flex items-center justify-end">
        <div className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shrink-0">
          ภาคเรียน {term} / {year}
        </div>
      </div>

      {page === 'tracking' ? renderTrackingPage() : page === 'cancel' ? renderCancelPage() : page === 'new-course' ? renderNewCoursePage() : page === 'upload' ? renderUploadPage() : page === 'issues' ? renderIssuesPage() : renderCoursesPage()}
    </div>);
};
