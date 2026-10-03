/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: SidebarShell.jsx
 * หน้าที่ของหน้านี้: App Shell แบบแถบข้าง (Sidebar) สำหรับบทบาท Teacher —
 *   แถบข้างสีน้ำเงิน #1A4B7A (แบรนด์ SCI / EXAM, เมนูนำทางแบบ dynamic,
 *   สถานะระบบ, ผู้ใช้ + ออกจากระบบ) และพื้นที่เนื้อหาพร้อมแถบบนบาง ๆ
 *   (ชื่อระบบ + กระดิ่งแจ้งเตือนพร้อม dropdown — ย้ายมาจาก Header เดิมทั้งหมด)
 *   บนจอเล็ก: แถบข้างยุบเป็นแถบด้านบนแนวนอน
 * ผู้ใช้งาน: อาจารย์ผู้สอน (Teacher)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, LogOut, Info, CheckCircle, AlertTriangle, } from 'lucide-react';

export const SidebarShell = ({ currentUser, notifications, onLogout, onMarkNotificationRead, onMarkAllNotificationsRead, onOpenNotification, navItems = [], activeNavId = null, statusNote = null, children, }) => {
    const [showNotifMenu, setShowNotifMenu] = useState(false);
    const bellRef = React.useRef(null);
    // ปิด dropdown แจ้งเตือนด้วยปุ่ม Escape แล้วคืนโฟกัสที่ปุ่มกระดิ่ง
    useEffect(() => {
        if (!showNotifMenu)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setShowNotifMenu(false);
                bellRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showNotifMenu]);
    // แสดงเฉพาะการแจ้งเตือนที่ออกถึงบทบาทของผู้ใช้ปัจจุบัน (หรือแบบทั่วไป)
    const visibleNotifs = notifications.filter((n) => !n.targetRole || n.targetRole === 'ALL' || n.targetRole === currentUser.role);
    const unreadCount = visibleNotifs.filter((n) => !n.isRead).length;

    return (<div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900 font-sans antialiased">
      {/* พื้นหลังดักคลิก — ปิด dropdown แจ้งเตือนเมื่อคลิกนอกเมนู */}
      {showNotifMenu && (<div className="fixed inset-0 z-30" onClick={() => setShowNotifMenu(false)} aria-hidden="true"/>)}

      {/* ═══ แถบข้าง (Sidebar) ═══ */}
      <aside className="bg-[#1A4B7A] text-white lg:w-64 shrink-0 lg:sticky lg:top-0 lg:h-screen flex flex-col">
        {/* แบรนด์ */}
        <div className="px-6 pt-6 pb-2 shrink-0">
          <p className="font-display text-lg font-bold tracking-wide">SCI / EXAM</p>
          <p className="text-xs text-white/70 mt-0.5">คณะวิทยาศาสตร์</p>
        </div>

        {/* เมนูนำทาง — รับจาก props (active ตามหน้าปัจจุบัน) */}
        <nav className="px-3 py-4 space-y-1 flex lg:flex-col gap-1 overflow-x-auto shrink-0" aria-label="เมนูหลัก">
          {navItems.map((item) => (<button key={item.id || item.label} onClick={item.onClick} aria-current={activeNavId === item.id ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${activeNavId === item.id
            ? 'bg-white/15 text-white'
            : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
              <item.icon className="w-4 h-4 shrink-0"/>
              <span>{item.label}</span>
            </button>))}
        </nav>

        {/* ส่วนท้ายแถบข้าง */}
        <div className="mt-auto px-3 pb-5 pt-4 space-y-3 shrink-0">
          {/* สถานะระบบ (ซ่อนบนมือถือ — sidebar ยุบเป็นแถบบนให้กระชับ) */}
          <div className="hidden lg:block rounded-xl bg-white/10 px-3.5 py-3 text-xs">
            <p className="flex items-center gap-2 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              สถานะระบบ: ปกติ
            </p>
            {statusNote && (<p className="text-white/70 mt-1">{statusNote}</p>)}
          </div>

          {/* ผู้ใช้ + ออกจากระบบ */}
          <div className="border-t border-white/20 pt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/15 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-none truncate">{currentUser.name}</p>
                <p className="text-xs text-white/70 mt-1 truncate">{currentUser.department || 'อาจารย์ผู้สอน'}</p>
              </div>
            </div>
            <button onClick={onLogout} title="ออกจากระบบ" aria-label="ออกจากระบบ" className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors shrink-0">
              <LogOut className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </aside>

      {/* ═══ พื้นที่เนื้อหา ═══ */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* แถบบนบาง: ชื่อระบบ + กระดิ่งแจ้งเตือน */}
        <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur border-b border-slate-200/70">
          <div className="flex items-center justify-between px-5 sm:px-8 py-3.5 gap-3">
            <p className="text-xs text-slate-500 truncate">
              ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ — ตรวจสอบและจัดส่งนำเข้า
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {/* ศูนย์การแจ้งเตือน (ย้ายจาก Header เดิม) */}
              <div className="relative">
                <button ref={bellRef} onClick={() => setShowNotifMenu(!showNotifMenu)} aria-label="การแจ้งเตือน" aria-expanded={showNotifMenu} aria-haspopup="true" className="relative p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors">
                  <Bell className="w-4 h-4"/>
                  {unreadCount > 0 && (<span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>)}
                </button>

                {showNotifMenu && (<div role="dialog" aria-label="การแจ้งเตือนความคืบหน้า" className="absolute right-0 mt-2 w-[calc(100vw-2.5rem)] sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-4 h-4 text-[#1A4B7A]"/>
                        <span className="font-display font-bold text-xs text-slate-800">การแจ้งเตือนความคืบหน้า</span>
                      </div>
                      {unreadCount > 0 && (<button onClick={onMarkAllNotificationsRead} className="text-xs font-medium text-[#1A4B7A] hover:underline flex items-center space-x-1">
                          <CheckCheck className="w-3.5 h-3.5"/>
                          <span>อ่านทั้งหมด</span>
                        </button>)}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {visibleNotifs.length === 0 ? (<div className="p-6 text-center text-xs text-slate-500">ไม่มีการแจ้งเตือนใหม่</div>) : (visibleNotifs.map((notif) => (<button key={notif.id} type="button" onClick={() => {
                        onMarkNotificationRead(notif.id);
                        onOpenNotification?.(notif);
                        setShowNotifMenu(false);
                    }} className={`w-full text-left p-3 text-xs hover:bg-slate-50 transition-colors flex items-start space-x-2.5 ${!notif.isRead ? 'bg-[#1A4B7A]/5' : ''}`}>
                            <div className="mt-0.5 shrink-0">
                              {notif.type === 'success' ? (<CheckCircle className="w-4 h-4 text-emerald-600"/>) : notif.type === 'warning' ? (<AlertTriangle className="w-4 h-4 text-amber-600"/>) : (<Info className="w-4 h-4 text-[#1A4B7A]"/>)}
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-slate-900">{notif.title}</p>
                                <span className="text-slate-500 shrink-0">{notif.timestamp}</span>
                              </div>
                              <p className="text-slate-600 leading-relaxed">{notif.message}</p>
                            </div>
                            {!notif.isRead && (<div className="w-2 h-2 rounded-full bg-[#1A4B7A] mt-1 shrink-0"></div>)}
                          </button>)))}
                    </div>
                    <div className="p-2 bg-slate-50 text-center border-t border-slate-100 text-xs text-slate-500">
                      ระบบแจ้งเตือนอัตโนมัติเมื่อสถานะข้อสอบมีการเปลี่ยนแปลง
                    </div>
                  </div>)}
              </div>
            </div>
          </div>
        </div>

        {/* เนื้อหา */}
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8">{children}</main>

        {/* ท้ายหน้า */}
        <footer className="px-5 sm:px-8 pb-6 text-center text-xs text-slate-500">
          ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ คณะวิทยาศาสตร์
        </footer>
      </div>
    </div>);
};
