/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: OperationsView.jsx
 * หน้าที่ของหน้านี้: หน้างานฝ่ายดำเนินการสอบ 2 หน้าย่อย (แสดงภายใน SidebarShell) —
 *   1. schedule : ตารางรายวิชาจัดสอบ — สถิติ, ค้นหา/กรองสถานะ+วันสอบ,
 *                 รายการข้อสอบพร้อมปุ่มใบปะหน้าซอง และลงทะเบียนรับซอง
 *   2. intake   : รับมอบซองข้อสอบ — เฉพาะรายการที่ส่งมอบแล้ว (DELIVERED_OD)
 *                 รอลงทะเบียนรับเข้าห้องมั่นคง (DELIVERED_OD → READY_FOR_EXAM)
 * ผู้ใช้งาน: เจ้าหน้าที่ฝ่ายดำเนินการสอบ (Operations)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { STATUS_LABELS } from '@/lib/statusLabels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, ShieldCheck, Search, Printer, FileCheck, Inbox, } from 'lucide-react';
export const OperationsView = ({ currentUser, exams, page = 'schedule', onNavigate, onOpenEnvelope, onUpdateExamStatus, }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('ALL');
    const filteredExams = exams.filter((exam) => {
        const matchesSearch = exam.Subject_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.Subject_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.teacher_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || exam.status === statusFilter;
        const matchesDate = dateFilter === 'ALL' || exam.E_Date === dateFilter;
        return matchesSearch && matchesStatus && matchesDate;
    });
    // หน้ารับมอบซอง — เฉพาะรายการที่โสตฯ ส่งมอบมาแล้ว
    const intakeExams = exams.filter((e) => e.status === 'DELIVERED_OD');
    const uniqueDates = Array.from(new Set(exams.map((e) => e.E_Date))).sort();
    const handleConfirmReceipt = (exam) => {
        onUpdateExamStatus(exam.E_No, 'READY_FOR_EXAM', `ฝ่ายดำเนินการสอบ (${currentUser.name}) รับมอบซองข้อสอบและจัดเก็บในตู้นิรภัยเรียบร้อย`);
    };
    // แถวข้อสอบ (ใช้ร่วมทั้ง 2 หน้า)
    const renderExamRow = (exam) => {
        const statusConfig = STATUS_LABELS[exam.status];
        const isReady = exam.status === 'READY_FOR_EXAM';
        const canConfirmReceipt = exam.status === 'DELIVERED_OD';
        return (<div key={exam.E_No} className="p-6 hover:bg-slate-50/50 transition-colors space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold bg-[#1A4B7A]/10 text-[#1A4B7A] px-2.5 py-0.5 rounded-md border border-[#1A4B7A]/20">
                    {exam.Subject_ID}
                  </span>
                  <h4 className="text-base font-bold text-slate-900">{exam.Subject_Name}</h4>
                  <Badge className={statusConfig.badgeClass}>{statusConfig.label}</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400"/>
                    <span>{exam.E_Date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400"/>
                    <span>{exam.E_Time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#1A4B7A]"/>
                    <span className="font-semibold text-slate-900">{exam.room}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">ยอดที่ต้องแจก: </span>
                    <span className="font-bold text-slate-900">{exam.total_copies} ชุด</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span>อาจารย์ผู้สอน: <strong>{exam.teacher_name}</strong> ({exam.teacher_tel})</span>
                  {exam.proctors && (<span>
                      • กรรมการคุมสอบ: {exam.proctors.join(', ')}
                    </span>)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button onClick={() => onOpenEnvelope(exam)} variant="outline" size="sm" className="px-3.5 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700" title="ดูและสั่งพิมพ์ใบปะหน้าซองข้อสอบ">
                  <Printer className="w-3.5 h-3.5 text-[#1A4B7A]"/>
                  <span>ใบปะหน้าซอง</span>
                </Button>

                {canConfirmReceipt && (<Button onClick={() => handleConfirmReceipt(exam)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <FileCheck className="w-4 h-4"/>
                    <span>ลงทะเบียนรับซอง</span>
                  </Button>)}

                {isReady && (<Badge variant="success" className="px-3 py-1.5 text-xs gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600"/>
                    <span>พร้อมแจกสอบ</span>
                  </Badge>)}
              </div>
            </div>
          </div>);
    };
    // ───────── หน้า 1: ตารางรายวิชาจัดสอบ ─────────
    const renderSchedulePage = () => (<>
      {/* Hero */}
      <div>
        <span className="inline-block text-[11px] font-bold tracking-[0.18em] text-[#1A4B7A] bg-[#1A4B7A]/10 rounded-md px-2.5 py-1">
          SCIENCE · EXAM OPERATIONS
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
          ตารางรายวิชาจัดสอบ
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          สวัสดี {currentUser.name} — ติดตามความพร้อมของข้อสอบและลงทะเบียนรับมอบซองเข้าจัดเก็บ
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
            { label: 'รายวิชาจัดสอบทั้งหมด', value: exams.length },
            { label: 'ส่งมอบแล้ว รอลงทะเบียน', value: exams.filter((e) => e.status === 'DELIVERED_OD').length },
            { label: 'พร้อมสอบ', value: exams.filter((e) => e.status === 'READY_FOR_EXAM').length },
            { label: 'อยู่ระหว่างจัดพิมพ์', value: exams.filter((e) => e.status === 'PRINTING').length },
        ].map((stat) => (<div key={stat.label} className="rounded-xl bg-white border border-slate-200/80 px-5 py-4">
              <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>))}
      </div>

      {/* Search & Filter */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
          <Input type="text" placeholder="ค้นหารหัสวิชา ชื่อวิชา ห้องสอบ หรืออาจารย์" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9"/>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Label className="text-slate-600">สถานะ:</Label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
            <option value="ALL">ทุกสถานะ</option>
            <option value="READY_FOR_EXAM">พร้อมสอบ</option>
            <option value="DELIVERED_OD">ส่งมอบแล้ว รอลงทะเบียน</option>
            <option value="PRINTED">พิมพ์และบรรจุซองแล้ว</option>
            <option value="PRINTING">กำลังจัดพิมพ์</option>
            <option value="SUBMITTED">รอโสตฯ ตรวจสอบ</option>
          </Select>

          <Label className="text-slate-600 ml-2">วันที่สอบ:</Label>
          <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto">
            <option value="ALL">ทุกวันสอบ</option>
            {uniqueDates.map((date) => (<option key={date} value={date}>
                {date}
              </option>))}
          </Select>
        </div>
      </div>

      {/* รายการข้อสอบ */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">
              ความพร้อมของรายวิชาจัดสอบ
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ห้องสอบ จำนวนนักศึกษา และสถานะการรับมอบซองข้อสอบ
            </p>
          </div>
          <Button onClick={() => window.print()} variant="outline" size="sm" className="no-print shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
            <Printer className="w-3.5 h-3.5"/>
            <span>พิมพ์รายงานตารางสอบ</span>
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredExams.length === 0 ? (<div className="p-12 text-center text-slate-400 text-xs">
              ไม่พบรายวิชาจัดสอบตามเงื่อนไขที่เลือก
            </div>) : (filteredExams.map((exam) => renderExamRow(exam)))}
        </div>
      </div>
    </>);
    // ───────── หน้า 2: รับมอบซองข้อสอบ ─────────
    const renderIntakePage = () => (<>
      {/* Hero */}
      <div>
        <span className="inline-block text-[11px] font-bold tracking-[0.18em] text-[#1A4B7A] bg-[#1A4B7A]/10 rounded-md px-2.5 py-1">
          SCIENCE · EXAM OPERATIONS
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
          รับมอบซองข้อสอบ
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          รายการซองข้อสอบที่ฝ่ายโสตฯ ส่งมอบแล้ว — ตรวจนับและลงทะเบียนรับเข้าจัดเก็บ
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <h3 className="font-display font-bold text-base text-slate-900">
            รอลงทะเบียนรับมอบ <span className="text-slate-400 font-normal">({intakeExams.length})</span>
          </h3>
          <Badge className="bg-amber-50 text-amber-800 border-amber-300">
            รอดำเนินการ {intakeExams.length} รายการ
          </Badge>
        </div>

        <div className="divide-y divide-slate-100">
          {intakeExams.length === 0 ? (<div className="p-12 text-center">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
              <p className="text-sm text-slate-500">ไม่มีซองข้อสอบรอรับมอบในขณะนี้</p>
              <p className="text-xs text-slate-400 mt-1">
                เมื่อฝ่ายโสตฯ ส่งมอบซองข้อสอบ รายการจะแสดงที่นี่ให้ลงทะเบียนรับ
              </p>
              <Button size="sm" variant="outline" onClick={() => onNavigate?.('schedule')} className="mt-4 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
                ดูตารางจัดสอบทั้งหมด
              </Button>
            </div>) : (intakeExams.map((exam) => renderExamRow(exam)))}
        </div>
      </div>
    </>);
    return (<div className="max-w-6xl mx-auto space-y-6">
      {page === 'intake' ? renderIntakePage() : renderSchedulePage()}
    </div>);
};
