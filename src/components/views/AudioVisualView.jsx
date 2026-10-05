/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: AudioVisualView.jsx
 * หน้าที่ของหน้านี้: หน้างานฝ่ายโสตทัศน์ 2 หน้าย่อย (แสดงภายใน SidebarShell) —
 *   1. queue     : คิวตรวจสอบและผลิตข้อสอบ — สถิติ, ค้นหา/กรอง, รายการข้อสอบ
 *                  พร้อมปุ่มดำเนินการตามสถานะ (อนุมัติ / ส่งกลับ / เริ่มพิมพ์ /
 *                  พิมพ์เสร็จ / ส่งมอบ) และปุ่มตรวจข้อสอบ / พิมพ์ซอง / พิมพ์ข้อสอบจริง
 *   2. directory : รายวิชาและอาจารย์ผู้ประสานงาน — ตารางติดต่อ + สถานะ
 * ผู้ใช้งาน: เจ้าหน้าที่หน่วยโสตทัศน์ (AudioVisual)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { STATUS_LABELS, NO_EXAM_STATUS, STATUS_FILTER_OPTIONS } from '@/lib/statusLabels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Printer, CheckCircle, Eye, AlertTriangle, Search, Send, CheckCheck, RotateCcw, User, Phone, X, FileText, MoveHorizontal, } from 'lucide-react';
