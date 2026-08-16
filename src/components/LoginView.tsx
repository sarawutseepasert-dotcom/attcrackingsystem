import React, { useState } from 'react';
import { UserRole, StudentRecord, CurrentUser, AdvisorAccount } from '../types';
import { STUDY_GROUPS_LIST } from '../data/constants';
import { 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  School,
  AlertCircle
} from 'lucide-react';

interface LoginViewProps {
  students: StudentRecord[];
  advisors?: AdvisorAccount[];
  collegeName: string;
  systemTitle: string;
  academicYear: string;
  onLoginSuccess: (user: CurrentUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  students,
  advisors = [],
  collegeName,
  systemTitle,
  academicYear,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<UserRole>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudentLogin = (studentIdInput: string, passInput: string) => {
    setErrorMsg('');
    const cleanId = studentIdInput.trim();
    const cleanPass = passInput.trim();

    if (!cleanId || !cleanPass) {
      setErrorMsg('กรุณากรอกรหัสนักศึกษา 11 หลักให้ครบถ้วน');
      return;
    }

    if (cleanId !== cleanPass) {
      setErrorMsg('สำหรับนักศึกษา รหัสผ่านต้องเป็นรหัสนักศึกษา 11 หลักของตนเอง');
      return;
    }

    // Find student in directory
    const found = students.find(s => s.studentId === cleanId);
    if (found) {
      onLoginSuccess({
        role: 'student',
        username: found.studentId,
        displayName: `${found.prefix}${found.fullName}`,
        studentData: found,
      });
    } else {
      // If student not found in seed, create or alert
      // Allow flexible login with dummy created profile if 11 digits
      if (cleanId.length === 11 && /^\d+$/.test(cleanId)) {
        const newStd: StudentRecord = {
          id: `std-${cleanId}`,
          studentId: cleanId,
          prefix: 'นาย',
          fullName: 'นักศึกษาใหม่ (ลงทะเบียน)',
          educationLevel: 'ปวช.',
          studyGroup: 'ช.3ชย.1',
          department: 'ช่างยนต์',
          vocationalCategory: 'อุตสาหกรรม',
          studySystem: 'ปกติ',
          phone: '',
          lineId: '',
          isUpdated: false,
          updatedAt: null,
          currentStatus: 'not_updated',
        };
        onLoginSuccess({
          role: 'student',
          username: cleanId,
          displayName: `${newStd.prefix}${newStd.fullName}`,
          studentData: newStd,
        });
      } else {
        setErrorMsg('ไม่พบรหัสนักศึกษานี้ในระบบ (รหัสนักศึกษาต้องเป็นตัวเลข 11 หลัก เช่น 65201010001)');
      }
    }
  };

  const handleAdvisorLogin = (groupInput: string, passInput: string) => {
    setErrorMsg('');
    const cleanGroup = groupInput.trim();
    const cleanPass = passInput.trim();

    if (!cleanGroup) {
      setErrorMsg('กรุณาระบุกลุ่มเรียน/แผนกวิชา');
      return;
    }

    if (cleanPass !== '0001') {
      setErrorMsg('รหัสผ่านครูที่ปรึกษาไม่ถูกต้อง');
      return;
    }

    // Search in dynamic advisors list first
    const foundAdvisor = advisors.find(a => 
      a.username.toLowerCase() === cleanGroup.toLowerCase() || 
      a.studyGroup.toLowerCase() === cleanGroup.toLowerCase()
    );

    if (foundAdvisor) {
      onLoginSuccess({
        role: 'advisor',
        username: foundAdvisor.studyGroup || foundAdvisor.username,
        displayName: foundAdvisor.name,
        advisorData: foundAdvisor,
      });
      return;
    }

    const groupMeta = STUDY_GROUPS_LIST.find(g => g.code.toLowerCase() === cleanGroup.toLowerCase());
    const groupName = groupMeta ? groupMeta.name : `กลุ่มเรียน ${cleanGroup}`;
    const advisorName = groupMeta ? groupMeta.advisor : `ครูที่ปรึกษาประจำกลุ่ม ${cleanGroup}`;
    const dept = groupMeta ? groupMeta.dept : 'แผนกวิชาช่าง';
    const cat = groupMeta ? groupMeta.cat : 'อุตสาหกรรม';

    onLoginSuccess({
      role: 'advisor',
      username: cleanGroup,
      displayName: advisorName,
      advisorData: {
        username: cleanGroup,
        name: advisorName,
        department: dept,
        studyGroup: cleanGroup,
        category: cat,
      }
    });
  };

  const handleAdminLogin = (userInput: string, passInput: string) => {
    setErrorMsg('');
    const cleanUser = userInput.trim().toLowerCase();
    const cleanPass = passInput.trim();

    if (cleanUser === 'admin' && cleanPass === '4321') {
      onLoginSuccess({
        role: 'admin',
        username: 'admin',
        displayName: 'ผู้ดูแลระบบส่วนกลาง (Admin)',
      });
    } else {
      setErrorMsg('Username หรือ Password ผู้ดูแลระบบไม่ถูกต้อง');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (activeTab === 'student') {
        handleStudentLogin(username, password);
      } else if (activeTab === 'advisor') {
        handleAdvisorLogin(username, password);
      } else if (activeTab === 'admin') {
        handleAdminLogin(username, password);
      }
      setLoading(false);
    }, 150);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center max-w-5xl mx-auto">
      {/* Header Title Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-semibold mb-3 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>ระบบสารสนเทศติดตามผู้สำเร็จการศึกษา อาชีวศึกษา</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {systemTitle}
        </h2>
        <p className="mt-2 text-base text-slate-600 font-medium max-w-2xl mx-auto">
          {collegeName} ประจำปีการศึกษา {academicYear}
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200 overflow-hidden">
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/80 p-1.5 sm:p-2 gap-1.5 sm:gap-2">
          {/* Student Tab */}
          <button
            id="tab-role-student"
            type="button"
            onClick={() => {
              setActiveTab('student');
              setUsername('');
              setPassword('');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'student'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200 ring-2 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span>นักศึกษา / ศิษย์เก่า</span>
          </button>

          {/* Advisor Tab */}
          <button
            id="tab-role-advisor"
            type="button"
            onClick={() => {
              setActiveTab('advisor');
              setUsername('');
              setPassword('');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'advisor'
                ? 'bg-white text-amber-800 shadow-sm border border-slate-200 ring-2 ring-amber-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            <span>ครูที่ปรึกษา</span>
          </button>

          {/* Admin Tab */}
          <button
            id="tab-role-admin"
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setUsername('');
              setPassword('');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-purple-800 shadow-sm border border-slate-200 ring-2 ring-purple-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span>ผู้ดูแลระบบ (Admin)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-10">
          <div className="max-w-lg mx-auto">
            {/* Role Header Instructions */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              {activeTab === 'student' && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700 mt-0.5">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700">
                    <strong className="block font-bold text-slate-900 text-sm mb-1">
                      เข้าสู่ระบบสำหรับนักศึกษา / ผู้สำเร็จการศึกษา
                    </strong>
                    เข้าสู่ระบบด้วย <span className="text-blue-700 font-bold underline">Username และ Password</span> เป็น{' '}
                    <strong>รหัสนักศึกษา 11 หลัก</strong> ของตนเอง
                  </div>
                </div>
              )}

              {activeTab === 'advisor' && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 mt-0.5">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700">
                    <strong className="block font-bold text-slate-900 text-sm mb-1">
                      เข้าสู่ระบบสำหรับครูที่ปรึกษา
                    </strong>
                    กรุณากรอก <strong>กลุ่มเรียน / แผนกวิชา</strong> และรหัสผ่านเพื่อเข้าสู่ระบบ
                  </div>
                </div>
              )}

              {activeTab === 'admin' && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-800 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700">
                    <strong className="block font-bold text-slate-900 text-sm mb-1">
                      เข้าสู่ระบบสำหรับผู้ดูแลระบบ (Admin)
                    </strong>
                    กรุณากรอก Username และ Password ของผู้ดูแลระบบส่วนกลาง
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  {activeTab === 'student'
                    ? 'รหัสนักศึกษา (Username 11 หลัก)'
                    : activeTab === 'advisor'
                    ? 'รหัสกลุ่มเรียน / แผนกวิชา (Username)'
                    : 'ชื่อผู้ใช้งาน (Username)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={
                      activeTab === 'student'
                        ? 'กรอกรหัสนักศึกษา 11 หลัก'
                        : activeTab === 'advisor'
                        ? 'กรอกรหัสกลุ่มเรียน / แผนกวิชา'
                        : 'กรอก Username'
                    }
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-slate-900 transition-all bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  {activeTab === 'student'
                    ? 'รหัสผ่าน (Password คือ รหัสนักศึกษา 11 หลัก)'
                    : 'รหัสผ่าน (Password)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      activeTab === 'student'
                        ? 'กรอกรหัสนักศึกษา 11 หลักอีกครั้ง'
                        : 'กรอกรหัสผ่าน'
                    }
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-slate-900 transition-all bg-white"
                    required
                  />
                </div>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
