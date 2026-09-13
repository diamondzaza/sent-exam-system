import React, { useState } from 'react';
import { CourseEntity, ExamEntity } from '../types.ts';
import { INITIAL_TEACHERS } from '../mockData.ts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  UploadCloud,
  X,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

interface ExamUploadModalProps {
  course: CourseEntity;
  existingExam?: ExamEntity | null;
  isReupload?: boolean;
  onClose: () => void;
  onSubmitExam: (examData: Partial<ExamEntity>, isReupload: boolean) => void;
}

export const ExamUploadModal: React.FC<ExamUploadModalProps> = ({
  course,
  existingExam,
  isReupload = false,
  onClose,
  onSubmitExam,
}) => {
  const [examType, setExamType] = useState<'กลางภาค' | 'ปลายภาค' | 'สอบแก้ตัว'>(
    existingExam?.exam_type || 'กลางภาค'
  );
  const [examDate, setExamDate] = useState(existingExam?.E_Date || '2026-10-20');
  const [examTime, setExamTime] = useState(existingExam?.E_Time || '09:00 - 12:00 น.');
  const [room, setRoom] = useState(existingExam?.room || 'SC-401 (ห้องบรรยายใหญ่)');
  const [totalPages, setTotalPages] = useState<number>(existingExam?.total_pages || 8);
  const [totalCopies, setTotalCopies] = useState<number>(existingExam?.total_copies || course.student_count);
  const [copiesReserve, setCopiesReserve] = useState<number>(existingExam?.copies_reserve ?? 5);
  const [envelopeNotes, setEnvelopeNotes] = useState(
    existingExam?.envelope_notes || 'ข้อสอบแบ่งเป็น 2 ตอน ให้นักศึกษาทำลงในกระดาษคำถาม'
  );

  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(
    existingExam?.allowed_materials || ['เครื่องคิดเลขวิทยาศาสตร์', 'ปากกาน้ำเงิน/ดำ', 'ดินสอ 2B']
  );
  const [newMaterialInput, setNewMaterialInput] = useState('');

  // File upload state — start empty on a new upload so the required-file
  // check actually runs; only seed from an existing exam on re-upload.
  const [fileName, setFileName] = useState<string>(existingExam?.file_name || '');
  const [fileSize, setFileSize] = useState<string>(existingExam?.file_size || '');
  const [isDragging, setIsDragging] = useState(false);
  const [fileUploaded, setFileUploaded] = useState<boolean>(Boolean(existingExam?.file_name));
  const [securityAgreed, setSecurityAgreed] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const commonMaterials = [
    'เครื่องคิดเลขวิทยาศาสตร์',
    'กระดาษสรุป (Cheat Sheet) 1 แผ่น',
    'พจนานุกรม/ดิกชันนารี',
    'ตารางธาตุและค่าคงที่',
    'ดินสอ 2B และยางลบ',
    'ปากกาลูกลื่น น้ำเงิน/ดำ',
  ];

  const toggleMaterial = (mat: string) => {
    if (selectedMaterials.includes(mat)) {
      setSelectedMaterials(selectedMaterials.filter((m) => m !== mat));
    } else {
      setSelectedMaterials([...selectedMaterials, mat]);
    }
  };

  const handleAddCustomMaterial = () => {
    if (newMaterialInput.trim() && !selectedMaterials.includes(newMaterialInput.trim())) {
      setSelectedMaterials([...selectedMaterials, newMaterialInput.trim()]);
      setNewMaterialInput('');
    }
  };

  const acceptFile = (file: File) => {
    if (!/\.(pdf|docx?)$/i.test(file.name) || file.size > 25 * 1024 * 1024) {
      setErrorMsg('รองรับเฉพาะไฟล์ PDF หรือ DOCX ขนาดไม่เกิน 25MB');
      return;
    }
    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    setFileUploaded(true);
    setErrorMsg('');
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      acceptFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      acceptFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUploaded || !fileName) {
      setErrorMsg('กรุณาเลือกไฟล์ข้อสอบก่อนส่ง');
      return;
    }
    if (!securityAgreed) {
      setErrorMsg('กรุณายืนยันข้อกำหนดด้านความลับของข้อสอบ');
      return;
    }

    const payload: Partial<ExamEntity> = {
      E_No: existingExam?.E_No || `EX-${course.Course_year}-${Math.floor(100 + Math.random() * 900)}`,
      Subject_ID: course.Course_id,
      Subject_Name: course.Course_Name,
      Course_year: course.Course_year,
      term: course.term,
      teacher_id: course.teacher_id,
      teacher_name: course.teacher_name,
      teacher_tel: INITIAL_TEACHERS.find((t) => t.T_ID === course.teacher_id)?.T_Tel || '',
      exam_type: examType,
      E_Date: examDate,
      E_Time: examTime,
      room: room,
      total_pages: Number(totalPages),
      total_copies: Number(totalCopies),
      copies_reserve: Number(copiesReserve),
      status: 'SUBMITTED',
      file_name: fileName,
      file_size: fileSize,
      upload_date: new Date().toLocaleString('th-TH'),
      envelope_notes: envelopeNotes,
      allowed_materials: selectedMaterials,
      proctors: [course.teacher_name, 'กรรมการคุมสอบร่วมประจำห้อง'],
    };

    onSubmitExam(payload, isReupload);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base">
                {isReupload ? 'อัปโหลดข้อสอบฉบับใหม่' : 'จัดส่งข้อสอบเข้าสู่ระบบ'}
              </h3>
              <p className="text-xs text-slate-400">
                {course.Course_id} · {course.Course_Name} · ภาคการศึกษา {course.term}/{course.Course_year}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isReupload && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">การอัปโหลดไฟล์ใหม่จะแทนที่ฉบับเดิม</p>
                <p className="text-amber-800 mt-0.5">
                  ระบบจะปรับสถานะเป็น รอโสตฯ ตรวจสอบ และบันทึกประวัติการแทนที่ไฟล์โดยอัตโนมัติ
                </p>
              </div>
            </div>
          )}

          {/* Drag & Drop File Upload Area */}
          <div>
            <Label htmlFor="exam-file" className="text-slate-800 mb-1.5">
              ไฟล์ข้อสอบต้นฉบับ (PDF หรือ DOCX) <span className="text-rose-500">*</span>
            </Label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : fileUploaded
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              {fileUploaded && fileName ? (
                <div className="flex items-center justify-between bg-white border border-emerald-300 p-3 rounded-lg shadow-2xs">
                  <div className="flex items-center space-x-3 text-left">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-slate-900">{fileName}</p>
                      <p className="text-[11px] text-slate-500">ขนาด {fileSize} · พร้อมจัดส่ง</p>
                    </div>
                  </div>
                  <label className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer underline px-2">
                    เปลี่ยนไฟล์
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileInput} className="hidden" />
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="text-xs text-slate-600">
                    <label className="font-semibold text-indigo-600 hover:underline cursor-pointer">
                      คลิกเพื่อเลือกไฟล์
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileInput} className="hidden" />
                    </label>{' '}
                    หรือลากไฟล์มาวางที่นี่
                  </div>
                  <p className="text-[11px] text-slate-400">รองรับ PDF, Word (.docx) ขนาดสูงสุด 25MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Exam Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <Label htmlFor="exam-type" className="text-slate-700 mb-1">ประเภทการจัดสอบ</Label>
              <Select
                id="exam-type"
                value={examType}
                onChange={(e) => setExamType(e.target.value as any)}
              >
                <option value="กลางภาค">สอบกลางภาค</option>
                <option value="ปลายภาค">สอบปลายภาค</option>
                <option value="สอบแก้ตัว">สอบแก้ตัว / ประมวลความรู้</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="exam-date" className="text-slate-700 mb-1">วันที่จัดสอบ</Label>
              <Input
                id="exam-date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="exam-time" className="text-slate-700 mb-1">เวลาจัดสอบ</Label>
              <Input
                id="exam-time"
                type="text"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                placeholder="เช่น 09:00 - 12:00 น."
              />
            </div>

            <div>
              <Label htmlFor="exam-room" className="text-slate-700 mb-1">ห้องสอบที่จัด</Label>
              <Input
                id="exam-room"
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="เช่น SC-401, SC-LAB-3"
              />
            </div>

            <div>
              <Label htmlFor="exam-pages" className="text-slate-700 mb-1">จำนวนหน้าข้อสอบ (หน้า)</Label>
              <Input
                id="exam-pages"
                type="number"
                min="1"
                max="50"
                value={totalPages}
                onChange={(e) => setTotalPages(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="exam-copies" className="text-slate-700 mb-1">จำนวนชุดที่พิมพ์</Label>
                <Input
                  id="exam-copies"
                  type="number"
                  min="1"
                  value={totalCopies}
                  onChange={(e) => setTotalCopies(parseInt(e.target.value) || 1)}
                  className="px-2.5"
                />
              </div>
              <div>
                <Label htmlFor="exam-reserve" className="text-slate-700 mb-1">ชุดสำรอง</Label>
                <Input
                  id="exam-reserve"
                  type="number"
                  min="0"
                  max="20"
                  value={copiesReserve}
                  onChange={(e) => setCopiesReserve(parseInt(e.target.value) || 0)}
                  className="px-2.5"
                />
              </div>
            </div>
          </div>

          {/* Allowed Materials for Envelope Cover */}
          <div>
            <Label className="text-slate-800 mb-2">
              สิ่งที่อนุญาตให้นำเข้าห้องสอบ (ปรากฏบนใบปะหน้าซองข้อสอบ)
            </Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {commonMaterials.map((mat) => {
                const isSelected = selectedMaterials.includes(mat);
                return (
                  <button
                    type="button"
                    key={mat}
                    onClick={() => toggleMaterial(mat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {mat}
                  </button>
                );
              })}
            </div>

            {/* Custom material input */}
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="ระบุสิ่งที่อนุญาตเพิ่มเติม"
                value={newMaterialInput}
                onChange={(e) => setNewMaterialInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomMaterial();
                  }
                }}
                className="flex-1 py-1.5"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddCustomMaterial}>
                เพิ่ม
              </Button>
            </div>
          </div>

          {/* Envelope & Proctor Notes */}
          <div>
            <Label htmlFor="exam-notes" className="text-slate-800 mb-1">
              คำชี้แจงสำหรับกรรมการคุมสอบ / เจ้าหน้าที่หน่วยโสตฯ
            </Label>
            <Textarea
              id="exam-notes"
              rows={2}
              value={envelopeNotes}
              onChange={(e) => setEnvelopeNotes(e.target.value)}
              placeholder="ระบุคำสั่งพิเศษ เช่น ให้เย็บมุมบนซ้าย, ห้ามเปิดซองก่อน 10 นาที, แจกกระดาษคำตอบแผ่นคู่"
            />
          </div>

          {/* Security & Non-Leakage Agreement */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start space-x-2.5">
              <input
                type="checkbox"
                id="security-agree"
                checked={securityAgreed}
                onChange={(e) => setSecurityAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="security-agree" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
                ข้าพเจ้ารับรองว่าไฟล์นี้เป็นข้อสอบฉบับจริง และยินยอมให้ระบบใส่ลายน้ำดิจิทัลพร้อมบันทึกประวัติการเข้าถึง เพื่อป้องกันข้อสอบรั่วไหล
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit">
              <UploadCloud className="w-4 h-4" />
              <span>{isReupload ? 'ยืนยันอัปโหลดฉบับใหม่' : 'ยืนยันส่งข้อสอบ'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