import { formatThaiDate } from '@/lib/formatDate';
import { useEscape } from '@/hooks/useEscape';
export const AudioVisualView = ({ currentUser, courses = [], exams, page = 'queue', onNavigate, onPreviewExam, onOpenEnvelope, onUpdateExamStatus, onPrintExam, }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    // หน้ารายวิชาใช้ชุดค้นหาแยกต่างหาก — ไม่ให้ฟิลเตอร์ของคิวติดไปหน้ารายวิชา
    const [directorySearch, setDirectorySearch] = useState('');
    const [directoryStatusFilter, setDirectoryStatusFilter] = useState('ALL');
    const [selectedCourseId, setSelectedCourseId] = useState('ALL');
    const [rejectingExam, setRejectingExam] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const subjectList = (courses.length > 0 ? courses : []).map((c) => {
        const courseExams = exams.filter((e) => e.Subject_ID === c.Course_id);
        const matchedExam = courseExams[0];
        return {
            courseId: c.Course_id,
            courseName: c.Course_Name,
            teacherName: matchedExam ? matchedExam.teacher_name : c.teacher_name,
            teacherTel: matchedExam?.teacher_tel || '',
            sec: c.sec,
            studentCount: c.student_count,
            exam: matchedExam,
            exams: courseExams, // ทุกชุดของรายวิชานี้
        };
    });
    // Add any exams not in the courses prop
    exams.forEach((e) => {
        if (!subjectList.some((s) => s.courseId === e.Subject_ID)) {
            subjectList.push({
                courseId: e.Subject_ID,
                courseName: e.Subject_Name,
                teacherName: e.teacher_name,
                teacherTel: e.teacher_tel,
                sec: '01',
                studentCount: e.total_copies,
                exam: e,
                exams: [e],
            });
        }
    });
    // Filter subjects for the Directory Page
    const filteredSubjects = subjectList.filter((item) => {
        const matchesSearch = item.courseId.toLowerCase().includes(directorySearch.toLowerCase()) ||
            item.courseName.toLowerCase().includes(directorySearch.toLowerCase()) ||
            (item.teacherName || '').toLowerCase().includes(directorySearch.toLowerCase());
        const matchesStatus = directoryStatusFilter === 'ALL' || (item.exam ? item.exam.status === directoryStatusFilter : false);
        return matchesSearch && matchesStatus;
    });
    // Filter exams for the Queue Page
    const filteredExams = exams.filter((exam) => {
        const matchesCourse = selectedCourseId === 'ALL' || exam.Subject_ID === selectedCourseId;
        const matchesSearch = exam.Subject_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.Subject_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.E_No.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || exam.status === statusFilter;
        return matchesCourse && matchesSearch && matchesStatus;
    });
    const selectedSubjectItem = subjectList.find((s) => s.courseId === selectedCourseId);
    // เปิดคิวของรายวิชาใดวิชาหนึ่งจากหน้ารายวิชา
    const openCourseQueue = (courseId) => {
        setSelectedCourseId(courseId);
        setSearchQuery('');
        setStatusFilter('ALL');
        onNavigate?.('queue');
    };
    const handleApprove = (exam) => {
        onUpdateExamStatus(exam.E_No, 'VERIFIED', 'ฝ่ายโสตฯ ตรวจสอบความสมบูรณ์ของเอกสารแล้ว พร้อมจัดพิมพ์');
    };
    const handleStartPrinting = (exam) => {
        onUpdateExamStatus(exam.E_No, 'PRINTING', 'กำลังดำเนินการเดินเครื่องพิมพ์ข้อสอบและจัดเรียงหน้า');
    };
    const handleFinishPrinting = (exam) => {
        onUpdateExamStatus(exam.E_No, 'PRINTED', 'จัดพิมพ์ครบจำนวน ตรวจนับ และบรรจุซองปิดผนึกเรียบร้อย');
    };
    const handleDeliverToOps = (exam) => {
        onUpdateExamStatus(exam.E_No, 'DELIVERED_OD', 'ส่งมอบซองข้อสอบปิดผนึกให้ฝ่ายดำเนินการสอบเรียบร้อย');
    };
    const handleConfirmReject = (e) => {
        e.preventDefault();
        if (!rejectingExam || !rejectReason.trim())
            return;
        onUpdateExamStatus(rejectingExam.E_No, 'REJECTED', rejectReason.trim());
        setRejectingExam(null);
        setRejectReason('');
    };
    useEscape(Boolean(rejectingExam), () => setRejectingExam(null));
    // ───────── หน้า 1: คิวตรวจสอบและผลิตข้อสอบ ─────────
    const renderQueuePage = () => (<>
      {/* Hero */}
      <div>        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
          คิวตรวจข้อสอบและพิมพ์ข้อสอบ
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          สวัสดี {currentUser.name} — ตรวจรับไฟล์ จัดพิมพ์ และส่งมอบซองข้อสอบให้ฝ่ายจัดสอบ
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
            { label: 'รอตรวจสอบ', value: exams.filter((e) => e.status === 'SUBMITTED').length },
            { label: 'กำลังจัดพิมพ์', value: exams.filter((e) => e.status === 'PRINTING').length },
            { label: 'พิมพ์เสร็จ รอส่งมอบ', value: exams.filter((e) => e.status === 'PRINTED').length },
            { label: 'ส่งมอบแล้ว', value: exams.filter((e) => ['DELIVERED_OD', 'READY_FOR_EXAM'].includes(e.status)).length },
        ].map((stat) => (<div key={stat.label} className="rounded-2xl bg-white border border-slate-200/80 px-5 py-4">
              <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>))}
      </div>

      {/* Search & Filter */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"/>
          <Input type="text" placeholder="ค้นหาเลขที่ข้อสอบ รหัสวิชา ชื่อวิชา หรืออาจารย์" aria-label="ค้นหาเลขที่ข้อสอบ รหัสวิชา ชื่อวิชา หรืออาจารย์" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 rounded-xl"/>
        </div>
        <div className="flex items-center space-x-2 text-xs shrink-0">
          <span className="text-slate-600">กรองสถานะ:</span>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto rounded-xl">
            <option value="ALL">ทุกสถานะ</option>
            {STATUS_FILTER_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </Select>
        </div>
      </div>

      {/* คิวงาน */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-display font-bold text-base text-slate-900">
            {selectedCourseId === 'ALL' ? 'รายการข้อสอบทุกวิชา' : `รายวิชา ${selectedCourseId} ${selectedSubjectItem?.courseName || ''}`}
          </h3>
          {selectedCourseId !== 'ALL' && (<Button size="sm" variant="outline" onClick={() => setSelectedCourseId('ALL')} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
              ดูทุกวิชา
            </Button>)}
        </div>

        <div className="divide-y divide-slate-100">
          {filteredExams.length === 0 ? (<div className="p-12 text-center text-slate-500 text-xs">
              {selectedCourseId !== 'ALL'
                ? `รายวิชา ${selectedCourseId} ยังไม่มีไฟล์ข้อสอบส่งเข้ามาในระบบ`
                : 'ไม่พบรายการข้อสอบที่ตรงกับการค้นหา'}
            </div>) : (filteredExams.map((exam) => {
            const statusConfig = STATUS_LABELS[exam.status];
            return (<div key={exam.E_No} className="p-6 hover:bg-slate-50/50 transition-colors space-y-4">
                  {/* หัวแถว + ปุ่มเครื่องมือ */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold bg-[#1A4B7A]/10 text-[#1A4B7A] px-2.5 py-0.5 rounded-md border border-[#1A4B7A]/20">
                          {exam.E_No}
                        </span>
                        <span className="font-mono text-sm font-bold text-slate-900">{exam.Subject_ID}</span>
                        <span className="inline-flex items-center rounded-md bg-[#1A4B7A]/10 text-[#1A4B7A] border border-[#1A4B7A]/20 px-2 py-0.5 text-xs font-bold">
                          ชุด {exam.exam_set || 'A'}
                        </span>
                        <h4 className="font-display text-base font-bold text-slate-900">{exam.Subject_Name}</h4>
                        <Badge className={statusConfig.badgeClass}>{statusConfig.label}</Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 pt-1">
                        <div>
                          <span className="text-slate-500">อาจารย์: </span>
                          <span className="font-medium text-slate-800">{exam.teacher_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">วัน/เวลาสอบ: </span>
                          <span>{formatThaiDate(exam.E_Date)} ({exam.E_Time})</span>
                        </div>
                        <div>
                          <span className="text-slate-500">ห้องสอบ: </span>
                          <span className="font-medium">{exam.room}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">ยอดพิมพ์: </span>
                          <span className="font-bold text-[#1A4B7A]">
                            {exam.total_copies + exam.copies_reserve} ชุด
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                        <span>อัปโหลดเมื่อ: {exam.upload_date}</span>
                        {exam.checked_by && <span>• ตรวจสอบโดย: {exam.checked_by}</span>}
                      </div>

                      {exam.envelope_notes && (<div className="text-xs text-amber-900 bg-amber-50/70 p-2 rounded-lg border border-amber-200 mt-1">
                          <strong>คำชี้แจงจากอาจารย์:</strong> {exam.envelope_notes}
                        </div>)}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => onPreviewExam(exam)} title="เปิดดูตัวอย่างไฟล์ข้อสอบ" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                        <Eye className="w-3.5 h-3.5 text-[#1A4B7A]"/>
                        <span>ตรวจข้อสอบ</span>
                      </Button>

                      <Button variant="outline" size="sm" onClick={() => onOpenEnvelope(exam)} title="พิมพ์ใบปะหน้าซองข้อสอบ" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                        <FileText className="w-3.5 h-3.5 text-[#1A4B7A]"/>
                        <span>พิมพ์หน้าซอง</span>
                      </Button>

                      {/* พิมพ์ข้อสอบจริง — ปุ่มรอง (outline) และเปิดใช้หลังผ่านการตรวจสอบเท่านั้น */}
                      {['VERIFIED', 'PRINTING', 'PRINTED', 'DELIVERED_OD', 'READY_FOR_EXAM'].includes(exam.status) && (<Button variant="outline" size="sm" onClick={() => onPrintExam(exam)} title="สั่งพิมพ์ข้อสอบจริงเข้าเครื่องพิมพ์" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                        <Printer className="w-3.5 h-3.5 text-[#1A4B7A]"/>
                        <span>พิมพ์ข้อสอบ</span>
                      </Button>)}
                    </div>
                  </div>

                  {/* การปรับสถานะ — ปุ่มหลักของแถวคือ action ถัดไปตามสถานะ */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 font-semibold">การปรับสถานะ:</span>

                    <div className="flex flex-wrap items-center gap-2">
                      {exam.status === 'SUBMITTED' && (<>
                          <Button size="sm" onClick={() => handleApprove(exam)}>
                            <CheckCheck className="w-3.5 h-3.5"/>
                            <span>อนุมัติผ่านการตรวจสอบ</span>
                          </Button>
                          <Button size="sm" variant="outline" className="text-rose-700 border-rose-200 hover:bg-rose-50" onClick={() => {
                        setRejectingExam(exam);
                        setRejectReason('');
                    }}>
                            <RotateCcw className="w-3.5 h-3.5"/>
                            <span>ส่งกลับแก้ไข</span>
                          </Button>
                        </>)}

                      {exam.status === 'VERIFIED' && (<Button size="sm" onClick={() => handleStartPrinting(exam)}>
                          <Printer className="w-3.5 h-3.5"/>
                          <span>เริ่มจัดพิมพ์</span>
                        </Button>)}

                      {exam.status === 'PRINTING' && (<Button size="sm" onClick={() => handleFinishPrinting(exam)}>
                          <CheckCircle className="w-3.5 h-3.5"/>
                          <span>พิมพ์และบรรจุซองเสร็จ</span>
                        </Button>)}

                      {exam.status === 'PRINTED' && (<Button size="sm" onClick={() => handleDeliverToOps(exam)}>
                          <Send className="w-3.5 h-3.5"/>
                          <span>ส่งมอบให้ฝ่ายดำเนินการสอบ</span>
                        </Button>)}

                      {['DELIVERED_OD', 'READY_FOR_EXAM'].includes(exam.status) && (<Badge variant="success">
                          <CheckCircle className="w-3.5 h-3.5 mr-1"/>
                          ส่งมอบให้ฝ่ายจัดสอบเรียบร้อยแล้ว
                        </Badge>)}
                    </div>
                  </div>
                </div>);
        }))}
        </div>
      </div>
    </>);
    // ───────── หน้า 2: รายวิชาและอาจารย์ผู้ประสานงาน ─────────
    const renderDirectoryPage = () => (<>
      {/* Hero */}
      <div>        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
          รายวิชาและอาจารย์ผู้ประสานงาน
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          ข้อมูลติดต่ออาจารย์ผู้สอนและสถานะข้อสอบของแต่ละรายวิชา
        </p>
      </div>

      {/* Search & Filter */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"/>
          <Input type="text" placeholder="ค้นหารหัสวิชา ชื่อวิชา หรืออาจารย์ผู้สอน" aria-label="ค้นหารหัสวิชา ชื่อวิชา หรืออาจารย์ผู้สอน" value={directorySearch} onChange={(e) => setDirectorySearch(e.target.value)} className="pl-9 rounded-xl"/>
        </div>
        <div className="flex items-center space-x-2 text-xs shrink-0">
          <span className="text-slate-600">กรองสถานะ:</span>
          <Select value={directoryStatusFilter} onChange={(e) => setDirectoryStatusFilter(e.target.value)} className="w-auto rounded-xl">
            <option value="ALL">ทุกสถานะ</option>
            {STATUS_FILTER_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </Select>
        </div>
      </div>

      {/* ตารางรายวิชา */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">รหัสวิชาและชื่อวิชา</th>
                <th className="py-3 px-4 font-semibold">อาจารย์ผู้สอน</th>
                <th className="py-3 px-4 font-semibold">เบอร์โทรติดต่อ</th>
                <th className="py-3 px-4 font-semibold">วัน/เวลา/ห้องสอบ</th>
                <th className="py-3 px-4 font-semibold">ยอดพิมพ์</th>
                <th className="py-3 px-4 font-semibold">สถานะข้อสอบ</th>
                <th className="py-3 px-4 font-semibold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubjects.length === 0 ? (<tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    ไม่พบข้อมูลรายวิชาและอาจารย์ที่ตรงกับการค้นหา
                  </td>
                </tr>) : (filteredSubjects.flatMap((item) => {
            // หนึ่งแถวต่อชุดข้อสอบ — วิชาที่ยังไม่ส่งแสดงหนึ่งแถว
            const rowsForCourse = (item.exams ?? []).length > 0
                ? (item.exams ?? []).map((exam) => ({ item, exam, key: exam.E_No }))
                : [{ item, exam: null, key: item.courseId }];
            return rowsForCourse.map(({ item, exam, key }) => {
            const statusConfig = exam ? STATUS_LABELS[exam.status] : NO_EXAM_STATUS;
            const setLabel = exam ? (exam.exam_set || 'A') : null;
            return (<tr key={key} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-800 border-slate-300">
                            {item.courseId}
                          </span>
                          <span className="font-semibold text-slate-900">{item.courseName}</span>
                          {setLabel && (<span className="inline-flex items-center rounded bg-[#1A4B7A]/10 text-[#1A4B7A] border border-[#1A4B7A]/20 px-1.5 py-0.5 text-[11px] font-bold">
                              ชุด {setLabel}
                            </span>)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-500"/>
                          <span className="font-medium">{item.teacherName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center space-x-1 font-mono text-xs">
                          <Phone className="w-3 h-3 text-slate-500"/>
                          <span>{item.teacherTel}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {exam ? (<div>
                            <div>{formatThaiDate(exam.E_Date)} ({exam.E_Time})</div>
                            <div className="text-slate-500 text-xs">ห้อง: {exam.room}</div>
                          </div>) : (<span className="text-slate-500">ยังไม่กำหนด</span>)}
                      </td>

                      <td className="py-3 px-4">
                        {exam ? (<span className="font-semibold text-slate-900">
                            {exam.total_copies + exam.copies_reserve} ชุด
                          </span>) : (<span className="text-slate-500">{item.studentCount} คน</span>)}
                      </td>

                      <td className="py-3 px-4">
                        <Badge className={statusConfig.badgeClass}>{statusConfig.label}</Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {exam ? (<div className="flex items-center justify-end space-x-1.5">
                            <Button size="sm" variant="outline" onClick={() => openCourseQueue(item.courseId)} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                              ดูคิววิชานี้
                            </Button>
                            <Button variant="ghost" size="icon" className="size-9 text-slate-600 hover:text-[#1A4B7A]" onClick={() => onPreviewExam(exam)} title="ดูตัวอย่างข้อสอบ">
                              <Eye className="w-3.5 h-3.5"/>
                            </Button>
                            <Button variant="ghost" size="icon" className="size-9 text-slate-600 hover:text-[#1A4B7A]" onClick={() => onOpenEnvelope(exam)} title="พิมพ์ใบปะหน้าซองข้อสอบ">
                              <Printer className="w-3.5 h-3.5"/>
                            </Button>
                          </div>) : (<span className="text-slate-500 text-xs">รออาจารย์จัดส่ง</span>)}
                      </td>
                    </tr>);
        });
        }))}
            </tbody>
          </table>
        </div>
        <p className="sm:hidden flex items-center gap-1.5 px-4 py-2.5 text-[11px] text-slate-500 border-t border-slate-100 bg-slate-50">
          <MoveHorizontal className="w-3.5 h-3.5"/>
          เลื่อนตารางไปทางขวาเพื่อดูข้อมูลทั้งหมด
        </p>
      </div>
    </>);
    return (<div className="max-w-6xl mx-auto space-y-6">
      {page === 'directory' ? renderDirectoryPage() : renderQueuePage()}

      {/* Reject Modal */}
      {rejectingExam && (<div role="dialog" aria-modal="true" aria-labelledby="reject-title" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#1A4B7A] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-white/80"/>
                <h3 id="reject-title" className="font-display font-bold text-sm">ส่งกลับแก้ไขข้อสอบ</h3>
              </div>
              <button onClick={() => setRejectingExam(null)} className="p-1 text-white/60 hover:text-white rounded-lg" aria-label="ปิด">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                ส่งกลับข้อสอบรายวิชา <strong>{rejectingExam.Subject_ID} {rejectingExam.Subject_Name}</strong>{' '}
                ให้อาจารย์ {rejectingExam.teacher_name} เพื่ออัปโหลดใหม่
              </p>

              <div>
                <Label htmlFor="reject-reason" className="mb-1">
                  เหตุผล / รายละเอียดที่ต้องแก้ไข
                </Label>
                <Textarea id="reject-reason" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required placeholder="เช่น ไฟล์ PDF ไม่สมบูรณ์, หน้าที่ 4 ข้อสอบตกหล่น, ขอให้อัปโหลดใหม่..."/>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setRejectingExam(null)}>
                  ยกเลิก
                </Button>
                <Button type="submit" variant="destructive">
                  ยืนยันส่งกลับแก้ไข
                </Button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
