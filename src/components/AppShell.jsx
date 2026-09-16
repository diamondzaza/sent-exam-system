/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: AppShell.jsx
 * หน้าที่ของหน้านี้: แกนกลางของแอป (App Shell) — จัดการ state หลักทั้งหมดของระบบ
 *   (ผู้ใช้, บัญชีปัจจุบัน, รายวิชา, ข้อสอบ, audit logs, notifications)
 *   บันทึกข้อมูลลง localStorage, ตรวจสอบการล็อกอิน, บันทึก audit trail + แจ้งเตือน
 *   อัตโนมัติเมื่อเกิดเหตุการณ์, และสลับหน้าจอตามบทบาทผู้ใช้
 * ผู้ใช้งาน: ทุกบทบาท (Teacher / AudioVisual / Operations / Admin)
 * ฟีเจอร์หลัก:
 *   1. Login gate — แสดง LoginPage จนกว่าจะล็อกอิน (REQ-0001)
 *   2. ส่งข้อสอบใหม่ / อัปโหลดซ้ำ / ยกเลิกการส่ง (REQ-0004, REQ-0006)
 *   3. อัปเดตสถานะข้อสอบ 8 สถานะ + audit log + notification (REQ-0010)
 *   4. จัดการผู้ใช้: เพิ่ม / แก้ไข / ลบ / เปิด-ปิดสถานะ (REQ-0002, REQ-0003)
 *   5. Modal รวม: อัปโหลด, ตัวอย่างข้อสอบ, ใบปะหน้าซองข้อสอบ
 * หมายเหตุ: state ถูก persist ลง localStorage ด้วยคีย์ sci_exam_* (ยังไม่ใช่ Supabase)
 * ─────────────────────────────────────────────────────────
 */
