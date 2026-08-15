/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CurrentUser, StudentRecord, SystemConfig } from './types';
import { 
  getStoredStudents, 
  getStoredConfig, 
  updateStudentRecord, 
  deleteStudentRecord, 
  resetStudentRecord, 
  saveStoredConfig 
} from './services/storage';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { StudentPortal } from './components/StudentPortal';
import { AdvisorPortal } from './components/AdvisorPortal';
import { AdminPortal } from './components/AdminPortal';
import { GoogleSheetModal } from './components/GoogleSheetModal';

export default function App() {
  // State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [config, setConfig] = useState<SystemConfig>(getStoredConfig());
  const [showGoogleSheetModal, setShowGoogleSheetModal] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedStudents = getStoredStudents();
    const loadedConfig = getStoredConfig();
    setStudents(loadedStudents);
    setConfig(loadedConfig);
  }, []);

  // Update current user's studentData if student list changes
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

  const handleDeleteStudent = (id: string) => {
    const updatedList = deleteStudentRecord(id);
    setStudents(updatedList);
  };

  const handleResetStudent = (id: string) => {
    const updatedList = resetStudentRecord(id);
    setStudents(updatedList);
  };

  const handleSaveConfig = (updatedConfig: Partial<SystemConfig>) => {
    const saved = saveStoredConfig(updatedConfig);
    setConfig(saved);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Prompt',sans-serif] selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        config={config}
        onLogout={handleLogout}
        onOpenSettings={() => setShowGoogleSheetModal(true)}
        onOpenQuickLogin={() => setCurrentUser(null)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {!currentUser ? (
          <LoginView
            students={students}
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
            config={config}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
            onResetStudent={handleResetStudent}
            onOpenGoogleSheetSettings={() => setShowGoogleSheetModal(true)}
          />
        ) : (
          <LoginView
            students={students}
            collegeName={config.collegeName}
            systemTitle={config.systemTitle}
            academicYear={config.academicYear}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </main>

      {/* Google Sheet & System Config Modal */}
      {showGoogleSheetModal && (
        <GoogleSheetModal
          config={config}
          allStudents={students}
          onSaveConfig={handleSaveConfig}
          onClose={() => setShowGoogleSheetModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{config.collegeName}</span>
            <span>• {config.systemTitle}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>งานแนะแนวและส่งเสริมการมีงานทำ</span>
            <span>|</span>
            <span>Google Apps Script Engine Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
