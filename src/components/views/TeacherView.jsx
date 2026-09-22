/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: TeacherView.jsx
 * หน้าที่ของหน้านี้: แดชบอร์ดสำหรับอาจารย์ผู้สอน — เลือกรายวิชาที่สอนแบบ 2 ขั้นตอน,
 *   จัดส่ง/อัปโหลดไฟล์ข้อสอบ, ติดตามสถานะข้อสอบด้วย progress tracker 5 ขั้น,
 *   ลบข้อสอบของตนเองได้ทุกสถานะ (ระบบลบไฟล์แนบ + บันทึก audit ให้อัตโนมัติ),
 * ผู้ใช้งาน: อาจารย์ผู้สอน (Teacher)
 * ฟีเจอร์หลัก:
 *   1. การ์ดรายวิชาพร้อมสถานะข้อสอบล่าสุด (STATUS_LABELS)
 *   2. ปุ่มจัดส่งข้อสอบ / อัปโหลดใหม่ (PDF/DOCX ไม่เกิน 25MB)
 *   3. ดูตัวอย่างข้อสอบ, พิมพ์ใบปะหน้า, ยกเลิกการส่ง
 * หมายเหตุ: มีเงื่อนไขพิเศษ hardcoded — อาจารย์ T001 เห็นทุกรายวิชา (โหมดสาธิต)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { STATUS_LABELS } from '@/lib/statusLabels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Upload, RefreshCw, Trash2, Eye, AlertTriangle, AlertCircle, Plus, Printer, Check, X, } from 'lucide-react';
