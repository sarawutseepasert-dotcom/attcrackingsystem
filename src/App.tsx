/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CurrentUser, StudentRecord, SystemConfig, AdvisorAccount } from './types';
import { 
  getStoredStudents, 
  getStoredConfig, 
  getStoredAdvisors, 
  updateStudentRecord, 
  deleteStudentRecord, 
  resetStudentRecord, 
  updateAdvisorRecord,
  deleteAdvisorRecord,
  batchImportStudents,
  saveStoredConfig,
  subscribeRealtimeUpdates,
  TAB_INSTANCE_ID
} from './services/storage';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { StudentPortal } from './components/StudentPortal';
import { AdvisorPortal } from './components/AdvisorPortal';
import { AdminPortal } from './components/AdminPortal';
import { SystemSettingsModal } from './components/SystemSettingsModal';
import { Radio } from 'lucide-react';

export default function App() {
  // State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorAccount[]>([]);
  const [config, setConfig] = useState<SystemConfig>(getStoredConfig());
  const [showSystemSettingsModal, setShowSystemSettingsModal] = useState(false);
  const [realtimeToast, setRealtimeToast] = useState<{ message: string; timestamp: number } | null>(null);

  // Load initial data on mount
  useEffect(() => {
    const loadedStudents = getStoredStudents();
    const loadedConfig = getStoredConfig();
    const loadedAdvisors = getStoredAdvisors();
    setStudents(loadedStudents);
    setConfig(loadedConfig);
    setAdvisors(loadedAdvisors);
  }, []);

  // Subscribe to Real-time data changes across tabs and within the app
  useEffect(() => {
    const unsubscribe = subscribeRealtimeUpdates((event) => {
      const freshStudents = getStoredStudents();
      const freshAdvisors = getStoredAdvisors();
      const freshConfig = getStoredConfig();

      setStudents(freshStudents);
      setAdvisors(freshAdvisors);
      setConfig(freshConfig);

      // Show toast if message is from another instance or has detail
      if (event.detail && event.senderId !== TAB_INSTANCE_ID) {
        setRealtimeToast({
          message: event.detail,
          timestamp: Date.now(),
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-dismiss real-time toast
  useEffect(() => {
    if (realtimeToast) {
      const timer = setTimeout(() => {
        setRealtimeToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [realtimeToast]);

  // Update current user's studentData if student list changes in real time
  useEffect(() => {
    if (currentUser?.role === 'student' && currentUser.studentData) {
      const freshStudent = students.find(s => s.studentId === currentUser.studentData?.studentId);
      if (freshStudent) {
        setCurrentUser(prev => prev ? { ...prev, studentData: freshStudent } : null);
      }
    }
  }, [students]);

  // Handlers
  const handleLoginSuccess = (user: CurrentUser) => {
    setCurrentUser(user);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveStudent = (student: StudentRecord) => {
    const updatedList = updateStudentRecord(student);
    setStudents(updatedList);
  };

  const handleBatchImportStudents = (imported: StudentRecord[], mode: 'merge' | 'replace') => {
    const updatedList = batchImportStudents(imported, mode);
    setStudents(updatedList);
  };

  const handleDeleteStudent = (id: string) => {
    const updatedList = deleteStudentRecord(id);
    setStudents(updatedList);
  };

  const handleResetStudent = (id: string) => {
    const updatedList = resetStudentRecord(id);
    setStudents(updatedList);
  };

  const handleSaveAdvisor = (advisor: AdvisorAccount) => {
    const updatedList = updateAdvisorRecord(advisor);
    setAdvisors(updatedList);
  };

  const handleDeleteAdvisor = (idOrUsername: string) => {
    const updatedList = deleteAdvisorRecord(idOrUsername);
    setAdvisors(updatedList);
  };

  const handleSaveConfig = (updatedConfig: Partial<SystemConfig>) => {
    const saved = saveStoredConfig(updatedConfig);
    setConfig(saved);
  };

  const handleRefreshServer = () => {
    const freshStudents = getStoredStudents();
    const freshAdvisors = getStoredAdvisors();
    const freshConfig = getStoredConfig();
    setStudents([...freshStudents]);
    setAdvisors([...freshAdvisors]);
    setConfig(freshConfig);
    return freshStudents.length;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Prompt',sans-serif] selection:bg-blue-600 selection:text-white relative">
      {/* Real-time sync floating notification toast */}
      {realtimeToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-indigo-500/40 flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-xs">
              <div className="font-bold text-emerald-400 flex items-center gap-1">
                <Radio className="w-3 h-3" />
                <span>Real-time Live Sync</span>
              </div>
              <div className="text-slate-300 mt-0.5">{realtimeToast.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        config={config}
        onLogout={handleLogout}
        onOpenSettings={() => setShowSystemSettingsModal(true)}
        onOpenQuickLogin={() => setCurrentUser(null)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {!currentUser ? (
          <LoginView
            students={students}
            advisors={advisors}
            collegeName={config.collegeName}
            systemTitle={config.systemTitle}
            academicYear={config.academicYear}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : currentUser.role === 'student' && currentUser.studentData ? (
          <StudentPortal
            student={currentUser.studentData}
            config={config}
            onSave={handleSaveStudent}
          />
        ) : currentUser.role === 'advisor' && currentUser.advisorData ? (
          <AdvisorPortal
            advisor={currentUser.advisorData}
            allStudents={students}
            config={config}
            onUpdateStudent={handleSaveStudent}
          />
        ) : currentUser.role === 'admin' ? (
          <AdminPortal
            students={students}
            advisors={advisors}
            config={config}
            onSaveStudent={handleSaveStudent}
            onBatchImportStudents={handleBatchImportStudents}
            onDeleteStudent={handleDeleteStudent}
            onResetStudent={handleResetStudent}
            onSaveAdvisor={handleSaveAdvisor}
            onDeleteAdvisor={handleDeleteAdvisor}
            onOpenGoogleSheetSettings={() => setShowSystemSettingsModal(true)}
            onRefreshServer={handleRefreshServer}
          />
        ) : (
          <LoginView
            students={students}
            advisors={advisors}
            collegeName={config.collegeName}
            systemTitle={config.systemTitle}
            academicYear={config.academicYear}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </main>

      {/* System Settings & Real-time Modal */}
      {showSystemSettingsModal && (
        <SystemSettingsModal
          config={config}
          allStudents={students}
          onSaveConfig={handleSaveConfig}
          onClose={() => setShowSystemSettingsModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{config.collegeName}</span>
            <span>• {config.systemTitle}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Real-time Live Sync Engine Active
            </span>
            <span>|</span>
            <span>งานครูที่ปรึกษาและการแนะแนว</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
