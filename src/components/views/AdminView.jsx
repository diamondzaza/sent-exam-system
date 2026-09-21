/**
 * ─────────────────────────────────────────────────────────
 * ชื่อไฟล์: AdminView.jsx
 * หน้าที่ของหน้านี้: แดชบอร์ดผู้ดูแลระบบ — 4 แท็บ:
 *   1. User Management — ตารางผู้ใช้ ค้นหา/กรองบทบาท เพิ่ม/แก้ไข/ลบ
 *      เปิด-ปิดสถานะบัญชี (REQ-0002, REQ-0003)
 *   2. Security Audit Logs — ตารางบันทึกเหตุการณ์ความปลอดภัยทั้ง 9 ประเภท
 *      พร้อมค้นหาและกรอง (เข้าใช้, ดู, ดาวน์โหลด, พิมพ์, อัปโหลด, อัปเดตสถานะ ฯลฯ)
 *   3. Account Requests — คำขอเปิดบัญชีจากผู้สมัครภายนอก (หน้า /request-account)
 *      อนุมัติ = สร้างบัญชีจริงพร้อมรหัสผ่านเริ่มต้น / ปฏิเสธ
 *   4. Security Policies — สวิตช์นโยบายความปลอดภัย (ลายน้ำ, OTP ดาวน์โหลด,
 *      จำกัด IP) — ยังเป็น local state ไม่ได้บันทึกถาวร
 * ผู้ใช้งาน: ผู้ดูแลระบบ (Admin)
 * ─────────────────────────────────────────────────────────
 */
