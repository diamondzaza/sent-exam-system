/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: OperationsView.jsx
 * หน้าที่ของหน้านี้: หน้างานสำหรับฝ่ายดำเนินการสอบ — การ์ด KPI (ข้อสอบทั้งหมด /
 *   รอรับมอบ / พร้อมสอบ / กำลังพิมพ์), ค้นหา + กรองตามสถานะและวันสอบ,
 *   ตารางแสดงห้องสอบ เวลา และผู้คุมสอบ, ปุ่มรับมอบซองเข้าห้องมั่นคง
 *   (DELIVERED_OD → READY_FOR_EXAM), พิมพ์ใบปะหน้า และพิมพ์รายงานรวม (window.print)
 * ผู้ใช้งาน: เจ้าหน้าที่ฝ่ายดำเนินการสอบ (Operations)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { STATUS_LABELS } from '@/lib/statusLabels';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, ShieldCheck, Search, Printer, FileCheck, } from 'lucide-react';
export const OperationsView = ({ currentUser, exams, onOpenEnvelope, onUpdateExamStatus, }) => {
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
    const uniqueDates = Array.from(new Set(exams.map((e) => e.E_Date))).sort();
    const handleConfirmReceipt = (exam) => {
        onUpdateExamStatus(exam.E_No, 'READY_FOR_EXAM', `ฝ่ายดำเนินการสอบ (${currentUser.name}) รับมอบซองข้อสอบและจัดเก็บในตู้นิรภัยห้องมั่นคงเรียบร้อย`);
    };
    return (<div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium">
                ฝ่ายดำเนินการสอบ
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display">
              ศูนย์อำนวยการและติดตามรายวิชาจัดสอบ
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              เจ้าหน้าที่: {currentUser.name} • {currentUser.location || 'ศูนย์อำนวยการสอบ ชั้น 1'}
              <br />
              ตรวจสอบความพร้อมของข้อสอบ ลงทะเบียนรับมอบซองข้อสอบ และจัดสรรกรรมการคุมสอบ
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">รายวิชาจัดสอบทั้งหมด</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{exams.length} วิชา</p>
        </Card>

        <Card className="p-4 border-teal-200 bg-teal-50/20">
          <p className="text-xs text-teal-800 font-medium">ส่งมอบแล้ว (รอลงทะเบียน)</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">
            {exams.filter((e) => e.status === 'DELIVERED_OD').length} วิชา
          </p>
        </Card>

        <Card className="p-4 border-emerald-200 bg-emerald-50/20">
          <p className="text-xs text-emerald-800 font-medium">พร้อมสอบในห้องมั่นคง</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {exams.filter((e) => e.status === 'READY_FOR_EXAM').length} วิชา
          </p>
        </Card>

        <Card className="p-4 border-amber-200 bg-amber-50/20">
          <p className="text-xs text-amber-800 font-medium">อยู่ระหว่างการจัดพิมพ์</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {exams.filter((e) => e.status === 'PRINTING').length} วิชา
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
          <Input type="text" placeholder="ค้นหารหัสวิชา, ชื่อวิชา, ห้องสอบ, อาจารย์..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9"/>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Label className="text-slate-600">สถานะ:</Label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
            <option value="ALL">ทุกสถานะการจัดสอบ</option>
            <option value="READY_FOR_EXAM">พร้อมสอบ (ในห้องมั่นคง)</option>
            <option value="DELIVERED_OD">ส่งมอบแล้ว (รอลงทะเบียน)</option>
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
      </Card>

      {/* Main Exam Schedule List */}
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-200 bg-slate-50/60 rounded-b-none">
          <div className="space-y-1.5">
            <CardTitle className="text-base text-slate-900 font-display">
              ตารางติดตามความพร้อมของรายวิชาจัดสอบ
            </CardTitle>
            <CardDescription>
              แสดงรายละเอียดห้องสอบ จำนวนนักศึกษา และสถานะการรับมอบซองข้อสอบ
            </CardDescription>
          </div>
          <Button onClick={() => window.print()} variant="secondary" size="sm" className="no-print shrink-0 border border-slate-300">
            <Printer className="w-3.5 h-3.5"/>
            <span>พิมพ์รายงานตารางสอบ</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {filteredExams.length === 0 ? (<div className="p-12 text-center text-slate-400 text-xs">
                ไม่พบรายวิชาจัดสอบตามเงื่อนไขที่เลือก
              </div>) : (filteredExams.map((exam) => {
            const statusConfig = STATUS_LABELS[exam.status];
            const isReady = exam.status === 'READY_FOR_EXAM';
            const canConfirmReceipt = exam.status === 'DELIVERED_OD';
            return (<div key={exam.E_No} className="p-6 hover:bg-slate-50/50 transition-colors space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded border border-amber-200">
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
                            <MapPin className="w-3.5 h-3.5 text-indigo-600"/>
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

                      <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={() => onOpenEnvelope(exam)} variant="outline" size="sm" className="px-3.5 rounded-xl" title="ดูและสั่งพิมพ์ใบปะหน้าซองข้อสอบ">
                          <Printer className="w-3.5 h-3.5 text-indigo-600"/>
                          <span>ใบปะหน้าซอง</span>
                        </Button>

                        {canConfirmReceipt && (<Button onClick={() => handleConfirmReceipt(exam)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                            <FileCheck className="w-4 h-4"/>
                            <span>ลงทะเบียนรับซองเข้าห้องมั่นคง</span>
                          </Button>)}

                        {isReady && (<Badge variant="success" className="px-3 py-1.5 rounded-xl text-xs gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600"/>
                            <span>อยู่ในตู้นิรภัยห้องมั่นคง พร้อมแจกสอบ</span>
                          </Badge>)}
                      </div>
                    </div>
                  </div>);
        }))}
          </div>
        </CardContent>
      </Card>
    </div>);
};
