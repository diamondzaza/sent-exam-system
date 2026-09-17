/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: RequestAccountForm.jsx
 * หน้าที่ของหน้านี้: ฟอร์มยื่นคำขอเปิดบัญชี — กรอกข้อมูลแล้วส่งเข้า
 *   POST /api/account-requests (สาธารณะ) แสดงผลสำเร็จเป็นหน้าขอบคุณ
 * ผู้ใช้งาน: ผู้ที่ยังไม่มีบัญชีในระบบ
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { UserPlus, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

export function RequestAccountForm() {
    const [form, setForm] = useState({
        username: '', name: '', email: '', tel: '',
        department: '', reason: '',
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
            const res = await fetch('/api/account-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
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

    return (<div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center font-bold text-xs ring-2 ring-indigo-400/40">
              SCI
            </div>
            <div>
              <h1 className="font-display text-base font-bold">ขอสมัครบัญชีใช้งานระบบ</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ คณะวิทยาศาสตร์
              </p>
            </div>
          </div>
        </div>

        {sent ? (<div className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto"/>
            <div>
              <p className="font-display font-bold text-base text-slate-900">ส่งคำขอเรียบร้อยแล้ว</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                คำขอของคุณถูกส่งถึงผู้ดูแลระบบแล้ว<br/>
                เมื่อได้รับอนุมัติ ผู้ดูแลระบบจะแจ้งชื่อผู้ใช้และรหัสผ่านเริ่มต้นให้ท่านโดยตรง
              </p>
            </div>
            <a href="/" className="inline-flex items-center space-x-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800">
              <ArrowLeft className="w-3.5 h-3.5"/>
              <span>กลับไปหน้าเข้าสู่ระบบ</span>
            </a>
          </div>) : (<form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && (<div className="flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-700">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0"/>
                <span className="leading-relaxed">{error}</span>
              </div>)}

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-amber-900 flex items-start space-x-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600"/>
              <span className="leading-relaxed">
                บัญชีใช้งานต้องได้รับอนุมัติจากผู้ดูแลระบบก่อน — กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1">ชื่อผู้ใช้งาน (Username) *</Label>
                <Input value={form.username} onChange={set('username')} placeholder="เช่น somkiat.s" required/>
              </div>
              <div>
                <Label className="mb-1">ชื่อ-นามสกุล *</Label>
                <Input value={form.name} onChange={set('name')} placeholder="เช่น ผศ.ดร.สมเกียรติ สว่างวงศ์" required/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1">อีเมล (ใช้เป็นบัญชีล็อกอิน) *</Label>
                <Input type="email" value={form.email} onChange={set('email')} placeholder="name@sci.ac.th" required/>
              </div>
              <div>
                <Label className="mb-1">เบอร์โทรศัพท์</Label>
                <Input value={form.tel} onChange={set('tel')} placeholder="081-xxx-xxxx"/>
              </div>
            </div>

            <div>
              <Label className="mb-1">สังกัด / ประเภทผู้ใช้งาน</Label>
              <Select value={form.department} onChange={set('department')}>
                <option value="">— เลือกสังกัด —</option>
                <option>อาจารย์ผู้สอน (สาขาวิชาต่างๆ)</option>
                <option>หน่วยเทคโนโลยีการศึกษา (ฝ่ายโสตฯ)</option>
                <option>ฝ่ายดำเนินการสอบและทะเบียนกลาง</option>
                <option>อื่นๆ (ระบุในหมายเหตุ)</option>
              </Select>
            </div>

            <div>
              <Label className="mb-1">หมายเหตุ / เหตุผลการขอใช้งาน</Label>
              <Textarea rows={2} value={form.reason} onChange={set('reason')} placeholder="เช่น ต้องการส่งข้อสอบภาคเรียนที่ 1/2567 จำนวน 2 วิชา"/>
            </div>

            <Button type="submit" className="w-full py-2.5" disabled={loading}>
              <UserPlus className="w-4 h-4"/>
              <span>{loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอเปิดบัญชี'}</span>
            </Button>

            <div className="text-center">
              <a href="/" className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-slate-500 hover:text-indigo-600">
                <ArrowLeft className="w-3 h-3"/>
                <span>มีบัญชีอยู่แล้ว — กลับไปหน้าเข้าสู่ระบบ</span>
              </a>
            </div>
          </form>)}
      </div>
    </div>);
}