'use client';
import React, { useState, useEffect } from 'react';
import { authFetch } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Search, UserPlus, ShieldAlert, Sliders, Edit2, Trash2, X, ClipboardList, Check, XCircle, AlertCircle, } from 'lucide-react';
export const AdminView = ({ currentUser, users, auditLogs, onAddUser, onUpdateUser, onToggleUserStatus, onDeleteUser, onRefreshUsers, }) => {
    const [activeTab, setActiveTab] = useState('USERS');
    // User Management State
    const [searchUser, setSearchUser] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    // Form fields for Add/Edit User (password ใช้ตอนสร้างบัญชี หรือเปลี่ยนรหัสผ่านตอนแก้ไข)
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        role: 'Teacher',
        email: '',
        tel: '',
        department: 'สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์',
        password: '',
    });
    // Logs Search & Filter
    const [searchLog, setSearchLog] = useState('');
    const [logActionFilter, setLogActionFilter] = useState('ALL');
    // Account Requests State (แท็บคำขอเปิดบัญชี)
    const [accountRequests, setAccountRequests] = useState([]);
    const [approvingReq, setApprovingReq] = useState(null);
    const [approvePassword, setApprovePassword] = useState('');
    const [approveRole, setApproveRole] = useState('Teacher');
    const [reqError, setReqError] = useState('');
    const [reqLoading, setReqLoading] = useState(false);

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
    const filteredUsers = users.filter((u) => {
        const matchesSearch = u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
            u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
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
            username: '',
            name: '',
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
        setFormData({
            username: u.username,
            name: u.name,
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
        if (!formData.username || !formData.name)
            return;
        if (editingUser) {
            onUpdateUser({
                ...editingUser,
                ...formData,
            });
        }
        else {
            // สร้างบัญชีจริง — server จะสร้างบัญชี Auth (ล็อกอินได้) + โปรไฟล์
            // และกำหนด id เป็น uuid เอง (ไม่สร้าง id เองอีกต่อไป)
            const newUser = {
                ...formData,
                status: 'active',
            };
            onAddUser(newUser);
        }
        setShowAddUserModal(false);
    };
    const tabBaseClass = 'px-4 py-2.5 rounded-t-xl transition-all flex items-center space-x-2';
    const tabActiveClass = 'bg-card text-purple-700 font-bold border-t-2 border-purple-600 shadow-2xs';
    const tabInactiveClass = 'text-slate-600 hover:text-slate-900 bg-slate-100/60';
    return (<div className="space-y-6">
      {/* Admin Top Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium">
              ศูนย์ควบคุมผู้ดูแลระบบ
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold">
              ระบบบริหารจัดการผู้ใช้และความปลอดภัยสารสนเทศ
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ผู้ดูแล: {currentUser.name} • จัดการสิทธิ์ผู้ใช้งาน ตรวจสอบบันทึกการเข้าถึง
              และควบคุมมาตรการป้องกันข้อสอบรั่วไหล
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={handleOpenAddUser} className="bg-purple-600 hover:bg-purple-500 border border-purple-400/30">
              <UserPlus className="w-4 h-4"/>
              <span>เพิ่มผู้ใช้ใหม่</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs font-medium overflow-x-auto">
        <button onClick={() => setActiveTab('USERS')} className={`${tabBaseClass} ${activeTab === 'USERS' ? tabActiveClass : tabInactiveClass}`}>
          <Users className="w-4 h-4"/>
          <span>จัดการผู้ใช้งาน</span>
          <span className="bg-purple-100 text-purple-800 px-2 py-0.2 rounded-full text-xs">
            {users.length}
          </span>
        </button>

        <button onClick={() => setActiveTab('LOGS')} className={`${tabBaseClass} ${activeTab === 'LOGS' ? tabActiveClass : tabInactiveClass}`}>
          <Shield className="w-4 h-4"/>
          <span>บันทึกความปลอดภัย</span>
          <span className="bg-rose-100 text-rose-800 px-2 py-0.2 rounded-full text-xs">
            {auditLogs.length}
          </span>
        </button>

        <button onClick={() => setActiveTab('REQUESTS')} className={`${tabBaseClass} ${activeTab === 'REQUESTS' ? tabActiveClass : tabInactiveClass}`}>
          <ClipboardList className="w-4 h-4"/>
          <span>คำขอเปิดบัญชี</span>
          {pendingRequests.length > 0 && (<span className="bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full text-xs font-bold">
              {pendingRequests.length}
            </span>)}
        </button>

        <button onClick={() => setActiveTab('SECURITY_POLICIES')} className={`${tabBaseClass} ${activeTab === 'SECURITY_POLICIES' ? tabActiveClass : tabInactiveClass}`}>
          <Sliders className="w-4 h-4"/>
          <span>นโยบายป้องกันข้อสอบรั่วไหล</span>
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'USERS' && (<div className="space-y-4">
          {/* Search and Filters */}
          <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
              <Input type="text" placeholder="ค้นหาชื่อ, username, อีเมล หรือรหัสผู้ใช้..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="pl-9"/>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-600">กรองบทบาท:</span>
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-auto sm:w-44">
                <option value="ALL">ทุกบทบาท</option>
                <option value="Teacher">อาจารย์ผู้สอน (Teacher)</option>
                <option value="AudioVisual">ฝ่ายโสตฯ (AudioVisual)</option>
                <option value="Operations">ฝ่ายดำเนินการสอบ (Operations)</option>
                <option value="Admin">ผู้ดูแลระบบ (Admin)</option>
              </Select>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-20">รหัส</th>
                    <th className="p-3">ชื่อ - นามสกุล</th>
                    <th className="p-3">Username / อีเมล</th>
                    <th className="p-3">บทบาท</th>
                    <th className="p-3">หน่วยงาน / ภาควิชา</th>
                    <th className="p-3 w-24 text-center">สถานะ</th>
                    <th className="p-3 w-28 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {filteredUsers.map((u) => (<tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-600">{u.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.tel}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-indigo-700">{u.username}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant={u.role === 'Teacher'
                    ? 'success'
                    : u.role === 'AudioVisual'
                        ? 'info'
                        : u.role === 'Operations'
                            ? 'warning'
                            : 'purple'}>
                          {u.role === 'Teacher'
                    ? 'อาจารย์'
                    : u.role === 'AudioVisual'
                        ? 'ฝ่ายโสตฯ'
                        : u.role === 'Operations'
                            ? 'ฝ่ายดำเนินการ'
                            : 'ผู้ดูแลระบบ'}
                        </Badge>
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
                        <div className="flex items-center justify-end space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditUser(u)} className="size-7 text-slate-600 hover:text-indigo-600" title="แก้ไขข้อมูลผู้ใช้">
                            <Edit2 className="w-3.5 h-3.5"/>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                    if (confirm(`ต้องการลบผู้ใช้ ${u.name} หรือไม่?`)) {
                        onDeleteUser(u.id);
                    }
                }} className="size-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="ลบผู้ใช้">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </Button>
                        </div>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>)}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'LOGS' && (<div className="space-y-4">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-950 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5"/>
            <div className="space-y-0.5">
              <p className="font-bold">มาตรการรักษาความปลอดภัยและบันทึกประวัติการเข้าถึง</p>
              <p className="text-amber-900 leading-relaxed">
                ระบบบันทึกการเข้าดู ดาวน์โหลด อัปโหลด และพิมพ์ข้อสอบทุกรายการ พร้อมชื่อผู้ใช้
                IP Address วันเวลา และรหัสวิชา เพื่อการตรวจสอบย้อนหลัง
              </p>
            </div>
          </div>

          <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
              <Input type="text" placeholder="ค้นหาตามผู้ใช้งาน, รหัสวิชา, รายละเอียด, IP..." value={searchLog} onChange={(e) => setSearchLog(e.target.value)} className="pl-9"/>
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
          </Card>

          <Card className="overflow-hidden">
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
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {filteredLogs.map((log) => (<tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
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
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-700">{log.subjectId}</td>
                      <td className="p-3 text-xs text-slate-700">{log.details}</td>
                      <td className="p-3 font-mono text-xs text-slate-500">{log.ipAddress}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>)}

      {/* TAB 3: SECURITY POLICIES */}
      {/* TAB 3: ACCOUNT REQUESTS */}
      {activeTab === 'REQUESTS' && (<div className="space-y-4">
          {reqError && (<div className="flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
              <span>{reqError}</span>
            </div>)}

          {/* คำขอรอพิจารณา */}
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-slate-900">
              รอพิจารณา <span className="text-slate-400 font-normal">({pendingRequests.length})</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={refreshAccountRequests} className="text-indigo-600 hover:text-indigo-800 text-xs">
              รีเฟรช
            </Button>
          </div>

          {pendingRequests.length === 0 && (<Card className="p-8 text-center text-xs text-slate-400">
              ไม่มีคำขอเปิดบัญชีที่รอพิจารณา
            </Card>)}

          {pendingRequests.map((req) => (<Card key={req.id} className="p-4 space-y-2">
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
                  <Button size="sm" onClick={() => { setApprovingReq(req); setApprovePassword(''); setApproveRole('Teacher'); setReqError(''); }} disabled={reqLoading} className="bg-emerald-600 hover:bg-emerald-700">
                    <Check className="w-3.5 h-3.5"/>
                    <span>อนุมัติ</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req)} disabled={reqLoading} className="text-rose-600 hover:bg-rose-50">
                    <XCircle className="w-3.5 h-3.5"/>
                    <span>ปฏิเสธ</span>
                  </Button>
                </div>
              </div>
            </Card>))}

          {/* พิจารณาแล้ว */}
          {reviewedRequests.length > 0 && (<div className="pt-4">
              <h3 className="font-display font-bold text-sm text-slate-900 mb-2">
                พิจารณาแล้ว <span className="text-slate-400 font-normal">({reviewedRequests.length})</span>
              </h3>
              <Card className="divide-y divide-slate-100">
                {reviewedRequests.map((req) => (<div key={req.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800">{req.name}</span>
                      <span className="text-slate-400"> • {req.email} • </span>
                      <span className="text-slate-400">{new Date(req.created_at).toLocaleString('th-TH')}</span>
                    </div>
                    <Badge className={`shrink-0 rounded ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'}`}>
                      {req.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                    </Badge>
                  </div>))}
              </Card>
            </div>)}

          {/* Modal อนุมัติ — ตั้งบทบาท + รหัสผ่านเริ่มต้น */}
          {approvingReq && (<div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-sm">อนุมัติบัญชีใหม่</h3>
                    <p className="text-xs text-slate-400">{approvingReq.name} ({approvingReq.email})</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setApprovingReq(null)} className="text-slate-400 hover:text-white hover:bg-slate-800" aria-label="ปิด">
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
                      <option value="Teacher">อาจารย์ผู้สอน (Teacher)</option>
                      <option value="AudioVisual">ฝ่ายโสตฯ (AudioVisual)</option>
                      <option value="Operations">ฝ่ายดำเนินการสอบ (Operations)</option>
                      <option value="Admin">ผู้ดูแลระบบ (Admin)</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1">รหัสผ่านเริ่มต้น (แจ้งผู้ใช้โดยตรง) *</Label>
                    <Input type="text" value={approvePassword} onChange={(e) => setApprovePassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" minLength={6}/>
                    <p className="mt-1 text-xs text-slate-400">
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
        </div>)}

      {activeTab === 'SECURITY_POLICIES' && (<Card className="p-6 space-y-6">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              การตั้งค่านโยบายความปลอดภัยและป้องกันข้อสอบรั่วไหล
            </h3>
            <p className="text-xs text-slate-500">
              กำหนดเกณฑ์ความเข้มงวดในการเข้าถึงไฟล์ข้อสอบและกระบวนการพิมพ์
            </p>
          </div>

          <div className="space-y-4 divide-y divide-slate-100 text-xs">
            <div className="pt-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-800 text-sm">1. ฝังลายน้ำดิจิทัล</p>
                <p className="text-slate-500">
                  ประทับตราชื่อผู้ใช้งาน วันเวลา และ IP ลงบนข้อสอบทุกหน้าแบบโปร่งแสง
                </p>
              </div>
              <Button onClick={() => setWatermarkEnabled(!watermarkEnabled)} size="sm" className={`rounded-full ${watermarkEnabled ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} variant={watermarkEnabled ? 'default' : 'secondary'}>
                {watermarkEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              </Button>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-800 text-sm">2. บันทึกประวัติการดาวน์โหลด</p>
                <p className="text-slate-500">
                  แจ้งเตือนทันทีเมื่อมีการดาวน์โหลดไฟล์ข้อสอบออกจากระบบ
                </p>
              </div>
              <Button onClick={() => setRequireOTPDownload(!requireOTPDownload)} size="sm" className={`rounded-full ${requireOTPDownload ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} variant={requireOTPDownload ? 'default' : 'secondary'}>
                {requireOTPDownload ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              </Button>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-800 text-sm">3. จำกัดการเข้าถึงเฉพาะเครือข่ายภายใน</p>
                <p className="text-slate-500">
                  เข้าถึงไฟล์ข้อสอบได้เฉพาะจาก IP ภายในคณะ หรือผ่าน VPN มหาวิทยาลัย
                </p>
              </div>
              <Button onClick={() => setRestrictIPs(!restrictIPs)} size="sm" className={`rounded-full ${restrictIPs ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} variant={restrictIPs ? 'default' : 'secondary'}>
                {restrictIPs ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              </Button>
            </div>
          </div>
        </Card>)}

      {/* Add / Edit User Modal */}
      {showAddUserModal && (<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-purple-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-purple-300"/>
                <h3 className="font-display font-bold text-sm">
                  {editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
                </h3>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div>
                <Label className="mb-1">ชื่อ - นามสกุล (พร้อมคำนำหน้า) *</Label>
                <Input type="text" placeholder="เช่น ผศ.ดร.สมเกียรติ สว่างวงศ์" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1">ชื่อผู้ใช้งาน (Username) *</Label>
                  <Input type="text" placeholder="เช่น somkiat.s" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required/>
                </div>

                <div>
                  <Label className="mb-1">บทบาท *</Label>
                  <Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <option value="Teacher">อาจารย์ผู้สอน (Teacher)</option>
                    <option value="AudioVisual">ฝ่ายโสตฯ (AudioVisual)</option>
                    <option value="Operations">ฝ่ายดำเนินการสอบ (Operations)</option>
                    <option value="Admin">ผู้ดูแลระบบ (Admin)</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1">อีเมลสำหรับล็อกอิน *</Label>
                  <Input type="email" placeholder="somkiat@sci.ac.th" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required/>
                </div>

                <div>
                  <Label className="mb-1">เบอร์โทรศัพท์</Label>
                  <Input type="text" placeholder="081-xxx-xxxx" value={formData.tel} onChange={(e) => setFormData({ ...formData, tel: e.target.value })}/>
                </div>
              </div>

              <div>
                <Label className="mb-1">
                  {editingUser ? 'รหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)' : 'รหัสผ่านสำหรับล็อกอิน *'}
                </Label>
                <Input type="password" placeholder="อย่างน้อย 6 ตัวอักษร" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingUser} minLength={6}/>
                {!editingUser && (<p className="mt-1 text-xs text-slate-400">
                    ผู้ใช้จะล็อกอินด้วยอีเมลด้านบน + รหัสผ่านนี้ทันทีหลังบันทึก
                  </p>)}
              </div>

              <div>
                <Label className="mb-1">หน่วยงาน / ภาควิชา</Label>
                <Input type="text" placeholder="เช่น สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}/>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddUserModal(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingUser ? 'บันทึกการแก้ไข' : 'บันทึกผู้ใช้'}
                </Button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
