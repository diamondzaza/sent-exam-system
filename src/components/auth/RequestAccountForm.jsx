/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: RequestAccountForm.jsx
 * หน้าที่ของหน้านี้: ฟอร์มยื่นคำขอเปิดบัญชี — กรอกข้อมูลแล้วส่งเข้า
 *   POST /api/account-requests (สาธารณะ) แสดงผลสำเร็จเป็นหน้าขอบคุณ
 *   ธีมเดียวกับทั้งระบบ (#1A4B7A) — เลย์เอาต์ฟอร์มซ้าย + คำแนะนำขวา
 *   เหมือนหน้า "เพิ่มรายวิชา"; ข้อมูลติดต่อเพิ่มเติม (LINE ID ฯลฯ) แนบ
 *   รวมเข้าช่องเหตุผลอัตโนมัติ (API รับ field เดิม)
 * ผู้ใช้งาน: ผู้ที่ยังไม่มีบัญชีในระบบ
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { UserPlus, CheckCircle2, AlertCircle, ArrowLeft, Info, Mail, Phone, MessageCircle, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

export function RequestAccountForm() {
    const [form, setForm] = useState({
        username: '', name: '', email: '', tel: '',
        department: '', reason: '', lineId: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // ข้อมูลติดต่อเพิ่มเติม (LINE ID) — แนบรวมเข้าช่องเหตุผล (API รับ field เดิม)
            const extraContact = form.lineId.trim() ? ` [ช่องทางติดต่อเพิ่มเติม: LINE ${form.lineId.trim()}]` : '';
            const res = await fetch('/api/account-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, reason: `${form.reason.trim()}${extraContact}` }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setError(err.error || 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่');
                return;
            }
            setSent(true);
        }
        catch {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
        }
        finally {
            setLoading(false);
        }
    };

    return (<div className="min-h-screen bg-[#F2F5F8] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* การ์ดรวม: header แบรนด์ + เนื้อหา 2 คอลัมน์ */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#1A4B7A] text-white px-6 sm:px-8 py-5">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center font-display font-bold text-sm ring-1 ring-white/25 shrink-0">
                SCI
              </div>
              <div>
                <h1 className="font-display text-lg font-bold">ขอสมัครบัญชีใช้งานระบบ</h1>
                <p className="text-xs text-white/70 mt-0.5">
                  ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ คณะวิทยาศาสตร์
                </p>
              </div>
            </div>
          </div>

          {sent ? (<div className="p-10 text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto"/>
              <div>
                <p className="font-display font-bold text-lg text-slate-900">ส่งคำขอเรียบร้อยแล้ว</p>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  คำขอของคุณถูกส่งถึงผู้ดูแลระบบแล้ว<br/>
                  เมื่อได้รับอนุมัติ ผู้ดูแลระบบจะแจ้งชื่อผู้ใช้และรหัสผ่านเริ่มต้นให้ท่านโดยตรง
                </p>
              </div>
              <a href="/" className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#1A4B7A] hover:text-[#153D63]">
                <ArrowLeft className="w-3.5 h-3.5"/>
                <span>กลับไปหน้าเข้าสู่ระบบ</span>
              </a>
            </div>) : (<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 sm:p-8">
            {/* ฟอร์ม */}
            <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4 text-sm">
              {error && (<div className="flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
                  <span className="leading-relaxed">{error}</span>
                </div>)}

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-amber-900 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600"/>
                <span className="text-xs leading-relaxed">
                  บัญชีใช้งานต้องได้รับอนุมัติจากผู้ดูแลระบบก่อน — กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5">ชื่อผู้ใช้งาน (Username) <span className="text-rose-500">*</span></Label>
                  <Input value={form.username} onChange={set('username')} placeholder="ชื่อผู้ใช้ภาษาอังกฤษ ไม่มีช่องว่าง" required/>
                </div>
                <div>
                  <Label className="mb-1.5">ชื่อ-นามสกุล <span className="text-rose-500">*</span></Label>
                  <Input value={form.name} onChange={set('name')} placeholder="ชื่อ-นามสกุลพร้อมคำนำหน้า" required/>
                </div>
              </div>

              {/* ข้อมูลติดต่อ */}
              <div>
                <p className="font-display font-bold text-sm text-slate-900 mb-2.5">ข้อมูลติดต่อ</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="req-email" className="mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500"/>
                      <span>อีเมล (ใช้เป็นบัญชีล็อกอิน) <span className="text-rose-500">*</span></span>
                    </Label>
                    <Input id="req-email" type="email" value={form.email} onChange={set('email')} placeholder="อีเมลที่ใช้ติดต่อได้จริง" required/>
                  </div>
                  <div>
                    <Label htmlFor="req-tel" className="mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500"/>
                      <span>เบอร์โทรศัพท์</span>
                    </Label>
                    <Input id="req-tel" value={form.tel} onChange={set('tel')} placeholder="เบอร์โทรที่ติดต่อได้จริง"/>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="req-line" className="mb-1.5 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-slate-500"/>
                      <span>ช่องทางติดต่อเพิ่มเติม (เช่น LINE ID)</span>
                    </Label>
                    <Input id="req-line" value={form.lineId} onChange={set('lineId')} placeholder="LINE ID ของท่าน (ถ้ามี)"/>
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-1.5">สังกัด / ประเภทผู้ใช้งาน</Label>
                <Select value={form.department} onChange={set('department')}>
                  <option value="">— เลือกสังกัด —</option>
                  <option>อาจารย์ผู้สอน (สาขาวิชาต่างๆ)</option>
                  <option>หน่วยเทคโนโลยีการศึกษา (ฝ่ายโสตฯ)</option>
                  <option>ฝ่ายดำเนินการสอบและทะเบียนกลาง</option>
                  <option>อื่นๆ (ระบุในหมายเหตุ)</option>
                </Select>
              </div>

              <div>
                <Label className="mb-1.5">หมายเหตุ / เหตุผลการขอใช้งาน</Label>
                <Textarea rows={3} value={form.reason} onChange={set('reason')} placeholder="ระบุภาคเรียน/ปีการศึกษา และรายวิชาที่ต้องการใช้งาน"/>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Button type="submit" className="w-full py-2.5" disabled={loading}>
                  <UserPlus className="w-4 h-4"/>
                  <span>{loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอเปิดบัญชี'}</span>
                </Button>

                <div className="text-center mt-4">
                  <a href="/" className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-[#1A4B7A]">
                    <ArrowLeft className="w-3 h-3"/>
                    <span>มีบัญชีอยู่แล้ว — กลับไปหน้าเข้าสู่ระบบ</span>
                  </a>
                </div>
              </div>
            </form>

            {/* คำแนะนำขวา */}
            <aside className="lg:col-span-2">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-5 lg:sticky lg:top-6">
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900">ขั้นตอนหลังยื่นคำขอ</h3>
                  <ol className="mt-3 space-y-3 text-xs text-slate-600">
                    <li className="flex gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1A4B7A] text-white text-[10px] font-bold">1</span>
                      <span>ผู้ดูแลระบบตรวจคำขอของท่าน</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1A4B7A] text-white text-[10px] font-bold">2</span>
                      <span>เมื่ออนุมัติ ระบบสร้างบัญชีด้วยอีเมลที่กรอก</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-300 text-white text-[10px] font-bold">3</span>
                      <span>รับชื่อผู้ใช้ + รหัสผ่านเริ่มต้น แล้วเข้าสู่ระบบได้ทันที</span>
                    </li>
                  </ol>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <p className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                    <Info className="w-3.5 h-3.5 text-[#1A4B7A]"/>
                    <span>ควรระบุข้อมูลติดต่อให้ครบ</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    อีเมลและเบอร์โทรใช้ติดต่อกลับเมื่อคำขอได้รับการพิจารณา — หากมี LINE ID กรอกเพิ่มได้เพื่อความรวดเร็ว
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    หากมีปัญหาการใช้งาน ติดต่อเจ้าหน้าที่<br/>
                    <span className="font-semibold text-slate-700">หน่วยเทคโนโลยีการศึกษา ชั้น 2</span>
                  </p>
                </div>
              </div>
            </aside>
          </div>)}
        </div>
      </div>
    </div>);
}
