/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: Header.tsx
 * หน้าที่ของหน้านี้: แถบหัวเว็บแบบ sticky — โลโก้คณะวิทยาศาสตร์ + ชื่อระบบ,
 *   กระดิ่งแจ้งเตือน (dropdown เฉพาะแจ้งเตือนที่ตรงกับบทบาท, ตัวนับ unread,
 *   ทำเครื่องหมายอ่านแล้วทีละรายการ/ทั้งหมด) และเมนูผู้ใช้ (โปรไฟล์, สลับบัญชี
 *   เพื่อทดสอบหลายบทบาท, ล็อกเอาต์)
 * ผู้ใช้งาน: ทุกบทบาทหลังเข้าสู่ระบบ
 * ─────────────────────────────────────────────────────────
 */

'use client';

import React, { useState } from 'react';
import { UserAccount, AppNotification } from '@/types/entities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  CheckCheck,
  LogOut,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  notifications: AppNotification[];
  onSwitchUser: (userId: string) => void;
  onOpenLoginModal: () => void;
  onMarkNotificationRead: (notifId: string) => void;
  onMarkAllNotificationsRead: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  notifications,
  onSwitchUser,
  onOpenLoginModal,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // แสดงเฉพาะการแจ้งเตือนที่ออกถึงบทบาทของผู้ใช้ปัจจุบัน (หรือแบบทั่วไป)
  const visibleNotifs = notifications.filter(
    (n) => !n.targetRole || n.targetRole === 'ALL' || n.targetRole === currentUser.role
  );
  const unreadCount = visibleNotifs.filter((n) => !n.isRead).length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Teacher':
        return { label: 'อาจารย์ผู้สอน / ฝ่ายวิชาการ', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'AudioVisual':
        return { label: 'ฝ่ายเทคโนโลยีการศึกษา (หน่วยโสตฯ)', color: 'bg-indigo-50 text-indigo-800 border-indigo-300' };
      case 'Operations':
        return { label: 'ฝ่ายดำเนินการสอบ', color: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'Admin':
        return { label: 'ผู้ดูแลระบบ (Admin)', color: 'bg-purple-50 text-purple-800 border-purple-300' };
      default:
        return { label: role, color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Faculty */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-indigo-200">
              SCI
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-700 tracking-wider uppercase">
                คณะวิทยาศาสตร์
              </span>
              <h1 className="font-display text-sm sm:text-base font-bold text-slate-900 leading-tight">
                ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ
              </h1>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* ศูนย์การแจ้งเตือน */}
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative bg-slate-50 hover:bg-slate-100"
                aria-label="การแจ้งเตือน"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-indigo-600" />
                      <span className="font-display font-bold text-xs text-slate-800">
                        การแจ้งเตือนความคืบหน้า
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onMarkAllNotificationsRead}
                        className="h-auto p-0 text-indigo-600 hover:text-indigo-700 hover:bg-transparent"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>อ่านทั้งหมด</span>
                      </Button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {visibleNotifs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        ไม่มีการแจ้งเตือนใหม่
                      </div>
                    ) : (
                      visibleNotifs.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => onMarkNotificationRead(notif.id)}
                          className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer flex items-start space-x-2.5 ${
                            !notif.isRead ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {notif.type === 'success' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : notif.type === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Info className="w-4 h-4 text-indigo-600" />
                            )}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-slate-900">{notif.title}</p>
                              <span className="text-[10px] text-slate-400">{notif.timestamp}</span>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-[11px]">{notif.message}</p>
                          </div>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1 shrink-0"></div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 bg-slate-50 text-center border-t border-slate-100 text-[10px] text-slate-400">
                    ระบบแจ้งเตือนอัตโนมัติเมื่อสถานะข้อสอบมีการเปลี่ยนแปลง
                  </div>
                </div>
              )}
            </div>

            {/* Current User Badge & Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-slate-900 leading-none">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{roleInfo.label}</div>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-3 space-y-3">
                  <div className="border-b border-slate-100 pb-2">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                    <div className="mt-1.5">
                      <Badge variant="outline" className={`text-[10px] font-semibold rounded-full ${roleInfo.color}`}>
                        {roleInfo.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                      สลับบัญชีผู้ใช้
                    </div>
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {u.role === 'Teacher' ? 'อาจารย์' : u.role === 'AudioVisual' ? 'โสตฯ' : u.role === 'Operations' ? 'จัดสอบ' : 'แอดมิน'}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenLoginModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