'use client';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { LoginPage } from '@/components/auth/LoginPage';
import { ExamEnvelopeCover } from '@/components/modals/ExamEnvelopeCover';
import { ExamPreviewModal } from '@/components/modals/ExamPreviewModal';
import { ExamUploadModal } from '@/components/modals/ExamUploadModal';
import { TeacherView } from '@/components/views/TeacherView';
import { AudioVisualView } from '@/components/views/AudioVisualView';
import { OperationsView } from '@/components/views/OperationsView';
import { AdminView } from '@/components/views/AdminView';
import { CheckCircle2 } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCourses } from '@/hooks/useCourses';
import { useExams } from '@/hooks/useExams';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuthSession } from '@/hooks/useAuthSession';
import { createClient } from '@/lib/supabase/client';
export default function AppShell() {
    // Persistence state (hooks persist ลง localStorage ด้วยคีย์ sci_exam_* ตัวเดิม)
    const [users, setUsers] = useUsers();
    const [currentUser, setCurrentUser] = useCurrentUser();
    const [courses, setCourses] = useCourses();
    const [exams, setExams] = useExams();
    const [auditLogs, setAuditLogs] = useAuditLogs();
    const [notifications, setNotifications] = useNotifications();
    // Auth session state (Supabase Auth จริง — 'loading' | 'authenticated' | 'guest')
    const authStatus = useAuthSession();
    // Modal states
    const [uploadModalData, setUploadModalData] = useState(null);
    const [previewExam, setPreviewExam] = useState(null);
    const [envelopeExam, setEnvelopeExam] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);
    // ดึงโปรไฟล์จากตาราง users ทุกครั้งที่มี session (กัน localStorage cache เก่าไม่ตรงกับฐานข้อมูล)
    React.useEffect(() => {
        if (authStatus !== 'authenticated')
            return;
        const supabase = createClient();
        supabase.auth.getUser().then(async ({ data }) => {
            if (!data.user)
                return;
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();
            if (profile)
                setCurrentUser(profile);
        });
    }, [authStatus, setCurrentUser]);
    // Login (REQ-0001) — รับโปรไฟล์จาก LoginPage (ยืนยันตัวตนผ่าน Supabase Auth แล้ว)
    // session จะเปลี่ยนเป็น 'authenticated' ผ่าน onAuthStateChange เอง
    const handleLogin = (user) => {
        setCurrentUser(user);
        showToast(`เข้าสู่ระบบในฐานะ: ${user.name} (${user.role})`);
        const newLog = {
            id: `LOG-${Date.now().toString().slice(-5)}`,
            timestamp: new Date().toLocaleString('th-TH'),
            userId: user.id,
            userName: user.name,
            role: user.role,
            action: 'LOGIN',
            subjectId: user.id,
            subjectName: user.name,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 40) + 10}`,
            details: `เข้าสู่ระบบสำเร็จในบทบาท ${user.role}`,
        };
        setAuditLogs((prev) => [newLog, ...prev]);
    };
    // Logout — ออกจากระบบจริง (ลบ session ที่ Supabase), status จะกลับเป็น 'guest' เอง
    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
    };
    const toastTimer = useRef(undefined);
    const showToast = (msg) => {
        setToastMessage(msg);
        window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => {
            setToastMessage(null);
        }, 4000);
    };
    // Add Security Audit Log helper
    const addAuditLog = (action, subjectId, subjectName, details) => {
        const newLog = {
            id: `LOG-${Date.now().toString().slice(-5)}`,
            timestamp: new Date().toLocaleString('th-TH'),
            userId: currentUser.id,
            userName: currentUser.name,
            role: currentUser.role,
            action,
            subjectId,
            subjectName,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 40) + 10}`,
            details,
        };
        setAuditLogs((prev) => [newLog, ...prev]);
    };
    // Add Notification helper
    const addNotification = (title, message, targetRole, type = 'info', relatedExamNo) => {
        const newNotif = {
            id: `N-${Date.now()}`,
            title,
            message,
            timestamp: 'เมื่อสักครู่',
            targetRole,
            type,
            isRead: false,
            relatedExamNo,
        };
        setNotifications((prev) => [newNotif, ...prev]);
    };
    // Teacher Handlers
    const handleOpenUploadModal = (course, existingExam, isReupload = false) => {
        setUploadModalData({ course, existingExam, isReupload });
    };
    const handleSubmitExamUpload = (examData, isReupload) => {
        if (!uploadModalData)
            return;
        if (isReupload && uploadModalData.existingExam) {
            // Re-upload (REQ-0006) — clear the previous round's verification metadata
            setExams((prev) => prev.map((e) => e.E_No === uploadModalData.existingExam.E_No
                ? { ...e, ...examData, checked_by: undefined, verified_date: undefined, rejection_reason: undefined }
                : e));
            addAuditLog('REUPLOAD_EXAM', examData.Subject_ID || '', examData.Subject_Name || '', `อาจารย์อัปโหลดไฟล์ใหม่แทนที่เดิม: ${examData.file_name} (${examData.file_size})`);
            addNotification('อาจารย์อัปโหลดข้อสอบฉบับใหม่', `อาจารย์ได้อัปโหลดไฟล์ใหม่ของวิชา ${examData.Subject_ID} ${examData.Subject_Name} กรุณาตรวจสอบใหม่อีกครั้ง`, 'AudioVisual', 'info', uploadModalData.existingExam.E_No);
            showToast(`อัปโหลดไฟล์ข้อสอบฉบับใหม่วิชา ${examData.Subject_ID} เรียบร้อยแล้ว`);
        }
        else {
            // New upload (REQ-0004)
            const fullExam = examData;
            setExams((prev) => [fullExam, ...prev]);
            addAuditLog('UPLOAD_EXAM', fullExam.Subject_ID, fullExam.Subject_Name, `อัปโหลดข้อสอบใหม่เข้าสู่ระบบ: ${fullExam.file_name} (${fullExam.file_size}) ยอดพิมพ์ ${fullExam.total_copies} ชุด`);
            addNotification('ข้อสอบใหม่รอการตรวจสอบ', `อาจารย์ ${currentUser.name} ได้จัดส่งข้อสอบวิชา ${fullExam.Subject_ID} เข้าสู่ระบบแล้ว`, 'AudioVisual', 'info', fullExam.E_No);
            showToast(`จัดส่งข้อสอบวิชา ${fullExam.Subject_ID} เข้าสู่ระบบสำเร็จ`);
        }
        setUploadModalData(null);
    };
    const handleRemoveExam = (examNo) => {
        const targetExam = exams.find((e) => e.E_No === examNo);
        if (!targetExam)
            return;
        setExams((prev) => prev.filter((e) => e.E_No !== examNo));
        addAuditLog('DELETE_EXAM', targetExam.Subject_ID, targetExam.Subject_Name, `อาจารย์ยกเลิกการส่งข้อสอบรหัส ${targetExam.E_No} ออกจากระบบ`);
        addNotification('ยกเลิกการส่งข้อสอบ', `ข้อสอบวิชา ${targetExam.Subject_ID} ได้รับการยกเลิกการส่งโดยอาจารย์ผู้สอน`, 'AudioVisual', 'warning');
        showToast(`ยกเลิกการส่งข้อสอบวิชา ${targetExam.Subject_ID} เรียบร้อยแล้ว`);
    };
    const handleAddNewCourse = (newCourse) => {
        setCourses((prev) => [newCourse, ...prev]);
        showToast(`เพิ่มรายวิชา ${newCourse.Course_id} (${newCourse.Course_Name}) สำเร็จ`);
    };
    // AudioVisual / Operations Status Update Handler (REQ-0010)
    const handleUpdateExamStatus = (examNo, newStatus, note) => {
        setExams((prev) => prev.map((e) => {
            if (e.E_No === examNo) {
                return {
                    ...e,
                    status: newStatus,
                    checked_by: newStatus === 'VERIFIED' ? currentUser.name : e.checked_by,
                    verified_date: newStatus === 'VERIFIED' ? new Date().toLocaleString('th-TH') : e.verified_date,
                    print_date: newStatus === 'PRINTED' ? new Date().toLocaleString('th-TH') : e.print_date,
                    rejection_reason: newStatus === 'REJECTED' ? note : undefined,
                };
            }
            return e;
        }));
        const exam = exams.find((e) => e.E_No === examNo);
        const subjectId = exam ? exam.Subject_ID : '';
        const subjectName = exam ? exam.Subject_Name : '';
        addAuditLog('UPDATE_STATUS', subjectId, subjectName, `ปรับสถานะเป็น [${newStatus}] โดย ${currentUser.name}: ${note || ''}`);
        let notifTitle = 'สถานะข้อสอบได้รับการปรับปรุง';
        let notifType = 'info';
        if (newStatus === 'VERIFIED') {
            notifTitle = 'ข้อสอบผ่านการตรวจสอบแล้ว';
            notifType = 'success';
        }
        else if (newStatus === 'PRINTING') {
            notifTitle = 'ข้อสอบกำลังอยู่ระหว่างจัดพิมพ์';
            notifType = 'info';
        }
        else if (newStatus === 'PRINTED') {
            notifTitle = 'ข้อสอบพิมพ์และบรรจุซองเสร็จสิ้น';
            notifType = 'success';
        }
        else if (newStatus === 'DELIVERED_OD') {
            notifTitle = 'ส่งมอบซองข้อสอบให้ฝ่ายดำเนินการแล้ว';
            notifType = 'info';
        }
        else if (newStatus === 'READY_FOR_EXAM') {
            notifTitle = 'ข้อสอบจัดเก็บเข้าห้องมั่นคงแล้ว พร้อมสอบ';
            notifType = 'success';
        }
        else if (newStatus === 'REJECTED') {
            notifTitle = 'ข้อสอบถูกส่งกลับแก้ไข';
            notifType = 'warning';
        }
        addNotification(notifTitle, `วิชา ${subjectId} ${subjectName} : ${note || 'สถานะอัปเดตเป็น ' + newStatus}`, 'ALL', notifType, examNo);
        showToast(`อัปเดตสถานะวิชา ${subjectId} เรียบร้อยแล้ว`);
    };
    // Preview & Download & Print handlers
    const handlePreviewExam = (exam) => {
        addAuditLog('VIEW_EXAM', exam.Subject_ID, exam.Subject_Name, `เปิดดูตัวอย่างข้อสอบและตรวจสอบลายน้ำดิจิทัล`);
        setPreviewExam(exam);
    };
    const handleDownloadLogged = (exam) => {
        addAuditLog('DOWNLOAD_EXAM', exam.Subject_ID, exam.Subject_Name, `ดาวน์โหลดไฟล์ข้อสอบต้นฉบับ ${exam.file_name} ออกจากระบบ (เข้ารหัส Audit ID)`);
        showToast(`บันทึก Security Audit Trail การดาวน์โหลดเรียบร้อย`);
    };
    const handlePrintEnvelope = (exam) => {
        setEnvelopeExam(exam);
    };
    const handleEnvelopePrintRecorded = () => {
        if (envelopeExam) {
            addAuditLog('PRINT_ENVELOPE', envelopeExam.Subject_ID, envelopeExam.Subject_Name, `สั่งพิมพ์ใบปะหน้าซองข้อสอบมาตรฐานคณะวิทยาศาสตร์`);
            showToast(`บันทึกประวัติการพิมพ์ใบปะหน้าซองเรียบร้อย`);
        }
    };
    const handlePrintExam = (exam) => {
        addAuditLog('PRINT_EXAM', exam.Subject_ID, exam.Subject_Name, `สั่งพิมพ์ข้อสอบจริงเข้าเครื่องพิมพ์ ยอดพิมพ์ ${exam.total_copies + exam.copies_reserve} ชุด`);
        showToast(`ส่งคำสั่งพิมพ์ข้อสอบวิชา ${exam.Subject_ID} เข้าเครื่องพิมพ์เรียบร้อย`);
        window.print();
    };
    // User Management Handlers (REQ-0002, REQ-0003)
    const handleAddUser = (newUser) => {
        setUsers((prev) => [newUser, ...prev]);
        showToast(`เพิ่มผู้ใช้ ${newUser.name} เรียบร้อยแล้ว`);
    };
    const handleUpdateUser = (updatedUser) => {
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
        if (currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
        showToast(`แก้ไขข้อมูล ${updatedUser.name} สำเร็จ`);
    };
    const handleToggleUserStatus = (userId) => {
        setUsers((prev) => prev.map((u) => {
            if (u.id === userId) {
                const newStatus = u.status === 'active' ? 'inactive' : 'active';
                return { ...u, status: newStatus };
            }
            return u;
        }));
        showToast(`เปลี่ยนสถานะผู้ใช้เรียบร้อย`);
    };
    const handleDeleteUser = (userId) => {
        if (userId === currentUser.id) {
            showToast('ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้');
            return;
        }
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        showToast(`ลบผู้ใช้ออกจากระบบเรียบร้อย`);
    };
    const handleMarkNotificationRead = (notifId) => {
        setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)));
    };
    const handleMarkAllNotificationsRead = () => {
        setNotifications((prev) => prev.map((n) => !n.targetRole || n.targetRole === 'ALL' || n.targetRole === currentUser.role
            ? { ...n, isRead: true }
            : n));
        showToast('ทำเครื่องหมายอ่านการแจ้งเตือนทั้งหมดแล้ว');
    };
    // Login gate (REQ-0001): show the login page until the user is authenticated
    // ระหว่างตรวจ session กับ Supabase — แสดงจอโหลด (กันหน้ากะพริบ)
    if (authStatus === 'loading') {
        return (<div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="font-display text-sm text-slate-500">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
      </div>);
    }
    // Login gate (REQ-0001) — Supabase Auth
    if (authStatus === 'guest') {
        return <LoginPage onLogin={handleLogin}/>;
    }
    return (<div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (<div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg text-xs text-slate-700 animate-slideUp">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4"/>
          </span>
          <span className="font-medium">{toastMessage}</span>
        </div>)}

      {/* Main App Header */}
      <Header currentUser={currentUser} notifications={notifications} onLogout={handleLogout} onMarkNotificationRead={handleMarkNotificationRead} onMarkAllNotificationsRead={handleMarkAllNotificationsRead}/>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser.role === 'Teacher' && (<TeacherView key={currentUser.id} currentUser={currentUser} courses={courses} exams={exams} onOpenUploadModal={handleOpenUploadModal} onPreviewExam={handlePreviewExam} onRemoveExam={handleRemoveExam} onAddNewCourse={handleAddNewCourse} onOpenEnvelope={handlePrintEnvelope}/>)}

        {currentUser.role === 'AudioVisual' && (<AudioVisualView currentUser={currentUser} courses={courses} exams={exams} onPreviewExam={handlePreviewExam} onOpenEnvelope={handlePrintEnvelope} onUpdateExamStatus={handleUpdateExamStatus} onPrintExam={handlePrintExam}/>)}

        {currentUser.role === 'Operations' && (<OperationsView currentUser={currentUser} exams={exams} onOpenEnvelope={handlePrintEnvelope} onUpdateExamStatus={handleUpdateExamStatus}/>)}

        {currentUser.role === 'Admin' && (<AdminView currentUser={currentUser} users={users} auditLogs={auditLogs} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onToggleUserStatus={handleToggleUserStatus} onDeleteUser={handleDeleteUser}/>)}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          ระบบบริหารจัดการและจัดพิมพ์ข้อสอบ คณะวิทยาศาสตร์
        </div>
      </footer>

      {/* Modals */}
      {uploadModalData && (<ExamUploadModal course={uploadModalData.course} existingExam={uploadModalData.existingExam} isReupload={uploadModalData.isReupload} onClose={() => setUploadModalData(null)} onSubmitExam={handleSubmitExamUpload}/>)}

      {previewExam && (<ExamPreviewModal exam={previewExam} currentUser={currentUser} onClose={() => setPreviewExam(null)} onDownloadLogged={handleDownloadLogged} onPrintRequested={handlePrintExam}/>)}

      {envelopeExam && (<ExamEnvelopeCover exam={envelopeExam} onClose={() => setEnvelopeExam(null)} onPrintRecorded={handleEnvelopePrintRecorded}/>)}
    </div>);
}
