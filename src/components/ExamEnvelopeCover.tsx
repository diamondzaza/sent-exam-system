import React from 'react';
import { ExamEntity } from '../types/entities';
import { Printer, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExamEnvelopeCoverProps {
  exam: ExamEntity;
  onClose: () => void;
  onPrintRecorded?: () => void;
}

export const ExamEnvelopeCover: React.FC<ExamEnvelopeCoverProps> = ({
  exam,
  onClose,
  onPrintRecorded,
}) => {
  const handlePrint = () => {
    if (onPrintRecorded) {
      onPrintRecorded();
    }
    // Isolate the envelope sheet in the printout instead of the whole dashboard
    document.body.classList.add('printing-envelope');
    window.print();
    document.body.classList.remove('printing-envelope');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Control bar (hidden during print) */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        <div className="no-print bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base">ใบปะหน้าซองข้อสอบ</h3>
              <p className="text-xs text-slate-400">
                รหัสการจัดสอบ: {exam.E_No} • {exam.Subject_ID} {exam.Subject_Name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button id="print-envelope-btn" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบปะหน้า</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Printable Envelope Area */}
        <div className="p-8 md:p-12 overflow-y-auto bg-white text-slate-900" id="printable-envelope">
          {/* Formal Envelope Header */}
          <div className="border-4 border-black p-6 relative">
            {/* Top Seal Stamp */}
            <div className="absolute top-4 right-4 border-2 border-red-700 text-red-700 font-bold px-3 py-1 text-xs tracking-wider uppercase rotate-[-3deg] bg-red-50">
              เอกสารลับทางการสอบ (CONFIDENTIAL)
            </div>

            <div className="text-center pb-4 border-b-2 border-black">
              <div className="w-14 h-14 mx-auto mb-2 border-2 border-slate-900 rounded-full flex items-center justify-center font-bold text-xs bg-slate-100">
                SCI-LOGO
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950">
                คณะวิทยาศาสตร์
              </h1>
              <h2 className="font-display text-xl font-semibold text-slate-900 mt-1">
                ใบปะหน้าซองข้อสอบ (EXAMINATION ENVELOPE)
              </h2>
              <p className="text-sm font-medium text-slate-700 mt-1">
                การสอบประจำภาคการศึกษาที่ {exam.term} ปีการศึกษา {exam.Course_year} ({exam.exam_type})
              </p>
            </div>

            {/* Exam Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 py-5 text-sm border-b-2 border-black">
              <div>
                <span className="font-bold text-slate-900">รหัสการจัดสอบ:</span>{' '}
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-semibold">{exam.E_No}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">วันที่จัดสอบ:</span>{' '}
                <span className="font-semibold underline decoration-dotted">{exam.E_Date}</span>
              </div>

              <div>
                <span className="font-bold text-slate-900">รหัสวิชา:</span>{' '}
                <span className="font-mono text-base font-bold text-indigo-950">{exam.Subject_ID}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">เวลาจัดสอบ:</span>{' '}
                <span className="font-semibold">{exam.E_Time}</span>
              </div>

              <div className="md:col-span-2">
                <span className="font-bold text-slate-900">ชื่อรายวิชา:</span>{' '}
                <span className="text-base font-semibold">{exam.Subject_Name}</span>
              </div>

              <div>
                <span className="font-bold text-slate-900">อาจารย์ผู้ออกข้อสอบ:</span>{' '}
                <span>{exam.teacher_name}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">เบอร์โทรติดต่อฉุกเฉิน:</span>{' '}
                <span className="font-mono font-semibold">{exam.teacher_tel}</span>
              </div>

              <div>
                <span className="font-bold text-slate-900">อาคารและห้องสอบ:</span>{' '}
                <span className="font-bold text-indigo-900 underline">{exam.room}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">จำนวนหน้าข้อสอบ:</span>{' '}
                <span>{exam.total_pages} หน้า (ตรวจนับก่อนแจก)</span>
              </div>
            </div>

            {/* Copies & Counts Section */}
            <div className="bg-slate-50 border-2 border-black my-4 p-4 rounded-xs">
              <h3 className="font-display font-bold text-sm text-slate-900 mb-2 underline">
                ข้อมูลการจัดพิมพ์และบรรจุซอง (หน่วยเทคโนโลยีการศึกษา)
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="border border-slate-400 p-2 bg-white rounded">
                  <div className="text-xs text-slate-500">จำนวน นศ. ตามทะเบียน</div>
                  <div className="text-xl font-extrabold text-slate-900">{exam.total_copies} ชุด</div>
                </div>
                <div className="border border-slate-400 p-2 bg-white rounded">
                  <div className="text-xs text-slate-500">จำนวนชุดสำรอง</div>
                  <div className="text-xl font-extrabold text-slate-900">+{exam.copies_reserve} ชุด</div>
                </div>
                <div className="border-2 border-indigo-600 p-2 bg-indigo-50/50 rounded">
                  <div className="text-xs font-semibold text-indigo-900">รวมบรรจุในซองนี้ทั้งสิ้น</div>
                  <div className="text-2xl font-black text-indigo-700">
                    {exam.total_copies + exam.copies_reserve} ชุด
                  </div>
                </div>
              </div>
            </div>

            {/* Allowed Materials & Proctors notes */}
            <div className="border-b-2 border-black pb-4 mb-4 text-sm">
              <div className="font-bold text-slate-950 mb-1 flex items-center space-x-1">
                <span>อุปกรณ์ / สิ่งที่อนุญาตให้นำเข้าห้องสอบ:</span>
              </div>
              <div className="bg-amber-50/70 border border-amber-300 p-2.5 rounded text-slate-800 text-xs leading-relaxed">
                {exam.allowed_materials && exam.allowed_materials.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {exam.allowed_materials.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1 bg-white border border-amber-400 px-2 py-0.5 rounded font-medium"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span>- ไม่อนุญาตให้นำอุปกรณ์ใดๆ เข้าห้องสอบ นอกจากเครื่องเขียนมาตรฐาน -</span>
                )}
                {exam.envelope_notes && (
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <span className="font-semibold text-slate-900">หมายเหตุเพิ่มเติม: </span>
                    <span>{exam.envelope_notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signature Handover Matrix */}
            <div className="text-xs mt-2">
              <h4 className="font-display font-bold text-slate-900 mb-2 uppercase tracking-wide">
                บันทึกการส่งมอบและลงนามรับ-ส่งซองข้อสอบ
              </h4>
              <div className="border border-black divide-y divide-black text-[11px]">
                {/* Step 1: โสตฯ ส่งมอบ */}
                <div className="grid grid-cols-4 p-2 gap-2 items-center bg-slate-50">
                  <div className="font-semibold col-span-1">1. ผู้บรรจุซองและส่งมอบ (ฝ่ายโสตฯ):</div>
                  <div>ลงชื่อ........................................................</div>
                  <div>({exam.checked_by || 'นายกิตติศักดิ์ ช่างพิมพ์'})</div>
                  <div>วันที่......./......./....... เวลา............... น.</div>
                </div>

                {/* Step 2: ฝ่ายดำเนินการรับมอบ */}
                <div className="grid grid-cols-4 p-2 gap-2 items-center">
                  <div className="font-semibold col-span-1">2. ผู้รับมอบซอง (ฝ่ายดำเนินการสอบ):</div>
                  <div>ลงชื่อ........................................................</div>
                  <div>(นางสาวธนภรณ์ อำนวยการ)</div>
                  <div>วันที่......./......./....... เวลา............... น.</div>
                </div>

                {/* Step 3: กรรมการคุมสอบเบิกข้อสอบ */}
                <div className="grid grid-cols-4 p-2 gap-2 items-center bg-slate-50">
                  <div className="font-semibold col-span-1">3. กรรมการคุมสอบ ผู้เบิกไปห้องสอบ:</div>
                  <div>ลงชื่อ........................................................</div>
                  <div>(......................................................)</div>
                  <div>วันที่......./......./....... เวลา............... น.</div>
                </div>

                {/* Step 4: ส่งคืนหลังสอบเสร็จ */}
                <div className="grid grid-cols-4 p-2 gap-2 items-center">
                  <div className="font-semibold col-span-1">4. กรรมการคุมสอบ ผู้ส่งคืนกระดาษคำตอบ:</div>
                  <div>ลงชื่อ........................................................</div>
                  <div>(......................................................)</div>
                  <div>ตรวจนับแล้วครบ.............. ซอง / ............. ฉบับ</div>
                </div>
              </div>
            </div>

            {/* Bottom Warning Note */}
            <div className="mt-4 pt-2 border-t border-slate-300 text-[10px] text-slate-500 flex items-center justify-between">
              <div className="flex items-center space-x-1 text-red-600 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>คำเตือน: ห้ามฉีกหรือแกะสติกเกอร์ผนึกปากซองก่อนเวลาสอบ 10 นาที</span>
              </div>
              <div>พิมพ์โดยระบบบริหารจัดการข้อสอบ คณะวิทยาศาสตร์</div>
            </div>
          </div>
        </div>

        {/* Footer controls (no-print) */}
        <div className="no-print bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">จัดรูปแบบสำหรับกระดาษ A4 ขนาดหน้าซองข้อสอบของคณะ</p>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              ปิด
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบปะหน้าซอง</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
