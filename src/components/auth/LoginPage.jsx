/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: LoginPage.jsx
 * หน้าที่ของหน้านี้: หน้าล็อกอิน — จอแบ่ง 2 ส่วน (แผงซ้ายแนะนำจุดเด่นของระบบ,
 *   แผงขวาเป็นฟอร์มล็อกอิน) ยืนยันตัวตนจริงผ่าน Supabase Auth
 *   (อีเมล + รหัสผ่าน) แล้วดึงโปรไฟล์จากตาราง users เพื่อกำหนดบทบาท
 * ผู้ใช้งาน: ผู้ที่ยังไม่ได้เข้าสู่ระบบ (ทุกบทบาท)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, KeyRound, UploadCloud, Printer, ShieldCheck, LogIn, AlertCircle, } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// แปลข้อความ error ของ Supabase เป็นภาษาไทย
const ERROR_MESSAGES = {
  invalid_credentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  email_not_confirmed: 'บัญชีนี้ยังไม่ได้ยืนยันอีเมล — ติดต่อผู้ดูแลระบบ',
  too_many_requests: 'พยายามหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่',
};
const getErrorMessage = (code) => ERROR_MESSAGES[code] || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';

export const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (authError) {
                setError(getErrorMessage(authError.code));
                return;
            }
            // ดึงโปรไฟล์จากตาราง users (id ตรงกับบัญชี Auth)
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();
            if (profileError || !profile) {
                await supabase.auth.signOut();
                setError('ไม่พบข้อมูลผู้ใช้ในระบบ — ติดต่อผู้ดูแลระบบ');
                return;
            }
            onLogin(profile);
        } catch {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    return (<div className="min-h-screen flex flex-col lg:flex-row bg-slate-950">
      {/* Left: Brand Panel */}
      <div className="relative lg:w-1/2 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 text-white flex flex-col justify-center overflow-hidden">
        {/* Decorative glow circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 px-8 sm:px-14 py-12 max-w-xl">
          {/* Logo & System Name */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg ring-2 ring-indigo-400/40 shrink-0">
              SCI
            </div>
            <div>
              <span className="text-[11px] font-semibold text-indigo-300 tracking-wider uppercase">
                คณะวิทยาศาสตร์
              </span>
              <h1 className="font-display text-lg sm:text-xl font-bold leading-tight mt-0.5">
                ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ
              </h1>
            </div>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-snug mb-3">
            จัดส่ง ตรวจสอบ และจัดพิมพ์ข้อสอบ
            <span className="block text-indigo-300">ในระบบเดียว ปลอดภัยทุกขั้นตอน</span>
          </h2>
          <p className="text-sm text-indigo-200/80 leading-relaxed mb-8">
            ติดตามการส่ง ตรวจสอบ และจัดพิมพ์ข้อสอบของท่านได้จากหน้านี้
          </p>

          {/* Feature Highlights */}
          <div className="space-y-3 text-xs">
            {[
            {
                icon: UploadCloud,
                title: 'จัดส่งข้อสอบเข้าสู่ระบบ',
                desc: 'อัปโหลดไฟล์พร้อมระบุจำนวนพิมพ์และใบปะหน้าซอง',
            },
            {
                icon: Printer,
                title: 'ติดตามสถานะการจัดพิมพ์',
                desc: 'ดูความคืบหน้าได้ถึงขั้นตอนส่งมอบซอง',
            },
            {
                icon: ShieldCheck,
                title: 'ป้องกันข้อสอบรั่วไหล',
                desc: 'ลายน้ำดิจิทัลและบันทึกการเข้าถึงทุกครั้ง',
            },
        ].map((item) => (<div key={item.title} className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/30 shrink-0">
                  <item.icon className="w-4 h-4"/>
                </div>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-indigo-200/70 mt-0.5">{item.desc}</p>
                </div>
              </div>))}
          </div>

          <div className="mt-10 pt-5 border-t border-indigo-400/20 text-[11px] text-indigo-300/70">
            ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ คณะวิทยาศาสตร์
          </div>
        </div>
      </div>

      {/* Right: Login Form Panel */}
      <div className="lg:w-1/2 bg-slate-100 flex items-center justify-center p-4 sm:p-8">
        <Card className="shadow-2xl w-full max-w-md overflow-hidden bg-white">
          {/* Card Header */}
          <div className="bg-slate-900 text-white p-6">
            <div className="w-11 h-11 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-3 border border-indigo-500/30">
              <Lock className="w-5 h-5"/>
            </div>
            <h2 className="font-display text-xl font-bold">เข้าสู่ระบบ</h2>
            <p className="text-xs text-slate-400 mt-1">
              ยืนยันตัวตนเพื่อเข้าใช้งานตามบทบาทของท่าน
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">อีเมล (Email)</Label>
                <Input id="login-email" type="email" placeholder="เช่น somchai.j@sci.ac.th" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"/>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">รหัสผ่าน (Password)</Label>
                <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"/>
                <p className="mt-1.5 text-[10px] text-slate-400 flex items-center space-x-1">
                  <KeyRound className="w-3 h-3"/>
                  <span>ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ</span>
                </p>
              </div>

              {error && (<div className="flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0"/>
                  <span className="leading-relaxed">{error}</span>
                </div>)}

              <Button type="submit" className="w-full py-2.5" disabled={loading}>
                <LogIn className="w-4 h-4"/>
                <span>{loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
              </Button>
            </form>
          </div>

          <div className="px-6 pb-6">
            <div className="border-t border-slate-200 pt-4 text-center space-y-2">
              <a href="/request-account" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                <UserPlus className="w-3.5 h-3.5"/>
                <span>ยังไม่มีบัญชี? — ขอสมัครบัญชีจากผู้ดูแลระบบ</span>
              </a>
              <p className="text-[10px] text-slate-400">
                ระบบยืนยันตัวตนผ่าน Supabase Auth — ข้อมูลการเข้าใช้งานถูกบันทึกเพื่อความปลอดภัย
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>);
};
