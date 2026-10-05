/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: AdminView.jsx
 * หน้าที่ของหน้านี้: แดชบอร์ดผู้ดูแลระบบ 4 หน้าย่อย (แสดงภายใน SidebarShell) —
 *   1. users    : จัดการผู้ใช้งาน — ตารางผู้ใช้ ค้นหา/กรองบทบาท เพิ่ม/แก้ไข/ลบ
 *                 เปิด-ปิดสถานะบัญชี (REQ-0002, REQ-0003)
 *   2. logs     : บันทึกความปลอดภัย — Audit Log ทุกประเภท พร้อมค้นหาและกรอง
 *   3. requests : คำขอเปิดบัญชี — อนุมัติ (สร้างบัญชีจริง + รหัสผ่านเริ่มต้น) / ปฏิเสธ
 *   4. policies : นโยบายป้องกันข้อสอบรั่วไหล (สวิตช์ — local state)
 * ผู้ใช้งาน: ผู้ดูแลระบบ (Admin)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState, useEffect } from 'react';
import { authFetch } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, ShieldAlert, Edit2, Trash2, X, Check, XCircle, AlertCircle, MoveHorizontal, Inbox, } from 'lucide-react';
import { useDialogA11y } from '@/hooks/useEscape';
import { validatePassword } from '@/lib/password';
import { ROLE_OPTIONS, ROLE_BADGE_LABEL } from '@/lib/statusLabels';
export const AdminView = ({ currentUser, users, auditLogs, notifications = [], onMarkNotificationRead, page = 'users', onAddUser, onUpdateUser, onToggleUserStatus, onDeleteUser, onRefreshUsers, }) => {
    // User Management State
    const [searchUser, setSearchUser] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    // Form fields for Add/Edit User — ชื่อ + นามสกุล แยกช่อง แล้วรวมเป็น name ตอนบันทึก
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        role: 'Teacher',
        email: '',
        tel: '',
        department: 'คณะวิทยาศาสตร์',
        password: '',
    });
    // Logs Search & Filter
    const [searchLog, setSearchLog] = useState('');
    const [logActionFilter, setLogActionFilter] = useState('ALL');
    // Account Requests State
    const [accountRequests, setAccountRequests] = useState([]);
    const [approvingReq, setApprovingReq] = useState(null);
    const [approvePassword, setApprovePassword] = useState('');
    const [approveRole, setApproveRole] = useState('Teacher');
    const [reqError, setReqError] = useState('');
    const [reqLoading, setReqLoading] = useState(false);
    // แนะนำบทบาทจากสังกัดที่ผู้สมัครเลือก — กันอนุมัติผิดบทบาท (สาเหตุที่โสตฯ กดเปลี่ยนสถานะไม่ได้)
    const DEPARTMENT_ROLE_MAP = {
        'อาจารย์ผู้สอน (สาขาวิชาต่างๆ)': 'Teacher',
        'หน่วยเทคโนโลยีการศึกษา (ฝ่ายโสตฯ)': 'AudioVisual',
        'ฝ่ายดำเนินการสอบและทะเบียนกลาง': 'Operations',
    };
    const suggestRole = (dept) => DEPARTMENT_ROLE_MAP[dept] || 'Teacher';

    const refreshAccountRequests = async () => {
        try {
            const res = await authFetch('/api/account-requests');
            if (!res.ok)
                throw new Error(String(res.status));
            const data = await res.json();
            setAccountRequests(data.requests ?? []);
        }
        catch {
            // เชื่อมต่อไม่ได้ — แสดงรายการว่าง
        }
    };
    useEffect(() => {
        refreshAccountRequests();
    }, []);

    const pendingRequests = accountRequests.filter((r) => r.status === 'pending');
    const reviewedRequests = accountRequests.filter((r) => r.status !== 'pending');

    const handleApproveRequest = async () => {
        if (!approvingReq)
            return;
        setReqError('');
        setReqLoading(true);
        try {
            const res = await authFetch('/api/account-requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: approvingReq.id,
                    action: 'approve',
                    password: approvePassword,
                    role: approveRole,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setReqError(err.error || 'อนุมัติไม่สำเร็จ');
                return;
            }
            await Promise.all([refreshAccountRequests(), onRefreshUsers?.()]);
            setApprovingReq(null);
            setApprovePassword('');
        }
        finally {
            setReqLoading(false);
        }
    };
    const handleRejectRequest = async (req) => {
        setReqError('');
        setReqLoading(true);
        try {
            const res = await authFetch('/api/account-requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: req.id, action: 'reject' }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setReqError(err.error || 'ปฏิเสธไม่สำเร็จ');
                return;
            }
            await refreshAccountRequests();
        }
        finally {
            setReqLoading(false);
        }
    };
    // Security Policy Toggles
    const [watermarkEnabled, setWatermarkEnabled] = useState(true);
    const [requireOTPDownload, setRequireOTPDownload] = useState(true);
    const [restrictIPs, setRestrictIPs] = useState(true);
    const approveDialogRef = useDialogA11y({ active: Boolean(approvingReq), onClose: () => setApprovingReq(null) });
    const userDialogRef = useDialogA11y({ active: showAddUserModal, onClose: () => setShowAddUserModal(false) });
    // เงื่อนไขรหัสผ่าน — ต้องผ่านครบจึงบันทึกได้ (ตอนสร้างบัญชีใหม่)
    const pwIssues = validatePassword(formData.password);
    const passwordOk = editingUser
        ? formData.password === '' || pwIssues.length === 0
        : pwIssues.length === 0;
    // ป้ายกิจกรรมภาษาไทยสำหรับ Audit Log (โค้ดดิบใช้เป็น fallback)
    const LOG_ACTION_LABELS = {
        VIEW_EXAM: 'เข้าดูข้อสอบ',
        DOWNLOAD_EXAM: 'ดาวน์โหลดข้อสอบ',
        PRINT_EXAM: 'พิมพ์ข้อสอบ',
        PRINT_ENVELOPE: 'พิมพ์หน้าซอง',
        UPLOAD_EXAM: 'อัปโหลดข้อสอบ',
        UPDATE_STATUS: 'ปรับสถานะ',
        LOGIN: 'เข้าสู่ระบบ',
        REUPLOAD_EXAM: 'อัปโหลดไฟล์ใหม่',
        REPORT_ISSUE: 'แจ้งปัญหาการใช้งาน',
    };
    const filteredUsers = users.filter((u) => {
        const matchesSearch = u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
            (u.username || '').toLowerCase().includes(searchUser.toLowerCase()) ||
            u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
            u.id.toLowerCase().includes(searchUser.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });
    const filteredLogs = auditLogs.filter((log) => {
        const matchesSearch = log.userName.toLowerCase().includes(searchLog.toLowerCase()) ||
            log.subjectId.toLowerCase().includes(searchLog.toLowerCase()) ||
            log.details.toLowerCase().includes(searchLog.toLowerCase()) ||
            log.ipAddress.includes(searchLog);
        const matchesAction = logActionFilter === 'ALL' || log.action === logActionFilter;
        return matchesSearch && matchesAction;
    });
    const handleOpenAddUser = () => {
        setEditingUser(null);
        setFormData({
            firstName: '',
            lastName: '',
            role: 'Teacher',
            email: '',
            tel: '',
            department: 'คณะวิทยาศาสตร์',
            password: '',
        });
        setShowAddUserModal(true);
    };
    const handleOpenEditUser = (u) => {
        setEditingUser(u);
        // ชื่อเดิมเป็นชื่อเต็ม — ใส่ทั้งหมดในช่องชื่อ ให้ผู้ใช้แยกนามสกุลเองตามต้องการ
        setFormData({
            firstName: u.name,
            lastName: '',
            role: u.role,
            email: u.email,
            tel: u.tel,
            department: u.department,
            password: '',
        });
        setShowAddUserModal(true);
    };
    const handleSaveUser = (e) => {
        e.preventDefault();
        if (!formData.firstName.trim())
            return;
        // รวมชื่อ + นามสกุล เป็น name เดียว + ตัดช่องว่างส่วนเกินของอีเมล/รหัสผ่าน
        const fullName = [formData.firstName.trim(), formData.lastName.trim()].filter(Boolean).join(' ');
        const payload = {
            ...formData,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            password: formData.password.trim(),
            name: fullName,
        };
        if (editingUser) {
            onUpdateUser({
                ...editingUser,
                ...payload,
            });
        }
        else {
            // สร้างบัญชีจริง — server จะสร้างบัญชี Auth (ล็อกอินได้) + โปรไฟล์
            // และกำหนด id เป็น uuid เอง (ไม่สร้าง id เองอีกต่อไป)
            const newUser = {
                ...payload,
                status: 'active',
            };
            onAddUser(newUser);
        }
        setShowAddUserModal(false);
    };
    // ───────── หน้า 1: จัดการผู้ใช้งาน ─────────
    const renderUsersPage = () => (<>
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
            จัดการผู้ใช้งาน
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            สวัสดี {currentUser.name} — เพิ่มบัญชี แก้ไขสิทธิ์ และระงับการใช้งานของผู้ใช้ทุกบทบาท
          </p>
        </div>
        <Button onClick={handleOpenAddUser} className="shrink-0 ">
          <UserPlus className="w-4 h-4"/>
          <span>เพิ่มผู้ใช้ใหม่</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
            { label: 'บัญชีทั้งหมด', value: users.length },
            { label: 'อาจารย์ผู้สอน', value: users.filter((u) => u.role === 'Teacher').length },
            { label: 'เจ้าหน้าที่', value: users.filter((u) => ['AudioVisual', 'Operations'].includes(u.role)).length },
            { label: 'ระงับชั่วคราว', value: users.filter((u) => u.status !== 'active').length },
        ].map((stat) => (<div key={stat.label} className="rounded-2xl bg-white border border-slate-200/80 px-5 py-4">
              <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>))}
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"/>
          <Input type="text" placeholder="ค้นหาชื่อ ชื่อผู้ใช้ อีเมล หรือรหัสผู้ใช้" aria-label="ค้นหาชื่อ ชื่อผู้ใช้ อีเมล หรือรหัสผู้ใช้" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="pl-9"/>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-600">กรองบทบาท:</span>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-auto sm:w-44">
            <option value="ALL">ทุกบทบาท</option>
            {ROLE_OPTIONS.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-20">รหัส</th>
                <th className="p-3">ชื่อ - นามสกุล</th>
                <th className="p-3">อีเมล</th>
                <th className="p-3">บทบาท</th>
                <th className="p-3">หน่วยงาน / ภาควิชา</th>
                <th className="p-3 w-24 text-center">สถานะ</th>
                <th className="p-3 w-28 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredUsers.length === 0 ? (<tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    ไม่พบผู้ใช้ที่ตรงกับการค้นหา
                  </td>
                </tr>) : (filteredUsers.map((u) => (<tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-600">{u.id}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.tel}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-[#1A4B7A]">{u.email}</div>
                  </td>
                  <td className="p-3">
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">{ROLE_BADGE_LABEL[u.role] || u.role}</Badge>
                  </td>
                  <td className="p-3 text-xs text-slate-600 max-w-xs truncate">
                    {u.department}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => onToggleUserStatus(u.id)} className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${u.status === 'active'
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                      {u.status === 'active' ? 'เปิดใช้งาน' : 'ระงับชั่วคราว'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditUser(u)} className="size-9 text-slate-600 hover:text-[#1A4B7A]" title="แก้ไขข้อมูลผู้ใช้">
                        <Edit2 className="w-3.5 h-3.5"/>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                if (confirm(`ต้องการลบผู้ใช้ ${u.name} หรือไม่?`)) {
                    onDeleteUser(u.id);
                }
            }} className="size-9 text-slate-500 hover:text-rose-600 hover:bg-rose-50" title="ลบผู้ใช้">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </Button>
                    </div>
                  </td>
                </tr>)))}
            </tbody>
          </table>
        </div>
        <p className="sm:hidden flex items-center gap-1.5 px-4 py-2.5 text-[11px] text-slate-500 border-t border-slate-100 bg-slate-50">
          <MoveHorizontal className="w-3.5 h-3.5"/>
          เลื่อนตารางไปทางขวาเพื่อดูข้อมูลทั้งหมด
        </p>
      </div>
    </>);
    // ───────── หน้า 2: บันทึกความปลอดภัย ─────────
    const renderLogsPage = () => (<>
      {/* Hero */}
      <div>        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
          บันทึกความปลอดภัย
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          ประวัติการเข้าถึงข้อสอบทุกรายการ — ตรวจสอบย้อนหลังได้ครบถ้วน
        </p>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-950 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5"/>
        <div className="space-y-0.5">
          <p className="font-bold">มาตรการรักษาความปลอดภัยและบันทึกประวัติการเข้าถึง</p>
          <p className="text-amber-900 leading-relaxed">
            ระบบบันทึกการเข้าดู ดาวน์โหลด อัปโหลด และพิมพ์ข้อสอบทุกรายการ พร้อมชื่อผู้ใช้
            IP Address วันเวลา และรหัสวิชา เพื่อการตรวจสอบย้อนหลัง
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"/>
          <Input type="text" placeholder="ค้นหาตามผู้ใช้งาน รหัสวิชา รายละเอียด หรือ IP" aria-label="ค้นหาตามผู้ใช้งาน รหัสวิชา รายละเอียด หรือ IP" value={searchLog} onChange={(e) => setSearchLog(e.target.value)} className="pl-9"/>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-600">ประเภทกิจกรรม:</span>
          <Select value={logActionFilter} onChange={(e) => setLogActionFilter(e.target.value)} className="w-auto sm:w-52">
            <option value="ALL">ทุกกิจกรรม</option>
            <option value="VIEW_EXAM">เข้าดูข้อสอบ (VIEW_EXAM)</option>
            <option value="DOWNLOAD_EXAM">ดาวน์โหลดข้อสอบ (DOWNLOAD)</option>
            <option value="PRINT_EXAM">พิมพ์ข้อสอบ (PRINT_EXAM)</option>
            <option value="PRINT_ENVELOPE">พิมพ์หน้าซอง (PRINT_ENVELOPE)</option>
            <option value="UPLOAD_EXAM">อัปโหลดข้อสอบ (UPLOAD)</option>
            <option value="UPDATE_STATUS">ปรับสถานะ (UPDATE_STATUS)</option>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-36">วันและเวลา</th>
                <th className="p-3 w-40">ผู้กระทำการ</th>
                <th className="p-3 w-32">ประเภทกิจกรรม</th>
                <th className="p-3 w-28">รหัสวิชา</th>
                <th className="p-3">รายละเอียดการเข้าถึง</th>
                <th className="p-3 w-28 font-mono">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredLogs.length === 0 ? (<tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    ไม่พบรายการที่ตรงกับการค้นหา/ตัวกรอง
                  </td>
                </tr>) : (filteredLogs.map((log) => (<tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-mono text-xs text-slate-500">{log.timestamp}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{log.userName}</div>
                    <div className="text-xs text-slate-500">
                      {log.userId} • {log.role}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={`rounded-md font-mono ${log.action === 'VIEW_EXAM'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : log.action === 'DOWNLOAD_EXAM'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : log.action === 'PRINT_EXAM' || log.action === 'PRINT_ENVELOPE'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : log.action === 'UPLOAD_EXAM'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                      {LOG_ACTION_LABELS[log.action] || log.action}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono font-bold text-[#1A4B7A]">{log.subjectId}</td>
                  <td className="p-3 text-xs text-slate-700">{log.details}</td>
                  <td className="p-3 font-mono text-xs text-slate-500">{log.ipAddress}</td>
                </tr>)))}
            </tbody>
          </table>
        </div>
        <p className="sm:hidden flex items-center gap-1.5 px-4 py-2.5 text-[11px] text-slate-500 border-t border-slate-100 bg-slate-50">
          <MoveHorizontal className="w-3.5 h-3.5"/>
          เลื่อนตารางไปทางขวาเพื่อดูข้อมูลทั้งหมด
        </p>
      </div>
    </>);
    // ───────── หน้า 3: คำขอเปิดบัญชี ─────────
    const renderRequestsPage = () => (<>
      {/* Hero */}
      <div>        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
          คำขอเปิดบัญชี
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          คำขอเปิดบัญชีจากผู้สมัครภายนอก — อนุมัติแล้วระบบสร้างบัญชีล็อกอินให้ทันที
        </p>
      </div>

      {reqError && (<div className="flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
          <span>{reqError}</span>
        </div>)}

      {/* คำขอรอพิจารณา */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-base text-slate-900">
          รอพิจารณา <span className="text-slate-500 font-normal">({pendingRequests.length})</span>
        </h3>
        <Button variant="outline" size="sm" onClick={refreshAccountRequests} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-700 text-xs">
          รีเฟรช
        </Button>
      </div>

      {pendingRequests.length === 0 && (<div className="rounded-2xl bg-white border border-slate-200/80 p-10 text-center text-xs text-slate-500">
          ไม่มีคำขอเปิดบัญชีที่รอพิจารณา
        </div>)}

      {pendingRequests.map((req) => (<div key={req.id} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-bold text-sm text-slate-900">{req.name}</p>
              <p className="text-xs text-slate-500">
                ชื่อผู้ใช้ที่ขอ: <span className="font-mono font-semibold text-slate-700">{req.username}</span> • อีเมล: <span className="font-mono text-slate-700">{req.email}</span>
              </p>
              <p className="text-xs text-slate-500">
                {req.tel && <>โทร: {req.tel} • </>}{req.department && <>สังกัด: {req.department} • </>}
                ยื่นเมื่อ {new Date(req.created_at).toLocaleString('th-TH')}
              </p>
              {req.reason && (<p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  เหตุผล: {req.reason}
                </p>)}
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <Button size="sm" onClick={() => { setApprovingReq(req); setApprovePassword(''); setApproveRole(suggestRole(req.department)); setReqError(''); }} disabled={reqLoading} className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="w-3.5 h-3.5"/>
                <span>อนุมัติ</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req)} disabled={reqLoading} className="text-rose-600 hover:bg-rose-50">
                <XCircle className="w-3.5 h-3.5"/>
                <span>ปฏิเสธ</span>
              </Button>
            </div>
          </div>
        </div>))}

      {/* พิจารณาแล้ว */}
      {reviewedRequests.length > 0 && (<div className="pt-2">
          <h3 className="font-display font-bold text-base text-slate-900 mb-2">
            พิจารณาแล้ว <span className="text-slate-500 font-normal">({reviewedRequests.length})</span>
          </h3>
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm divide-y divide-slate-100">
            {reviewedRequests.map((req) => (<div key={req.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800">{req.name}</span>
                  <span className="text-slate-500"> • {req.email} • </span>
                  <span className="text-slate-500">{new Date(req.created_at).toLocaleString('th-TH')}</span>
                </div>
                <Badge className={`shrink-0 rounded ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'}`}>
                  {req.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                </Badge>
              </div>))}
          </div>
        </div>)}

      {/* Modal อนุมัติ — ตั้งบทบาท + รหัสผ่านเริ่มต้น */}
      {approvingReq && (<div role="dialog" aria-modal="true" aria-labelledby="approve-title" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div ref={approveDialogRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#1A4B7A] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 id="approve-title" className="font-display font-semibold text-sm">อนุมัติบัญชีใหม่</h3>
                <p className="text-xs text-white/60">{approvingReq.name} ({approvingReq.email})</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setApprovingReq(null)} className="text-white/60 hover:text-white hover:bg-white/10" aria-label="ปิด">
                <X className="w-4 h-4"/>
              </Button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              {reqError && (<div className="flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0"/>
                  <span>{reqError}</span>
                </div>)}
              <div>
                <Label className="mb-1">บทบาทในระบบ</Label>
                <Select value={approveRole} onChange={(e) => setApproveRole(e.target.value)}>
                  {ROLE_OPTIONS.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                </Select>
                {approvingReq && approveRole !== suggestRole(approvingReq.department) && (<p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    ⚠ สังกัดผู้สมัครคือ "{approvingReq.department}" ซึ่งน่าจะเป็น {ROLE_BADGE_LABEL[suggestRole(approvingReq.department)] || 'Teacher'} — ตรวจสอบก่อนอนุมัติ
                  </p>)}
              </div>
              <div>
                <Label className="mb-1">รหัสผ่านเริ่มต้น (แจ้งผู้ใช้โดยตรง) *</Label>
                <Input type="password" placeholder="อย่างน้อย 6 ตัวอักษร" autoComplete="new-password" value={approvePassword} onChange={(e) => setApprovePassword(e.target.value)} minLength={6}/>
                <p className="mt-1 text-xs text-slate-500">
                  ระบบจะสร้างบัญชีล็อกอินด้วยอีเมล {approvingReq.email} + รหัสผ่านนี้ทันที
                </p>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <Button variant="outline" size="sm" onClick={() => setApprovingReq(null)}>
                  ยกเลิก
                </Button>
                <Button size="sm" onClick={handleApproveRequest} disabled={reqLoading || approvePassword.length < 6} className="bg-emerald-600 hover:bg-emerald-700">
                  <Check className="w-3.5 h-3.5"/>
                  <span>{reqLoading ? 'กำลังสร้างบัญชี...' : 'ยืนยันอนุมัติ'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>)}
    </>);
    // ───────── หน้า 4: นโยบายป้องกันข้อสอบรั่วไหล ─────────
    const renderPoliciesPage = () => (<>
      {/* Hero */}
      <div>        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
          นโยบายป้องกันข้อสอบรั่วไหล
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          กำหนดเกณฑ์ความเข้มงวดในการเข้าถึงไฟล์ข้อสอบและกระบวนการพิมพ์
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-2">
        <div className="space-y-1 divide-y divide-slate-100 text-xs">
          <div className="py-5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-800 text-sm">1. ฝังลายน้ำดิจิทัล</p>
              <p className="text-slate-500">
                ประทับตราชื่อผู้ใช้งาน วันเวลา และ IP ลงบนข้อสอบทุกหน้าแบบโปร่งแสง
              </p>
            </div>
            <Button onClick={() => setWatermarkEnabled(!watermarkEnabled)} size="sm" className={`rounded-full shrink-0 ${watermarkEnabled ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} variant={watermarkEnabled ? 'default' : 'secondary'}>
              {watermarkEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
            </Button>
          </div>

          <div className="py-5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-800 text-sm">2. บันทึกประวัติการดาวน์โหลด</p>
              <p className="text-slate-500">
                แจ้งเตือนทันทีเมื่อมีการดาวน์โหลดไฟล์ข้อสอบออกจากระบบ
              </p>
            </div>
            <Button onClick={() => setRequireOTPDownload(!requireOTPDownload)} size="sm" className={`rounded-full shrink-0 ${requireOTPDownload ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} variant={requireOTPDownload ? 'default' : 'secondary'}>
              {requireOTPDownload ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
            </Button>
          </div>

          <div className="py-5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-800 text-sm">3. จำกัดการเข้าถึงเฉพาะเครือข่ายภายใน</p>
              <p className="text-slate-500">
                เข้าถึงไฟล์ข้อสอบได้เฉพาะจาก IP ภายในคณะ หรือผ่าน VPN มหาวิทยาลัย
              </p>
            </div>
            <Button onClick={() => setRestrictIPs(!restrictIPs)} size="sm" className={`rounded-full shrink-0 ${restrictIPs ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} variant={restrictIPs ? 'default' : 'secondary'}>
              {restrictIPs ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
            </Button>
          </div>
        </div>
      </div>
    </>);
    // ───────── หน้า 5: การแจ้งปัญหาจากผู้ใช้ทุก role ─────────
    const renderIssuesPage = () => {
        // รายงานปัญหามาพร้อม notification ที่ title ขึ้นต้นด้วย "แจ้งปัญหา:" (จาก /api/issues)
        const issueReports = notifications.filter((n) => n.title && n.title.startsWith('แจ้งปัญหา:'));
        const unreadIssues = issueReports.filter((n) => !n.isRead).length;
        return (<>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            การแจ้งปัญหา
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            รวมปัญหาการใช้งานที่ผู้ใช้ทุก role แจ้งเข้ามา — ตรวจสอบและติดต่อกลับผู้แจ้ง
          </p>
        </div>
        {unreadIssues > 0 && (<Badge className="bg-amber-50 text-amber-800 border-amber-300 shrink-0">
            ใหม่ {unreadIssues} รายการ
          </Badge>)}
      </div>

      <div className="space-y-3">
        {issueReports.length === 0 ? (<div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
            <p className="text-sm text-slate-500">ยังไม่มีรายงานปัญหาเข้ามา</p>
            <p className="text-xs text-slate-500 mt-1">
              เมื่อผู้ใช้กด "แจ้งปัญหา" จากเมนูของตัวเอง รายงานจะแสดงที่นี่
            </p>
          </div>) : (issueReports.map((notif) => (<div key={notif.id} onClick={() => !notif.isRead && onMarkNotificationRead?.(notif.id)} className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 cursor-pointer transition-colors ${!notif.isRead
                ? 'bg-white border-[#1A4B7A]/30 shadow-sm'
                : 'bg-white/70 border-slate-200'}`}>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-slate-900 truncate">{notif.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500 whitespace-nowrap">{notif.timestamp}</span>
                {!notif.isRead && (<span className="w-2 h-2 rounded-full bg-[#1A4B7A] shrink-0" aria-label="ยังไม่ได้อ่าน"/>)}
              </div>
            </div>)))}
      </div>

      {issueReports.length > 0 && (<p className="text-xs text-slate-400">
          กดที่รายการเพื่อทำเครื่องหมายว่าอ่านแล้ว · ติดต่อกลับผู้แจ้งได้ตามข้อมูลบัญชีในตารางผู้ใช้
        </p>)}
    </>);
    };
    return (<div className="max-w-6xl mx-auto space-y-6">
      {page === 'logs' ? renderLogsPage() : page === 'requests' ? renderRequestsPage() : page === 'policies' ? renderPoliciesPage() : page === 'issues' ? renderIssuesPage() : renderUsersPage()}

      {/* Add / Edit User Modal — ฟอร์มซ้าย + คำแนะนำขวา (ธีมเดียวกับฟอร์มอื่นทั้งระบบ) */}
      {showAddUserModal && (<div role="dialog" aria-modal="true" aria-labelledby="user-form-title" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div ref={userDialogRef} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#1A4B7A] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-white/80"/>
                <h3 id="user-form-title" className="font-display font-bold text-sm">
                  {editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
                </h3>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="p-1 text-white/60 hover:text-white rounded-lg" aria-label="ปิด">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
              {/* ฟอร์ม */}
              <form onSubmit={handleSaveUser} className="lg:col-span-3 space-y-4 text-sm">
                {reqError && (<div className="flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
                    <span className="leading-relaxed">{reqError}</span>
                  </div>)}

                {/* ข้อมูลผู้ใช้ */}
                <div>
                  <p className="font-display font-bold text-sm text-slate-900 mb-2.5">ข้อมูลผู้ใช้</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1">ชื่อ (พร้อมคำนำหน้า) <span className="text-rose-500">*</span></Label>
                      <Input type="text" placeholder="ชื่อพร้อมคำนำหน้า" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required/>
                    </div>
                    <div>
                      <Label className="mb-1">นามสกุล <span className="text-rose-500">*</span></Label>
                      <Input type="text" placeholder="นามสกุล" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required/>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label className="mb-1">บทบาท *</Label>
                    <Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                      <option value="Teacher">อาจารย์ผู้สอน (Teacher)</option>
                      <option value="AudioVisual">ฝ่ายโสตฯ (AudioVisual)</option>
                      <option value="Operations">ฝ่ายดำเนินการสอบ (Operations)</option>
                      <option value="Admin">ผู้ดูแลระบบ (Admin)</option>
                    </Select>
                  </div>
                </div>

                {/* ข้อมูลเข้าสู่ระบบ */}
                <div className="pt-2">
                  <p className="font-display font-bold text-sm text-slate-900 mb-2.5">ข้อมูลเข้าสู่ระบบ</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1">อีเมลสำหรับล็อกอิน <span className="text-rose-500">*</span></Label>
                      <Input type="email" placeholder="อีเมลสำหรับล็อกอิน" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required/>
                    </div>
                    <div>
                      <Label className="mb-1">เบอร์โทรศัพท์</Label>
                      <Input type="text" placeholder="เบอร์โทรศัพท์ที่ติดต่อได้" value={formData.tel} onChange={(e) => setFormData({ ...formData, tel: e.target.value })}/>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label className="mb-1">
                      {editingUser ? 'รหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)' : 'รหัสผ่านสำหรับล็อกอิน *'}
                    </Label>
                    <Input type="password" placeholder="อย่างน้อย 8 ตัว มีตัวเลขและพิมพ์ใหญ่-เล็ก" autoComplete="new-password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingUser} minLength={8}/>
                    {/* เช็คลิสต์ความแข็งแรงของรหัสผ่าน — ต้องผ่านครบจึงบันทึกได้ */}
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      {[
                      { ok: /[0-9]/.test(formData.password), label: 'มีตัวเลข' },
                      { ok: /[A-Z]/.test(formData.password), label: 'มีตัวอักษรพิมพ์ใหญ่' },
                      { ok: /[a-z]/.test(formData.password), label: 'มีตัวอักษรพิมพ์เล็ก' },
                      { ok: /[^A-Za-z0-9]/.test(formData.password), label: 'มีอักขระพิเศษ เช่น !@#$%' },
                  ].map((c) => (<p key={c.label} className={`flex items-center gap-1.5 ${c.ok ? 'text-emerald-600' : 'text-slate-500'}`}>
                          <Check className="w-3 h-3 shrink-0"/>
                          <span>{c.label}</span>
                        </p>))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-1">หน่วยงาน / ภาควิชา</Label>
                  <Input type="text" placeholder="เช่น สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}/>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddUserModal(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={!passwordOk} title={passwordOk ? '' : 'กรุณาให้รหัสผ่านผ่านเงื่อนไขครบก่อน'}>
                    {editingUser ? 'บันทึกการแก้ไข' : 'บันทึกผู้ใช้'}
                  </Button>
                </div>
              </form>

              {/* คำแนะนำขวา */}
              <aside className="lg:col-span-2">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4 text-xs lg:sticky lg:top-4">
                  <div>
                    <p className="font-display font-bold text-sm text-slate-900">เกณฑ์ข้อมูล</p>
                    <ul className="mt-2.5 space-y-2 text-slate-600">
                      <li className="flex gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"/><span>อีเมลต้องไม่ซ้ำกับบัญชีที่มีอยู่</span></li>
                      <li className="flex gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"/><span>รหัสผ่านอย่างน้อย 6 ตัวอักษร</span></li>
                      <li className="flex gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"/><span>บทบาทกำหนดสิทธิ์การเข้าถึงของผู้ใช้</span></li>
                    </ul>
                  </div>
                  <div className="border-t border-slate-200 pt-3.5">
                    <p className="font-semibold text-slate-800">หลังบันทึกผู้ใช้</p>
                    <p className="text-slate-600 mt-1.5 leading-relaxed">
                      ระบบสร้างบัญชีล็อกอินทันที — แจ้งอีเมลและรหัสผ่านเริ่มต้นให้ผู้ใช้โดยตรง
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>)}
    </div>);
};
