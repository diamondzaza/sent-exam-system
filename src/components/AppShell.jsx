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
import { createClient, authFetch } from '@/lib/supabase/client';
import { useUsers } from '@/hooks/useUsers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCourses } from '@/hooks/useCourses';
import { useExams } from '@/hooks/useExams';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
export default function AppShell() {
    // Auth session state (Supabase Auth จริง — 'loading' | 'authenticated' | 'guest')
    // ประกาศก่อน hooks อื่น เพราะ hooks ข้อมูลต้องใช้สถานะนี้เป็นเงื่อนไข
    const authStatus = useAuthSession();
    // ข้อมูลจากฐานข้อมูลผ่าน API (refresh = ดึงค่าล่าสุดจาก server) — ยิงเมื่อล็อกอินแล้วเท่านั้น
    const [users, , refreshUsers] = useUsers(authStatus === 'authenticated');
    const [currentUser, setCurrentUser] = useCurrentUser();
    const [courses, , refreshCourses] = useCourses(authStatus === 'authenticated');
    const [exams, , refreshExams] = useExams(authStatus === 'authenticated');
    const [auditLogs, , refreshAuditLogs] = useAuditLogs(authStatus === 'authenticated');
    const [notifications, setNotifications, refreshNotifications] = useNotifications(authStatus === 'authenticated');
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
    // Realtime — ฟังการเปลี่ยนแปลงในฐานข้อมูล แล้วดึงข้อมูลใหม่ทันที
    // (อาจารย์ส่งข้อสอบ → โสตฯ เห็นทันที ไม่ต้องรีเฟรชหน้า)
    useRealtimeSync(authStatus === 'authenticated', {
        onExamsChange: refreshExams,
        onNotificationsChange: refreshNotifications,
        onAuditLogsChange: refreshAuditLogs,
    });
    // Login (REQ-0001) — รับโปรไฟล์จาก LoginPage (ยืนยันตัวตนผ่าน Supabase Auth แล้ว)
    // session จะเปลี่ยนเป็น 'authenticated' ผ่าน onAuthStateChange เอง
    const handleLogin = (user) => {
        setCurrentUser(user);
        showToast(`เข้าสู่ระบบในฐานะ: ${user.name} (${user.role})`);
        authFetch('/api/audit-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'LOGIN',
                subjectId: user.id,
                subjectName: user.name,
                details: `เข้าสู่ระบบสำเร็จในบทบาท ${user.role}`,
            }),
        });
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
    // Add Security Audit Log helper — เหตุการณ์ที่เกิดฝั่ง browser
    // (เปิดดู/ดาวน์โหลด/พิมพ์) บันทึกผ่าน API เข้าฐานข้อมูล
    const addAuditLog = (action, subjectId, subjectName, details) => {
        authFetch('/api/audit-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, subjectId, subjectName, details }),
        });
    };
    // Teacher Handlers
    const handleOpenUploadModal = (course, existingExam, isReupload = false) => {
        setUploadModalData({ course, existingExam, isReupload });
    };
    const handleSubmitExamUpload = async (examData, isReupload, fileObject) => {
        if (!uploadModalData)
            return;
        // เติมเบอร์โทรจากบัญชีผู้ใช้จริง — ต้องทำก่อนยิง API (payload ที่ส่งไปคือที่บันทึกลง DB)
        if (!examData.teacher_tel) {
            examData.teacher_tel = currentUser.tel || '';
        }
        const existingNo = uploadModalData.existingExam?.E_No;
        let res;
        if (isReupload && existingNo) {
            // Re-upload (REQ-0006) — ล้างข้อมูลการตรวจสอบของรอบก่อน (ส่ง null ไปล้างคอลัมน์)
            res = await authFetch(`/api/exams/${encodeURIComponent(existingNo)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updates: {
                        ...examData,
                        checked_by: null,
                        verified_date: null,
                        rejection_reason: null,
                    },
                    audit: {
                        action: 'REUPLOAD_EXAM',
                        subjectId: examData.Subject_ID || '',
                        subjectName: examData.Subject_Name || '',
                        details: `อาจารย์อัปโหลดไฟล์ใหม่แทนที่เดิม: ${examData.file_name} (${examData.file_size})`,
                    },
                    notify: {
                        title: 'อาจารย์อัปโหลดข้อสอบฉบับใหม่',
                        message: `อาจารย์ได้อัปโหลดไฟล์ใหม่ของวิชา ${examData.Subject_ID} ${examData.Subject_Name} กรุณาตรวจสอบใหม่อีกครั้ง`,
                        targetRole: 'AudioVisual',
                        type: 'info',
                        relatedExamNo: existingNo,
                    },
                }),
            });
        }
        else {
            // New upload (REQ-0004) — server บันทึก audit log + แจ้งเตือนโสตฯ ให้เอง
            res = await authFetch('/api/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(examData),
            });
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'บันทึกข้อมูลไม่สำเร็จ');
            return false;
        }
        // อัปโหลดไฟล์จริง — ขอ Signed Upload URL จาก API แล้ว PUT ไฟล์
        // ตรงเข้า Supabase Storage (ไม่ผ่าน Vercel function — เลี่ยง body limit 4.5MB)
        const eNo = existingNo ?? (await res.json())?.exam?.E_No;
        if (fileObject && eNo) {
            const urlRes = await authFetch(`/api/exams/upload?e_no=${encodeURIComponent(eNo)}&name=${encodeURIComponent(fileObject.name)}`);
            if (!urlRes.ok) {
                const err = await urlRes.json().catch(() => ({}));
                showToast(err.error || 'ขอช่องทางอัปโหลดไม่สำเร็จ');
                await Promise.all([refreshExams(), refreshNotifications(), refreshAuditLogs()]);
                return false;
            }
            const { url: uploadUrl, path } = await urlRes.json();
            const putRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'x-upsert': 'true', // อัปโหลดซ้ำแทนที่ไฟล์เดิม
                    'Content-Type': fileObject.type || 'application/octet-stream',
                },
                body: fileObject,
            });
            if (!putRes.ok) {
                showToast(`อัปโหลดไฟล์ไม่สำเร็จ (HTTP ${putRes.status})`);
                await Promise.all([refreshExams(), refreshNotifications(), refreshAuditLogs()]);
                return false;
            }
            // ลงทะเบียน metadata ของไฟล์ลงตาราง exams ผ่าน API
            const regRes = await authFetch('/api/exams/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    e_no: eNo,
                    file_name: fileObject.name,
                    file_size: `${(fileObject.size / (1024 * 1024)).toFixed(1)} MB`,
                    file_path: path,
                }),
            });
            if (!regRes.ok) {
                const err = await regRes.json().catch(() => ({}));
                showToast(err.error || 'บันทึกข้อมูลไฟล์ไม่สำเร็จ — ลองแก้ไขรายการอีกครั้ง');
                await Promise.all([refreshExams(), refreshNotifications(), refreshAuditLogs()]);
                return false;
            }
        }
        await Promise.all([refreshExams(), refreshNotifications(), refreshAuditLogs()]);
        showToast(isReupload
            ? `อัปโหลดไฟล์ข้อสอบฉบับใหม่วิชา ${examData.Subject_ID} เรียบร้อยแล้ว`
            : `จัดส่งข้อสอบวิชา ${examData.Subject_ID} เข้าสู่ระบบสำเร็จ`);
        return true;
    };
    const handleRemoveExam = async (examNo) => {
        const targetExam = exams.find((e) => e.E_No === examNo);
        if (!targetExam)
            return;
        const res = await authFetch(`/api/exams/${encodeURIComponent(examNo)}`, { method: 'DELETE' });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'ลบข้อสอบไม่สำเร็จ');
            return;
        }
        await Promise.all([refreshExams(), refreshNotifications(), refreshAuditLogs()]);
        showToast(`ยกเลิกการส่งข้อสอบวิชา ${targetExam.Subject_ID} เรียบร้อยแล้ว`);
    };
    const handleAddNewCourse = async (newCourse) => {
        const res = await authFetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCourse),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'เพิ่มรายวิชาไม่สำเร็จ');
            return;
        }
        await refreshCourses();
        showToast(`เพิ่มรายวิชา ${newCourse.Course_id} (${newCourse.Course_Name}) สำเร็จ`);
    };
    // AudioVisual / Operations Status Update Handler (REQ-0010)
    // — server อัปเดตข้อสอบ + บันทึก audit log + แจ้งเตือนในครั้งเดียว
    const handleUpdateExamStatus = async (examNo, newStatus, note) => {
        const exam = exams.find((e) => e.E_No === examNo);
        const subjectId = exam ? exam.Subject_ID : '';
        const subjectName = exam ? exam.Subject_Name : '';
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
        const res = await authFetch(`/api/exams/${encodeURIComponent(examNo)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                updates: {
                    status: newStatus,
                    checked_by: newStatus === 'VERIFIED' ? currentUser.name : undefined,
                    verified_date: newStatus === 'VERIFIED' ? new Date().toISOString() : undefined,
                    print_date: newStatus === 'PRINTED' ? new Date().toISOString() : undefined,
                    rejection_reason: newStatus === 'REJECTED' ? note : undefined,
                },
                audit: {
                    action: 'UPDATE_STATUS',
                    subjectId,
                    subjectName,
                    details: `ปรับสถานะเป็น [${newStatus}] โดย ${currentUser.name}: ${note || ''}`,
                },
                notify: {
                    title: notifTitle,
                    message: `วิชา ${subjectId} ${subjectName} : ${note || 'สถานะอัปเดตเป็น ' + newStatus}`,
                    targetRole: 'ALL',
                    type: notifType,
                    relatedExamNo: examNo,
                },
            }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'อัปเดตสถานะไม่สำเร็จ');
            return;
        }
        await Promise.all([refreshExams(), refreshNotifications(), refreshAuditLogs()]);
        showToast(`อัปเดตสถานะวิชา ${subjectId} เรียบร้อยแล้ว`);
    };
    // Preview & Download & Print handlers
    const handlePreviewExam = (exam) => {
        addAuditLog('VIEW_EXAM', exam.Subject_ID, exam.Subject_Name, `เปิดดูไฟล์ข้อสอบจริง (บันทึก Audit Log)`);
        setPreviewExam(exam);
    };
    // ดาวน์โหลดไฟล์ข้อสอบจริง — ขอ Signed URL จาก API (หมดอายุ 1 ชม.) แล้วเปิดแท็บใหม่
    const handleDownloadLogged = async (exam) => {
        addAuditLog('DOWNLOAD_EXAM', exam.Subject_ID, exam.Subject_Name, `ดาวน์โหลดไฟล์ข้อสอบต้นฉบับ ${exam.file_name} ออกจากระบบ (เข้ารหัส Audit ID)`);
        try {
            const res = await authFetch(`/api/exams/${encodeURIComponent(exam.E_No)}/file`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                showToast(err.error || 'ดาวน์โหลดไม่สำเร็จ');
                return;
            }
            const data = await res.json();
            window.open(data.url, '_blank', 'noopener');
        }
        catch {
            showToast('เกิดข้อผิดพลาดในการดาวน์โหลด');
        }
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
    // User Management Handlers (REQ-0002, REQ-0003) — ทำงานผ่าน API บนฐานข้อมูลจริง
    const handleAddUser = async (newUser) => {
        const res = await authFetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'เพิ่มผู้ใช้ไม่สำเร็จ');
            return;
        }
        await refreshUsers();
        showToast(`เพิ่มผู้ใช้ ${newUser.name} เรียบร้อยแล้ว (ล็อกอินได้ทันทีด้วยอีเมลนี้)`);
    };
    const handleUpdateUser = async (updatedUser) => {
        // password เป็นช่องเสริมของฟอร์ม — ส่งไปเฉพาะเมื่อกรอก (เปลี่ยนรหัสผ่าน)
        const { password, ...profile } = updatedUser;
        const res = await authFetch('/api/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...profile, password: password || undefined }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'แก้ไขผู้ใช้ไม่สำเร็จ');
            return;
        }
        await refreshUsers();
        if (currentUser.id === updatedUser.id) {
            const data = await res.json();
            if (data.user)
                setCurrentUser(data.user);
        }
        showToast(`แก้ไขข้อมูล ${updatedUser.name} สำเร็จ`);
    };
    const handleToggleUserStatus = async (userId) => {
        const target = users.find((u) => u.id === userId);
        const newStatus = target?.status === 'active' ? 'inactive' : 'active';
        const res = await authFetch('/api/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, status: newStatus }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'เปลี่ยนสถานะไม่สำเร็จ');
            return;
        }
        await refreshUsers();
        showToast(`เปลี่ยนสถานะผู้ใช้เรียบร้อย`);
    };
    const handleDeleteUser = async (userId) => {
        if (userId === currentUser.id) {
            showToast('ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้');
            return;
        }
        const res = await authFetch('/api/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'ลบผู้ใช้ไม่สำเร็จ');
            return;
        }
        await refreshUsers();
        showToast(`ลบผู้ใช้ออกจากระบบเรียบร้อย`);
    };
    const handleMarkNotificationRead = (notifId) => {
        setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)));
        authFetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: notifId }),
        });
    };
    const handleMarkAllNotificationsRead = () => {
        setNotifications((prev) => prev.map((n) => !n.targetRole || n.targetRole === 'ALL' || n.targetRole === currentUser.role
            ? { ...n, isRead: true }
            : n));
        authFetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ all: true }),
        });
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
    // ล็อกอินแล้วแต่โปรไฟล์ยังโหลดไม่เสร็จ — แสดงจอโหลด (กัน currentUser null พังหน้าจอ)
    if (!currentUser) {
        return (<div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="font-display text-sm text-slate-500">กำลังโหลดข้อมูลผู้ใช้...</p>
      </div>);
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

        {currentUser.role === 'Admin' && (<AdminView currentUser={currentUser} users={users} auditLogs={auditLogs} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onToggleUserStatus={handleToggleUserStatus} onDeleteUser={handleDeleteUser} onRefreshUsers={refreshUsers}/>)}
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
