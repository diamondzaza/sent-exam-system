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
import { UploadCloud, Printer, ShieldCheck, LogIn, AlertCircle, UserPlus, Eye, EyeOff, Loader2, } from 'lucide-react';
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

    return (<div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* ═══ แผงขวา: ฟอร์มล็อกอิน (ขึ้นก่อนบนมือถือ) ═══ */}
      <div className="order-1 lg:order-2 relative lg:w-1/2 bg-slate-50 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {/* โลโก้คณะ มุมขวาบน */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-10 flex items-center gap-2.5">
          <img src="/logosci-psu.png" alt="ตราสัญลักษณ์คณะวิทยาศาสตร์ มหาวิทยาลัยสงขลานครินทร์" className="h-11 w-auto object-contain"/>
        </div>

        <Card className="relative z-10 shadow-xl w-full max-w-md bg-white rounded-2xl border border-slate-100">
          <div className="p-7 sm:p-9">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              เข้าสู่ระบบ
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 mb-7">
              ยืนยันตัวตนเพื่อเข้าใช้งานตามบทบาทของท่าน
            </p>

            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              {/* อีเมล */}
              <div>
                <Label htmlFor="login-email" className="font-medium mb-2 block text-slate-800">
                  ชื่อ
                </Label>
                <Input id="login-email" type="email" placeholder="อีเมลของท่าน" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true" aria-label="อีเมลสำหรับเข้าสู่ระบบ" aria-invalid={Boolean(emailError)} aria-describedby={emailError ? 'login-email-error' : undefined} autoComplete="email" className={emailError ? 'border-rose-500 focus-visible:ring-[#1A4B7A] focus-visible:border-[#1A4B7A]' : 'focus-visible:ring-[#1A4B7A] focus-visible:border-[#1A4B7A]'}/>
                {emailError && (<p id="login-email-error" className="mt-1.5 text-xs text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0"/>
                    <span>{emailError}</span>
                  </p>)}
              </div>

              {/* รหัสผ่าน */}
              <div>
                <Label htmlFor="login-password" className="font-medium mb-2 block text-slate-800">
                  รหัสผ่าน
                </Label>
                <div className="relative">
                  <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required aria-required="true" aria-label="รหัสผ่านสำหรับเข้าสู่ระบบ" aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? 'login-password-error' : undefined} autoComplete="current-password" className={passwordError ? 'pr-10 border-rose-500 focus-visible:ring-[#1A4B7A] focus-visible:border-[#1A4B7A]' : 'pr-10 focus-visible:ring-[#1A4B7A] focus-visible:border-[#1A4B7A]'}/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1A4B7A] transition-colors">
                    {showPassword ? (<EyeOff className="w-4 h-4"/>) : (<Eye className="w-4 h-4"/>)}
                  </button>
                </div>
                {passwordError && (<p id="login-password-error" className="mt-1.5 text-xs text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0"/>
                    <span>{passwordError}</span>
                  </p>)}
                <div className="mt-2 text-right">
                  <a href="#" className="text-xs text-slate-500 hover:text-[#1A4B7A] hover:underline underline-offset-2 transition-colors">
                    ลืมรหัสผ่าน?
                  </a>
                </div>
              </div>

              {/* Error แจ้งเตือนการล็อกอิน (จาก server) */}
              {error && (<div role="alert" className="flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
                  <span className="leading-relaxed">{error}</span>
                </div>)}

              <Button type="submit" className="w-full py-2.5 " disabled={loading}>
                {loading ? (<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true"/>) : (<LogIn className="w-4 h-4"/>)}
                <span>{loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              ยังไม่มีบัญชี?{' '}
              <a href="/request-account" className="inline-flex items-center space-x-1 font-semibold text-[#1A4B7A] hover:text-[#153D63] hover:underline underline-offset-2">
                <UserPlus className="w-3.5 h-3.5"/>
                <span>ขอสมัครบัญชีจากผู้ดูแลระบบ</span>
              </a>
            </p>
          </div>
        </Card>
      </div>

      {/* ═══ แผงซ้าย: แบรนด์ + จุดเด่นระบบ (อยู่ด้านล่างบนมือถือ) ═══ */}
      <div className="order-2 lg:order-1 relative lg:w-1/2 bg-[#1A4B7A] text-white flex flex-col overflow-hidden">
        <div className="relative z-10 px-8 sm:px-14 py-12 my-auto">
          <h1 className="font-display font-bold leading-[1.45] mb-10 text-[length:clamp(28px,5vw,44px)] lg:text-[length:clamp(24px,calc(3vw_-_6px),36px)]">
            ระบบบริหารจัดการและ<span className="whitespace-nowrap">จัดพิมพ์ข้อสอบ</span>
            <span className="block">คณะวิทยาศาสตร์</span>
          </h1>

          {/* Feature Highlights — ซ่อนบนจอเล็ก (ให้ฟอร์มอยู่เหนือจอพอดี) */}
          <div className="hidden sm:block space-y-6 text-base">
            {[
            {
                icon: UploadCloud,
                title: 'จัดส่งข้อสอบเข้าสู่ระบบ',
            },
            {
                icon: Printer,
                title: 'ติดตามสถานะการจัดพิมพ์',
            },
            {
                icon: ShieldCheck,
                title: 'ป้องกันข้อสอบรั่วไหล',
            },
        ].map((item) => (<div key={item.title} className="flex items-center space-x-4">
                <item.icon className="w-6 h-6 text-white/90 shrink-0" strokeWidth={1.75}/>
                <p className="font-medium text-white/95">{item.title}</p>
              </div>))}
          </div>
        </div>

        {/* เส้นคั่น + ข้อความท้ายแผง */}
        <div className="relative z-10 mt-auto px-8 sm:px-14 pb-8">
          <div className="border-t border-white/20 pt-4 text-xs text-white/60">
            ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ คณะวิทยาศาสตร์
          </div>
        </div>
      </div>
    </div>);
};
