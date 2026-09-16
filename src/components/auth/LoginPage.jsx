/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: LoginPage.jsx
 * หน้าที่ของหน้านี้: หน้าล็อกอิน — จอแบ่ง 2 ส่วน (แผงซ้ายแนะนำจุดเด่นของระบบ,
 *   แผงขวาเป็นฟอร์มล็อกอิน) พร้อมปุ่ม Quick Login สำหรับบัญชีตัวอย่างทั้ง 5 บัญชี
 * ผู้ใช้งาน: ผู้ที่ยังไม่ได้เข้าสู่ระบบ (ทุกบทบาท)
 * หมายเหตุ: โหมดสาธิต — รหัสผ่านยังไม่ถูกตรวจสอบจริง พิมพ์ชื่อผู้ใช้ให้ตรงเท่านั้น
 *   (เมื่อเชื่อมต่อ Supabase Auth แล้วจะตรวจรหัสผ่านจริง)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, KeyRound, UploadCloud, Printer, ShieldCheck, LogIn, } from 'lucide-react';
export const LoginPage = ({ users, onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // กดปุ่มเดียวเข้าสู่ระบบทันที: ถ้า username ตรงกับบัญชีในระบบใช้บัญชีนั้น
    // มิฉะนั้นเข้าด้วยบัญชีเริ่มต้น (บัญชีแรกของระบบ)
    const handleCustomLogin = (e) => {
        e.preventDefault();
        const matchedUser = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
        onLogin(matchedUser || users[0]);
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
            <form onSubmit={handleCustomLogin} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="login-username">ชื่อผู้ใช้งาน (Username)</Label>
                <Input id="login-username" type="text" placeholder="เช่น somchai.t หรือ av.staff1" value={username} onChange={(e) => setUsername(e.target.value)}/>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">รหัสผ่าน (Password)</Label>
                <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/>
                <p className="mt-1.5 text-[10px] text-slate-400 flex items-center space-x-1">
                  <KeyRound className="w-3 h-3"/>
                  <span>บัญชีทดลอง ไม่ต้องใช้รหัสผ่าน</span>
                </p>
              </div>

              <Button type="submit" className="w-full py-2.5">
                <LogIn className="w-4 h-4"/>
                <span>เข้าสู่ระบบ</span>
              </Button>
            </form>
          </div>

          {/* เลือกบัญชีเข้าใช้งานทันที */}
          <div className="px-6 pb-6">
            <div className="border-t border-slate-200 pt-4 space-y-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                หรือเลือกบัญชีเข้าใช้งาน
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {users.map((user) => {
            let shortRole = 'อาจารย์';
            if (user.role === 'AudioVisual')
                shortRole = 'โสตฯ';
            if (user.role === 'Operations')
                shortRole = 'ฝ่ายจัดสอบ';
            if (user.role === 'Admin')
                shortRole = 'แอดมิน';
            return (<button key={user.id} onClick={() => onLogin(user)} className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all flex items-center space-x-2.5 group">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200 shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 group-hover:text-indigo-900 leading-tight">
                          {shortRole}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{user.name}</p>
                      </div>
                    </button>);
        })}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>);
};
