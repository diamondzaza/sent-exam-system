/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: ReportIssueView.jsx
 * หน้าที่ของหน้านี้: ฟอร์มแจ้งปัญหาการใช้งาน — เลือกประเภทปัญหา หัวข้อ รายละเอียด
 *   แล้วส่งเข้า POST /api/issues → ผู้ดูแลระบบได้รับ notification ทันที
 *   (ผู้แจ้ง + บทบาทแนบอัตโนมัติจากบัญชีที่ล็อกอิน)
 * ผู้ใช้งาน: ทุกบทบาท (ยกเว้น Admin ไม่มีเมนูนี้)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { authFetch } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Flag, CheckCircle2, AlertCircle, Send, Loader2, } from 'lucide-react';
export const ReportIssueView = ({ currentUser }) => {
    const [category, setCategory] = useState('ไฟล์ข้อสอบ');
    const [title, setTitle] = useState('');
    const [detail, setDetail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !detail.trim())
            return;
        setError('');
        setLoading(true);
        try {
            const res = await authFetch('/api/issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, title: title.trim(), detail: detail.trim() }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setError(err.error || 'ส่งรายงานไม่สำเร็จ กรุณาลองใหม่');
                return;
            }
            setSent(true);
            setTitle('');
            setDetail('');
        }
        catch {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="max-w-3xl mx-auto space-y-6">
      {/* Hero */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          แจ้งปัญหาการใช้งาน
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          บอกปัญหาที่พบได้ตรงไปตรงมา — ผู้ดูแลระบบจะได้รับแจ้งทันทีและติดต่อกลับ
        </p>
      </div>

      {/* ส่งสำเร็จ */}
      {sent && (<div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-10 text-center space-y-3">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto"/>
          <p className="font-display font-bold text-lg text-slate-900">ส่งรายงานแล้ว</p>
          <p className="text-sm text-slate-500 leading-relaxed">
            ผู้ดูแลระบบได้รับแจ้งแล้ว (บันทึก Audit Log เรียบร้อย)<br/>
            จะติดต่อกลับหา {currentUser.name} โดยเร็วที่สุด
          </p>
          <Button variant="outline" onClick={() => setSent(false)} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700">
            แจ้งปัญหาอื่นเพิ่ม
          </Button>
        </div>)}

      {/* ฟอร์ม */}
      {!sent && (<form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
          {error && (<div className="flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
              <span className="leading-relaxed">{error}</span>
            </div>)}

          <div>
            <Label htmlFor="issue-category" className="mb-1.5">ประเภทปัญหา</Label>
            <Select id="issue-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>ไฟล์ข้อสอบ</option>
              <option>การจัดพิมพ์</option>
              <option>การยืนยัน/ตรวจสอบ</option>
              <option>บัญชีผู้ใช้ / การเข้าสู่ระบบ</option>
              <option>อื่น ๆ</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="issue-title" className="mb-1.5">
              หัวข้อปัญหา <span className="text-rose-500">*</span>
            </Label>
            <Input id="issue-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="สรุปปัญหาสั้น ๆ หนึ่งบรรทัด" required/>
          </div>

          <div>
            <Label htmlFor="issue-detail" className="mb-1.5">
              รายละเอียด <span className="text-rose-500">*</span>
            </Label>
            <Textarea id="issue-detail" rows={5} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="อธิบายสิ่งที่พบ เกิดขึ้นตอนไหน บนหน้าไหน และคาดหวังให้เป็นอย่างไร" required/>
            <p className="mt-1.5 text-xs text-slate-500">
              รายงานนี้ส่งในนาม {currentUser.name} ({currentUser.role}) — ระบบแนบข้อมูลบัญชีให้อัตโนมัติ
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Button type="submit" disabled={loading} className="w-full py-2.5">
              <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : 'hidden'}`} aria-hidden="true"/>
              <Send className={`w-4 h-4 ${loading ? 'hidden' : ''}`}/>
              <span>{loading ? 'กำลังส่งรายงาน...' : 'ส่งรายงานถึงผู้ดูแลระบบ'}</span>
            </Button>
          </div>
        </form>)}
    </div>);
};