import { StepProgress } from '@/components/ui/step-progress';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
export const TeacherView = ({ currentUser, courses, exams, onOpenUploadModal, onPreviewExam, onRemoveExam, onAddNewCourse, onOpenEnvelope, }) => {
    const [showNewCourseModal, setShowNewCourseModal] = useState(false);
    const [newCourseCode, setNewCourseCode] = useState('');
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseTerm, setNewCourseTerm] = useState('1');
    const [newCourseYear, setNewCourseYear] = useState('2567');
    const [newCourseStudents, setNewCourseStudents] = useState(45);
    const [newCourseError, setNewCourseError] = useState('');
    const [highlightCourseId, setHighlightCourseId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    // Filter courses for this teacher or all if academic affairs
    const myCourses = courses.filter((c) => c.teacher_id === currentUser.id || currentUser.id === 'T001');
    // Selected course state: Encounter course selection first!
    const [selectedCourseId, setSelectedCourseId] = useState(() => {
        return myCourses.length > 0 ? myCourses[0].Course_id : 'ALL';
    });
    const getExamForCourse = (courseId) => {
        return exams.find((e) => e.Subject_ID === courseId);
    };
    // ข้อ 2: เลือกวิชาในขั้นตอนที่ 1 → เลื่อนไปหาแถวเดียวกันในขั้นตอนที่ 2 + ไฮไลต์ชั่วคราว
    const handleSelectCourse = (courseId) => {
        setSelectedCourseId(courseId);
        if (courseId === 'ALL')
            return;
        setTimeout(() => {
            const el = document.getElementById('exam-row-' + courseId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightCourseId(courseId);
                setTimeout(() => setHighlightCourseId((prev) => (prev === courseId ? null : prev)), 2600);
            }
        }, 80);
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
            sec: '01',
            credits: 3,
            student_count: Number(newCourseStudents) || 30,
            teacher_id: currentUser.id,
            teacher_name: currentUser.name,
        };
        onAddNewCourse(newCourse);
        setSelectedCourseId(newCourse.Course_id);
        setShowNewCourseModal(false);
        setNewCourseCode('');
        setNewCourseName('');
        setNewCourseError('');
    };
    const steps = [
        { title: 'ส่งข้อสอบ', desc: 'อาจารย์อัปโหลด' },
        { title: 'โสตฯ ตรวจสอบ', desc: 'ตรวจความสมบูรณ์' },
        { title: 'จัดพิมพ์', desc: 'พิมพ์และบรรจุซอง' },
        { title: 'ส่งมอบฝ่ายจัดสอบ', desc: 'ลงทะเบียนรับมอบ' },
        { title: 'พร้อมสอบ', desc: 'ในห้องมั่นคง' },
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
    // Courses to display in the Exam Management section below
    const displayedCourses = selectedCourseId === 'ALL'
        ? myCourses
        : myCourses.filter((c) => c.Course_id === selectedCourseId);
    return (<div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl px-5 py-3.5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge className="border-indigo-400/30 bg-indigo-500/30 text-indigo-200 font-medium">
              แดชบอร์ดอาจารย์ผู้สอน & ฝ่ายวิชาการ
            </Badge>
            <h2 className="font-display text-lg sm:text-xl font-bold">
              สวัสดี, {currentUser.name}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl leading-relaxed">
              {currentUser.department} • ติดตามการส่ง ตรวจสอบ และจัดพิมพ์ข้อสอบของท่านได้จากหน้านี้
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button onClick={() => setShowNewCourseModal(true)} className="border border-indigo-400/40 shadow-sm">
              <Plus />
              <span>เพิ่มรายวิชา</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">รายวิชาที่สอนในระบบ</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{myCourses.length} วิชา</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">ส่งข้อสอบแล้ว</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {exams.filter((e) => myCourses.some((c) => c.Course_id === e.Subject_ID)).length} วิชา
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">กำลังจัดพิมพ์ / พิมพ์แล้ว</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {exams.filter((e) => myCourses.some((c) => c.Course_id === e.Subject_ID) &&
            ['PRINTING', 'PRINTED', 'DELIVERED_OD', 'READY_FOR_EXAM'].includes(e.status)).length}{' '}
            วิชา
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">ส่งมอบฝ่ายดำเนินการแล้ว</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {exams.filter((e) => myCourses.some((c) => c.Course_id === e.Subject_ID) &&
            ['DELIVERED_OD', 'READY_FOR_EXAM'].includes(e.status)).length}{' '}
            วิชา
          </p>
        </Card>
      </div>

      {/* 1. Course Selection Section (FIRST: Encounter and select course before exam list) */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <Badge className="rounded-md border-transparent bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5">
                ขั้นตอนที่ 1
              </Badge>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-600"/>
                <span>เลือกรายวิชาที่ต้องจัดการข้อสอบ</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              เลือกรายวิชาเพื่อจัดส่งไฟล์ข้อสอบ — เมื่อเลือกแล้ว ระบบจะพาไปที่รายการข้อสอบของวิชานั้นในขั้นตอนที่ 2 ด้านล่างโดยอัตโนมัติ
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant={selectedCourseId === 'ALL' ? 'default' : 'outline'} onClick={() => setSelectedCourseId('ALL')} className={selectedCourseId === 'ALL'
            ? 'shadow-xs'
            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-700'}>
              แสดงทุกรายวิชา ({myCourses.length})
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowNewCourseModal(true)} className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-700">
              <Plus className="w-3.5 h-3.5"/>
              <span>เพิ่มวิชาใหม่</span>
            </Button>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myCourses.map((c) => {
            const courseExam = getExamForCourse(c.Course_id);
            const isSelected = selectedCourseId === c.Course_id;
            const statusConfig = courseExam ? STATUS_LABELS[courseExam.status] : null;
            return (<div key={c.Course_id} onClick={() => handleSelectCourse(c.Course_id)} className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative ${isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`font-mono text-sm font-bold px-2.5 py-0.5 rounded border ${isSelected
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-slate-100 text-slate-800 border-slate-300'}`}>
                    {c.Course_id}
                  </span>

                  {statusConfig ? (<Badge className={statusConfig.badgeClass}>{statusConfig.label}</Badge>) : (<Badge className="bg-slate-100 text-slate-700 border-slate-300">ยังไม่ส่งข้อสอบ</Badge>)}
                </div>

                <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                  {c.Course_Name}
                </h4>

                <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span>
                    Sec {c.sec} • {c.student_count} คน • {c.credits} หน่วยกิต
                  </span>
                  {isSelected ? (<span className="text-indigo-700 font-bold flex items-center space-x-1 text-xs">
                      <Check className="w-3.5 h-3.5"/>
                      <span>กำลังเลือกวิชานี้</span>
                    </span>) : (<span className="text-slate-400">คลิกเพื่อเลือก</span>)}
                </div>
              </div>);
        })}
        </div>
      </Card>

      {/* 2. Exam Management Section (Follows the course selection) */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <Badge className="rounded-md border-transparent bg-slate-800 text-white text-xs font-bold px-2.5">
                ขั้นตอนที่ 2
              </Badge>
              <h3 className="font-display font-bold text-base text-slate-900">
                {selectedCourseId === 'ALL'
            ? 'รายการข้อสอบและการติดตามสถานะทุกรายวิชา'
            : `รายการข้อสอบและการดำเนินการ: ${selectedCourseId} ${myCourses.find((c) => c.Course_id === selectedCourseId)?.Course_Name || ''}`}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {selectedCourseId === 'ALL'
            ? 'รายการดำเนินการจริงต่อจากขั้นตอนที่ 1 — จัดการข้อสอบได้ทีละรายการในแถวด้านล่าง'
            : 'รายการดำเนินการจริงของวิชาที่เลือกด้านบน — ตรวจสอบไฟล์ สั่งพิมพ์ใบปะหน้า หรือส่งฉบับปรับปรุง'}
            </p>
          </div>
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>อาจารย์ยกเลิกข้อสอบของตนเองได้ทุกสถานะ (ระบบบันทึกประวัติให้ทุกครั้ง)</span>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {displayedCourses.length === 0 ? (<div className="p-10 text-center text-slate-400 text-xs">
              ไม่พบรายวิชาที่เลือก
            </div>) : (displayedCourses.map((course) => {
            const exam = getExamForCourse(course.Course_id);
            const statusConfig = exam ? STATUS_LABELS[exam.status] : STATUS_LABELS.DRAFT;
            const progressStep = getStepProgress(exam?.status);
            return (<div key={course.Course_id} id={'exam-row-' + course.Course_id} className={`p-6 hover:bg-slate-50/50 transition-colors space-y-4 ${highlightCourseId === course.Course_id ? 'ring-2 ring-indigo-500 bg-indigo-50/60 rounded-xl' : ''}`}>
                  {/* Course Header Row */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-sm font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-200">
                          {course.Course_id}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{course.Course_Name}</h4>
                        <Badge className={statusConfig.badgeClass}>{statusConfig.label}</Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>กลุ่มเรียน (Sec): {course.sec}</span>
                        <span>•</span>
                        <span>จำนวนนักศึกษา: {course.student_count} คน</span>
                        <span>•</span>
                        <span>หน่วยกิต: {course.credits}</span>
                        {exam && (<>
                            <span>•</span>
                            <span className="text-slate-700 font-medium">
                              วันสอบ: {exam.E_Date} ({exam.E_Time})
                            </span>
                            <span>•</span>
                            <span className="text-slate-700 font-medium">ห้อง: {exam.room}</span>
                          </>)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {!exam ? (<Button onClick={() => onOpenUploadModal(course, null, false)}>
                          <Upload />
                          <span>จัดส่งข้อสอบ</span>
                        </Button>) : (<>
                          <Button variant="outline" size="sm" onClick={() => onPreviewExam(exam)} title="ดูตัวอย่างข้อสอบและลายน้ำความปลอดภัย" className="min-h-[44px]">
                            <Eye className="text-indigo-600"/>
                            <span>ดูข้อสอบ</span>
                          </Button>

                          <Button variant="outline" size="sm" onClick={() => onOpenEnvelope(exam)} title="ดูและสั่งพิมพ์ใบปะหน้าซองข้อสอบ" className="min-h-[44px]">
                            <Printer className="text-purple-600"/>
                            <span>ใบปะหน้าซอง</span>
                          </Button>

                          {/* Re-upload — only allowed before printing starts,
                        matching the Remove button and the "ก่อนเริ่มพิมพ์" rule */}
                          {['SUBMITTED', 'VERIFIED', 'REJECTED'].includes(exam.status) && (<Button variant="outline" size="sm" onClick={() => onOpenUploadModal(course, exam, true)} className="min-h-[44px] border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-800" title="อัปโหลดไฟล์ข้อสอบฉบับปรับปรุงใหม่">
                              <RefreshCw />
                              <span>อัปโหลดใหม่</span>
                            </Button>)}

                          {/* Delete — แยกออกจากปุ่มปกติด้วยเส้นขัด + สีแดงเข้ม และต้องผ่าน confirm modal เสมอ (ข้อ 4) */}
                          {(<Button variant="destructive" size="icon" onClick={() => setDeleteTarget({ exam, course })} className="ml-3 border-l-2 border-l-rose-200 pl-4 h-11 w-11 rounded-lg" title="ลบข้อสอบฉบับนี้ออกจากระบบ">
                              <Trash2 className="w-4 h-4"/>
                            </Button>)}
                        </>)}
                    </div>
                  </div>

                  {/* If exam is not uploaded yet, show helpful upload card */}
                  {!exam && (<div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-bold text-amber-950 flex items-center space-x-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600"/>
                          <span>ยังไม่ได้จัดส่งไฟล์ข้อสอบสำหรับรายวิชานี้</span>
                        </p>
                        <p className="text-amber-800">
                          กรุณาเตรียมไฟล์ข้อสอบ (PDF หรือ Word) พร้อมระบุห้องสอบ วันเวลา และจำนวนชุดที่ต้องการพิมพ์
                        </p>
                      </div>
                      <Button onClick={() => onOpenUploadModal(course, null, false)} className="shrink-0">
                        <Upload />
                        <span>เริ่มจัดส่งข้อสอบ</span>
                      </Button>
                    </div>)}

                  {/* Progress Stepper Bar (ตรวจสอบสถานะของตนเอง) */}
                  {exam && (<div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          ความคืบหน้าการผลิตข้อสอบ:
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          ไฟล์: {exam.file_name} ({exam.file_size}) • ส่งเมื่อ: {exam.upload_date}
                        </span>
                      </div>

                      <StepProgress steps={steps.map((st) => st.title)} current={progressStep}/>

                      {exam.checked_by && (<div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                          <span>
                            ผู้ตรวจสอบ: <strong>{exam.checked_by}</strong> เมื่อ {exam.verified_date || 'เมื่อเร็วๆ นี้'}
                          </span>
                          {exam.status === 'PRINTED' && (<span className="text-purple-700 font-semibold">
                              พิมพ์เสร็จสิ้น {exam.total_copies + exam.copies_reserve} ชุด เรียบร้อยแล้ว
                            </span>)}
                        </div>)}

                      {exam.status === 'REJECTED' && exam.rejection_reason && (<div className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200 flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"/>
                          <div>
                            <strong>เหตุผลที่ส่งกลับแก้ไข:</strong> {exam.rejection_reason}
                            <div className="mt-1 font-semibold text-rose-700">
                              คำแนะนำ: กดปุ่ม "อัปโหลดใหม่" เพื่อแนบไฟล์ฉบับปรับปรุง
                            </div>
                          </div>
                        </div>)}
                    </div>)}
                </div>);
        }))}
        </div>
      </Card>

      {/* New Course Modal */}
      {showNewCourseModal && (<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-400"/>
                <h3 className="font-display font-bold text-sm">เพิ่มข้อมูลรายวิชาใหม่</h3>
              </div>
              <button onClick={() => setShowNewCourseModal(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4 text-xs">
              {newCourseError && (<div className="bg-rose-50 border border-rose-300 text-rose-800 px-3 py-2 rounded-lg flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600"/>
                  <span>{newCourseError}</span>
                </div>)}
              <div>
                <Label className="text-slate-700 mb-1">รหัสวิชา (Course ID) *</Label>
                <Input type="text" placeholder="เช่น CS345, MA205, SC102" value={newCourseCode} onChange={(e) => {
                setNewCourseCode(e.target.value);
                setNewCourseError('');
            }} required className="uppercase"/>
              </div>

              <div>
                <Label className="text-slate-700 mb-1">ชื่อรายวิชา (Course Name) *</Label>
                <Input type="text" placeholder="เช่น ปัญญาประดิษฐ์ (Artificial Intelligence)" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} required/>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-slate-700 mb-1">ภาคเรียน</Label>
                  <Select value={newCourseTerm} onChange={(e) => setNewCourseTerm(e.target.value)}>
                    <option value="1">ภาคเรียนที่ 1</option>
                    <option value="2">ภาคเรียนที่ 2</option>
                    <option value="3">ภาคฤดูร้อน</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-700 mb-1">ปีการศึกษา</Label>
                  <Input type="text" value={newCourseYear} onChange={(e) => setNewCourseYear(e.target.value)}/>
                </div>
                <div>
                  <Label className="text-slate-700 mb-1">จำนวน นศ. (คน)</Label>
                  <Input type="number" min="1" value={newCourseStudents} onChange={(e) => setNewCourseStudents(parseInt(e.target.value) || 1)}/>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowNewCourseModal(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" className="px-5">
                  บันทึกรายวิชา
                </Button>
              </div>
            </form>
          </div>
        </div>)}

      {/* ── ข้อ 4: Confirm dialog ก่อนลบข้อสอบ (ใช้ Modal กลางของระบบ) ── */}
      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} size="sm">
        <ModalHeader icon={AlertTriangle} title="ยืนยันการลบข้อสอบ" subtitle={deleteTarget ? `${deleteTarget.course.Course_id} — ${deleteTarget.exam.file_name}` : ''} onClose={() => setDeleteTarget(null)} className="from-rose-950 to-slate-900 border-rose-900"/>
        <ModalBody className="text-sm space-y-3">
          <p>
            ยืนยันการลบข้อสอบวิชา <strong>{deleteTarget?.course.Course_id} {deleteTarget?.course.Course_Name}</strong> ออกจากระบบหรือไม่?
          </p>
          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            ไฟล์แนบใน Storage และประวัติที่ผูกกับรายการนี้จะถูกลบถาวร — ระบบบันทึก Audit Log ทุกครั้ง
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            ยกเลิก
          </Button>
          <Button variant="destructive" onClick={() => {
            onRemoveExam(deleteTarget.exam.E_No);
            setDeleteTarget(null);
        }}>
            <Trash2 className="w-4 h-4"/>
            <span>ลบถาวร</span>
          </Button>
        </ModalFooter>
      </Modal>
    </div>);
};
