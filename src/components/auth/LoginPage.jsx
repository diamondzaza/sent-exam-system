/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: LoginPage.jsx
 * หน้าที่ของหน้านี้: หน้าล็อกอิน — จอแบ่ง 2 ส่วน (แผงซ้ายแนะนำจุดเด่นของระบบ,
 *   แผงขวาเป็นฟอร์มล็อกอิน) ยืนยันตัวตนจริงผ่าน Supabase Auth
 *   (อีเมล + รหัสผ่าน) แล้วดึงโปรไฟล์จากตาราง users เพื่อกำหนดบทบาท
 *   บนมือถือ: ฟอร์มล็อกอินขึ้นก่อน แผงแนะนำอยู่ด้านล่าง (ซ่อนรายละเอียดบางส่วน)
 * ผู้ใช้งาน: ผู้ที่ยังไม่ได้เข้าสู่ระบบ (ทุกบทบาท)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, KeyRound, UploadCloud, Printer, ShieldCheck, LogIn, AlertCircle, UserPlus, Eye, EyeOff, Loader2, } from 'lucide-react';
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
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        // Validation ระดับฟอร์ม — error ใต้ช่องที่ผิด
        let valid = true;
        if (!email.trim()) {
            setEmailError('กรุณากรอกอีเมล');
            valid = false;
        }
        else {
            setEmailError('');
        }
        if (!password) {
            setPasswordError('กรุณากรอกรหัสผ่าน');
            valid = false;
        }
        else {
            setPasswordError('');
        }
        if (!valid)
            return;
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
        }
        catch {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
        }
        finally {
            setLoading(false);
        }
    };

    return (<div className="min-h-screen flex flex-col lg:flex-row bg-slate-950">
      {/* ═══ แผงขวา: ฟอร์มล็อกอิน (ขึ้นก่อนบนมือถือ) ═══ */}
      <div className="order-1 lg:order-2 relative lg:w-1/2 bg-slate-100 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {/* Subtle background pattern: dot grid + gradient blob */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '22px 22px' }}></div>
        <div aria-hidden="true" className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none"></div>
        <div aria-hidden="true" className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-purple-400/15 blur-3xl pointer-events-none"></div>

        <Card className="relative z-10 shadow-2xl w-full max-w-md overflow-hidden bg-white">
          {/* Card Header */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6">
            <div className="w-11 h-11 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-3 border border-indigo-500/30">
              <Lock className="w-5 h-5"/>
            </div>
            <h2 className="font-display text-3xl font-bold">เข้าสู่ระบบ</h2>
            <p className="text-sm text-slate-300 mt-1.5">
              ยืนยันตัวตนเพื่อเข้าใช้งานตามบทบาทของท่าน
            </p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-7">
            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              {/* อีเมล */}
              <div>
                <Label htmlFor="login-email" className="font-medium mb-2 block">
                  อีเมล (Email) <span className="text-rose-500">*</span>
                </Label>
                <Input id="login-email" type="email" placeholder="เช่น somchai.j@sci.ac.th" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true" aria-label="อีเมลสำหรับเข้าสู่ระบบ" aria-invalid={Boolean(emailError)} aria-describedby={emailError ? 'login-email-error' : undefined} autoComplete="email" className={emailError ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'focus-visible:ring-indigo-500 focus-visible:border-indigo-500'}/>
                {emailError && (<p id="login-email-error" className="mt-1.5 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0"/>
                    <span>{emailError}</span>
                  </p>)}
              </div>

              {/* รหัสผ่าน */}
              <div>
                <Label htmlFor="login-password" className="font-medium mb-2 block">
                  รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required aria-required="true" aria-label="รหัสผ่านสำหรับเข้าสู่ระบบ" aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? 'login-password-error' : undefined} autoComplete="current-password" className={passwordError ? 'pr-10 border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'pr-10 focus-visible:ring-indigo-500 focus-visible:border-indigo-500'}/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                    {showPassword ? (<EyeOff className="w-4 h-4"/>) : (<Eye className="w-4 h-4"/>)}
                  </button>
                </div>
                {passwordError && (<p id="login-password-error" className="mt-1.5 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0"/>
                    <span>{passwordError}</span>
                  </p>)}
                <p className="mt-2 text-sm text-slate-600 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 shrink-0"/>
                  <span>ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ</span>
                </p>
              </div>

              {/* Error แจ้งเตือนการล็อกอิน (จาก server) */}
              {error && (<div role="alert" className="flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
                  <span className="leading-relaxed">{error}</span>
                </div>)}

              <Button type="submit" className="w-full py-2.5" disabled={loading}>
                {loading ? (<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true"/>) : (<LogIn className="w-4 h-4"/>)}
                <span>{loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
              </Button>
            </form>
          </div>

          <div className="px-6 pb-6">
            <div className="border-t border-slate-200 pt-4 text-center">
              <a href="/request-account" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                <UserPlus className="w-3.5 h-3.5"/>
                <span>ยังไม่มีบัญชี? — ขอสมัครบัญชีจากผู้ดูแลระบบ</span>
              </a>
            </div>
          </div>
        </Card>
      </div>

      {/* ═══ แผงซ้าย: แบรนด์ + จุดเด่นระบบ (อยู่ด้านล่างบนมือถือ) ═══ */}
      <div className="order-2 lg:order-1 relative lg:w-1/2 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 text-white flex flex-col justify-center overflow-hidden">
        {/* Decorative glow circles */}
        <div aria-hidden="true" className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div aria-hidden="true" className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 px-8 sm:px-14 py-12 max-w-xl">
          {/* Logo & System Name */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg ring-2 ring-indigo-400/40 shrink-0">
              SCI
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-300 tracking-wider uppercase">
                คณะวิทยาศาสตร์
              </span>
              <h1 className="font-display text-lg sm:text-xl font-bold leading-tight mt-0.5">
                ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ
              </h1>
            </div>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-snug mb-3">
            จัดส่ง ตรวจสอบ และจัดพิมพ์ข้อสอบ
            <span className="block text-indigo-200">ในระบบเดียว ปลอดภัยทุกขั้นตอน</span>
          </h2>
          <p className="text-sm text-indigo-100 leading-relaxed mb-8">
            ติดตามการส่ง ตรวจสอบ และจัดพิมพ์ข้อสอบของท่านได้จากหน้านี้
          </p>

          {/* Feature Highlights — ซ่อนบนจอเล็ก (ให้ฟอร์มอยู่เหนือจอพอดี) */}
          <div className="hidden sm:block space-y-3 text-sm">
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
                desc: 'บันทึก Audit Log ทุกครั้ง + ลิงก์ดาวน์โหลดหมดอายุ',
            },
        ].map((item) => (<div key={item.title} className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/30 shrink-0">
                  <item.icon className="w-4 h-4"/>
                </div>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-indigo-200 mt-0.5">{item.desc}</p>
                </div>
              </div>))}
          </div>

          <div className="mt-10 pt-5 border-t border-indigo-400/20 text-xs text-indigo-300">
            ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ คณะวิทยาศาสตร์
          </div>
        </div>
      </div>
    </div>);
};
