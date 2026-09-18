/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: AudioVisualView.jsx
 * หน้าที่ของหน้านี้: หน้างานสำหรับหน่วยเทคโนโลยีการศึกษา (โสตทัศน์) — การ์ด KPI
 *   ของ pipeline (รอตรวจ / กำลังพิมพ์ / พิมพ์แล้ว / ส่งมอบแล้ว), ค้นหา + กรองสถานะ,
 *   เลือกรายวิชาจากตาราง แล้วดำเนินการในคิวผลิต: ตรวจสอบผ่าน (VERIFIED),
 *   ปฏิเสธพร้อมเหตุผล (REJECTED), เริ่มพิมพ์ (PRINTING), พิมพ์เสร็จ (PRINTED),
 *   ส่งมอบฝ่ายดำเนินการ (DELIVERED_OD)
 * ผู้ใช้งาน: เจ้าหน้าที่หน่วยโสตทัศน์ (AudioVisual)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { STATUS_LABELS } from '@/lib/statusLabels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Printer, CheckCircle, Eye, AlertTriangle, Search, Filter, Send, CheckCheck, RotateCcw, BookOpen, User, Phone, } from 'lucide-react';
export const AudioVisualView = ({ currentUser, courses = [], exams, onPreviewExam, onOpenEnvelope, onUpdateExamStatus, onPrintExam, }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedCourseId, setSelectedCourseId] = useState('ALL');
    const [rejectingExam, setRejectingExam] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const subjectList = (courses.length > 0 ? courses : []).map((c) => {
        const matchedExam = exams.find((e) => e.Subject_ID === c.Course_id);
        return {
            courseId: c.Course_id,
            courseName: c.Course_Name,
            teacherName: matchedExam ? matchedExam.teacher_name : c.teacher_name,
            teacherTel: matchedExam?.teacher_tel || '081-xxx-xxxx',
            sec: c.sec,
            studentCount: c.student_count,
            exam: matchedExam,
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
            });
        }
    });
    // Filter subjects for the Directory Section
    const filteredSubjects = subjectList.filter((item) => {
        const matchesSearch = item.courseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || (item.exam ? item.exam.status === statusFilter : false);
        return matchesSearch && matchesStatus;
    });
    // Filter exams for the Production Section
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
    return (<div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge className="bg-indigo-500/30 text-indigo-300 border-indigo-500/30 rounded-full font-medium">
                หน่วยเทคโนโลยีการศึกษา (ฝ่ายโสตฯ)
              </Badge>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold">
              ระบบตรวจสอบและผลิตจัดพิมพ์ข้อสอบ
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ผู้ปฏิบัติงาน: {currentUser.name} • {currentUser.location || 'ห้องผลิตสื่อและพิมพ์ข้อสอบ ชั้น 2'}
              <br />
              ตรวจรับไฟล์ข้อสอบ จัดพิมพ์ และส่งมอบซองข้อสอบให้ฝ่ายจัดสอบ
            </p>
          </div>
        </div>
      </div>

      {/* Production Pipeline Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-amber-200 bg-amber-50/30">
          <p className="text-xs text-amber-800 font-medium">รอตรวจสอบ</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {exams.filter((e) => e.status === 'SUBMITTED').length} รายการ
          </p>
        </Card>

        <Card className="p-4 border-indigo-200 bg-indigo-50/30">
          <p className="text-xs text-indigo-800 font-medium">กำลังจัดพิมพ์</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {exams.filter((e) => e.status === 'PRINTING').length} รายการ
          </p>
        </Card>

        <Card className="p-4 border-purple-200 bg-purple-50/30">
          <p className="text-xs text-purple-800 font-medium">พิมพ์เสร็จ/รอส่งมอบ</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {exams.filter((e) => e.status === 'PRINTED').length} รายการ
          </p>
        </Card>

        <Card className="p-4 border-teal-200 bg-teal-50/30">
          <p className="text-xs text-teal-800 font-medium">ส่งมอบฝ่ายจัดสอบแล้ว</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">
            {exams.filter((e) => ['DELIVERED_OD', 'READY_FOR_EXAM'].includes(e.status)).length} รายการ
          </p>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
          <Input type="text" placeholder="ค้นหารหัสวิชา ชื่อวิชา หรืออาจารย์ผู้สอน" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 rounded-xl"/>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400"/>
          <span className="text-slate-600">กรองสถานะ:</span>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto rounded-xl">
            <option value="ALL">สถานะทั้งหมด</option>
            <option value="SUBMITTED">รอตรวจสอบ</option>
            <option value="VERIFIED">ตรวจสอบแล้ว</option>
            <option value="PRINTING">กำลังจัดพิมพ์</option>
            <option value="PRINTED">พิมพ์และบรรจุซองแล้ว</option>
            <option value="DELIVERED_OD">ส่งมอบฝ่ายดำเนินการแล้ว</option>
            <option value="REJECTED">ส่งกลับแก้ไข</option>
          </Select>
        </div>
      </Card>

      {/* SECTION 1: รายการวิชาและชื่ออาจารย์ (FIRST: Subject & Teacher Directory) */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <Badge className="rounded-md border-transparent bg-indigo-100 text-indigo-800">
                ขั้นตอนที่ 1
              </Badge>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-600"/>
                <span>รายการวิชาและอาจารย์ผู้ประสานงาน</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              เลือกวิชาเพื่อดูรายการข้อสอบและจัดการการพิมพ์ด้านล่าง
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant={selectedCourseId === 'ALL' ? 'default' : 'outline'} onClick={() => setSelectedCourseId('ALL')}>
              แสดงข้อสอบทุกวิชา ({subjectList.length})
            </Button>
          </div>
        </div>

        {/* Subjects & Instructors Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-200">
              {filteredSubjects.length === 0 ? (<tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    ไม่พบข้อมูลรายวิชาและอาจารย์ที่ตรงกับการค้นหา
                  </td>
                </tr>) : (filteredSubjects.map((item) => {
            const isSelected = selectedCourseId === item.courseId;
            const statusConfig = item.exam ? STATUS_LABELS[item.exam.status] : null;
            return (<tr key={item.courseId} onClick={() => setSelectedCourseId(item.courseId)} className={`cursor-pointer transition-colors ${isSelected
                    ? 'bg-indigo-50/70 hover:bg-indigo-50 font-medium'
                    : 'hover:bg-slate-50'}`}>
                      {/* Course */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${isSelected
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-slate-100 text-slate-800 border-slate-300'}`}>
                            {item.courseId}
                          </span>
                          <span className="font-semibold text-slate-900">{item.courseName}</span>
                        </div>
                      </td>

                      {/* Instructor Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400"/>
                          <span className="font-medium">{item.teacherName}</span>
                        </div>
                      </td>

                      {/* Instructor Tel */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center space-x-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400"/>
                          <span>{item.teacherTel}</span>
                        </div>
                      </td>

                      {/* Schedule & Room */}
                      <td className="py-3 px-4 text-slate-600">
                        {item.exam ? (<div>
                            <div>{item.exam.E_Date} ({item.exam.E_Time})</div>
                            <div className="text-slate-500 text-[11px]">ห้อง: {item.exam.room}</div>
                          </div>) : (<span className="text-slate-400">ยังไม่กำหนด</span>)}
                      </td>

                      {/* Copies */}
                      <td className="py-3 px-4">
                        {item.exam ? (<span className="font-semibold text-slate-900">
                            {item.exam.total_copies + item.exam.copies_reserve} ชุด
                          </span>) : (<span className="text-slate-400">{item.studentCount} คน</span>)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {statusConfig ? (<Badge className={statusConfig.badgeClass}>{statusConfig.label}</Badge>) : (<Badge variant="warning">ยังไม่ส่งข้อสอบ</Badge>)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          {item.exam ? (<>
                              <Button size="sm" variant={isSelected ? 'default' : 'outline'} className={isSelected ? '' : 'text-indigo-700 border-indigo-200 hover:bg-indigo-50'} onClick={() => setSelectedCourseId(item.courseId)}>
                                {isSelected ? 'กำลังเลือก' : 'เลือกวิชานี้'}
                              </Button>
                              <Button variant="ghost" size="icon" className="size-7 text-slate-600 hover:text-indigo-600" onClick={() => item.exam && onPreviewExam(item.exam)} title="ดูตัวอย่างข้อสอบ">
                                <Eye className="w-3.5 h-3.5"/>
                              </Button>
                              <Button variant="ghost" size="icon" className="size-7 text-purple-600 hover:bg-purple-50 hover:text-purple-700" onClick={() => item.exam && onOpenEnvelope(item.exam)} title="พิมพ์ใบปะหน้าซองข้อสอบ">
                                <Printer className="w-3.5 h-3.5"/>
                              </Button>
                            </>) : (<span className="text-slate-400 text-[11px]">รออาจารย์จัดส่ง</span>)}
                        </div>
                      </td>
                    </tr>);
        }))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 2: รายการข้อสอบและกระบวนการจัดพิมพ์ (Exam Work Orders & Printing Pipeline) */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <Badge className="rounded-md border-transparent bg-slate-800 text-white">
                ขั้นตอนที่ 2
              </Badge>
              <h3 className="font-display font-bold text-base text-slate-900">
                {selectedCourseId === 'ALL'
            ? 'รายการข้อสอบและกระบวนการจัดพิมพ์ (ทุกรายวิชา)'
            : `รายการข้อสอบและกระบวนการจัดพิมพ์: ${selectedCourseId} ${selectedSubjectItem?.courseName || ''}`}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {selectedCourseId === 'ALL'
            ? `พบ ${filteredExams.length} รายการข้อสอบที่ต้องดำเนินการ`
            : `อาจารย์ผู้รับผิดชอบ: ${selectedSubjectItem?.teacherName || '-'} • โทร: ${selectedSubjectItem?.teacherTel || '-'}`}
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {selectedCourseId !== 'ALL' && (<Button size="sm" variant="secondary" onClick={() => setSelectedCourseId('ALL')}>
                ดูข้อสอบทุกวิชา
              </Button>)}
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredExams.length === 0 ? (<div className="p-12 text-center text-slate-400 text-xs">
              {selectedCourseId !== 'ALL'
                ? `รายวิชา ${selectedCourseId} ยังไม่มีไฟล์ข้อสอบส่งเข้ามาในระบบ`
                : 'ไม่พบรายการข้อสอบที่ตรงกับการค้นหา'}
            </div>) : (filteredExams.map((exam) => {
            const statusConfig = STATUS_LABELS[exam.status];
            return (<div key={exam.E_No} className="p-6 hover:bg-slate-50/50 transition-colors space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded border border-slate-300">
                          {exam.E_No}
                        </span>
                        <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {exam.Subject_ID}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{exam.Subject_Name}</h4>
                        <Badge className={statusConfig.badgeClass}>{statusConfig.label}</Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 pt-1">
                        <div>
                          <span className="text-slate-400">อาจารย์: </span>
                          <span className="font-medium text-slate-800">{exam.teacher_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">วัน/เวลาสอบ: </span>
                          <span>{exam.E_Date} ({exam.E_Time})</span>
                        </div>
                        <div>
                          <span className="text-slate-400">ห้องสอบ: </span>
                          <span className="font-medium">{exam.room}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">ยอดพิมพ์: </span>
                          <span className="font-bold text-indigo-700">
                            {exam.total_copies} + {exam.copies_reserve} = {exam.total_copies + exam.copies_reserve} ชุด
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                          ไฟล์: {exam.file_name} ({exam.file_size})
                        </span>
                        <span>อัปโหลดเมื่อ: {exam.upload_date}</span>
                        {exam.checked_by && <span>• ตรวจสอบโดย: {exam.checked_by}</span>}
                      </div>

                      {exam.envelope_notes && (<div className="text-[11px] text-amber-900 bg-amber-50/70 p-2 rounded-lg border border-amber-200 mt-1">
                          <strong>คำชี้แจงจากอาจารย์:</strong> {exam.envelope_notes}
                        </div>)}
                    </div>

                    {/* Right action toolbars */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => onPreviewExam(exam)} title="เปิดดูตัวอย่างไฟล์ข้อสอบ">
                        <Eye className="w-3.5 h-3.5 text-indigo-600"/>
                        <span>ตรวจข้อสอบ</span>
                      </Button>

                      <Button variant="outline" size="sm" className="text-indigo-800 border-indigo-200 hover:bg-indigo-50" onClick={() => onOpenEnvelope(exam)} title="พิมพ์ใบปะหน้าซองข้อสอบ">
                        <Printer className="w-3.5 h-3.5 text-indigo-600"/>
                        <span>พิมพ์หน้าซอง</span>
                      </Button>

                      <Button size="sm" className="bg-slate-800 hover:bg-slate-700 text-white" onClick={() => onPrintExam(exam)} title="สั่งพิมพ์ข้อสอบจริงเข้าเครื่องพิมพ์">
                        <Printer className="w-3.5 h-3.5 text-amber-300"/>
                        <span>พิมพ์ข้อสอบ</span>
                      </Button>
                    </div>
                  </div>

                  {/* Production Status Workflow Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 font-semibold">การปรับสถานะ:</span>

                    <div className="flex flex-wrap items-center gap-2">
                      {exam.status === 'SUBMITTED' && (<>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(exam)}>
                            <CheckCheck className="w-3.5 h-3.5"/>
                            <span>อนุมัติผ่านการตรวจสอบ</span>
                          </Button>
                          <Button size="sm" variant="outline" className="text-rose-700 border-rose-200 hover:bg-rose-50" onClick={() => {
                        setRejectingExam(exam);
                        setRejectReason('ขอให้ตรวจสอบเลขหน้าข้อสอบและสูตรที่พิมพ์ไม่ชัดเจน');
                    }}>
                            <RotateCcw className="w-3.5 h-3.5"/>
                            <span>ส่งกลับแก้ไข</span>
                          </Button>
                        </>)}

                      {exam.status === 'VERIFIED' && (<Button size="sm" onClick={() => handleStartPrinting(exam)}>
                          <Printer className="w-3.5 h-3.5"/>
                          <span>เริ่มจัดพิมพ์</span>
                        </Button>)}

                      {exam.status === 'PRINTING' && (<Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleFinishPrinting(exam)}>
                          <CheckCircle className="w-3.5 h-3.5"/>
                          <span>พิมพ์และบรรจุซองเสร็จ</span>
                        </Button>)}

                      {exam.status === 'PRINTED' && (<Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => handleDeliverToOps(exam)}>
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
      </Card>

      {/* Reject Modal */}
      {rejectingExam && (<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-rose-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-300"/>
                <h3 className="font-display font-bold text-sm">ส่งกลับแก้ไขข้อสอบ</h3>
              </div>
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
