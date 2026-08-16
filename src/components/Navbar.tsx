import React from 'react';
import { CurrentUser, SystemConfig } from '../types';
import { 
  GraduationCap, 
  User, 
  LogOut, 
  Database, 
  CheckCircle2, 
  Building2, 
  FileSpreadsheet, 
  Layers,
  Radio
} from 'lucide-react';

interface NavbarProps {
  currentUser: CurrentUser | null;
  config: SystemConfig;
  onLogout: () => void;
  onOpenSettings?: () => void;
  onOpenQuickLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  config,
  onLogout,
  onOpenSettings,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top institution bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium tracking-wide">
              สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) • กระทรวงศึกษาธิการ
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>สถานะ: <strong>อัปเดตข้อมูลแบบเรียลไทม์ (Live Sync)</strong></span>
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline">ปีการศึกษา {config.academicYear}</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {config.collegeName}
                </h1>
                <span className="hidden md:inline-flex text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  ATTC Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium line-clamp-1">
                {config.systemTitle} (ปีการศึกษา {config.academicYear})
              </p>
            </div>
          </div>

          {/* User Status / Role / Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <>
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-900 flex items-center justify-end gap-1.5">
                    <span>{currentUser.displayName}</span>
                    {currentUser.role === 'admin' && (
                      <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                        Admin
                      </span>
                    )}
                    {currentUser.role === 'advisor' && (
                      <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        ครูที่ปรึกษา ({currentUser.username})
                      </span>
                    )}
                    {currentUser.role === 'student' && (
                      <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                        นักศึกษา
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {currentUser.role === 'student' && currentUser.studentData
                      ? `กลุ่ม ${currentUser.studentData.studyGroup} • ${currentUser.studentData.department}`
                      : currentUser.role === 'advisor' && currentUser.advisorData
                      ? `แผนก ${currentUser.advisorData.department}`
                      : 'ผู้ดูแลระบบส่วนกลาง'}
                  </div>
                </div>

                {currentUser.role === 'admin' && onOpenSettings && (
                  <button
                    id="btn-nav-settings"
                    onClick={onOpenSettings}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 cursor-pointer"
                    title="ตั้งค่าระบบ & สถานะ Real-time"
                  >
                    <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    <span className="hidden md:inline">ตั้งค่าระบบ (Real-time)</span>
                  </button>
                )}

                <button
                  id="btn-nav-logout"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ออกจากระบบ</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
