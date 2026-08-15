import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  StudentRecord, 
  SystemConfig, 
  VocationalCategory, 
  EducationLevel, 
  StudySystem, 
  CurrentStatus, 
  JobMatch, 
  FurtherStudyLevel 
} from '../types';
import { VOCATIONAL_DEPARTMENTS, THAI_PROVINCES, UNEMPLOYED_REASONS } from '../data/constants';
import { 
  User, 
  Phone, 
  MessageSquare, 
  Briefcase, 
  GraduationCap, 
  HelpCircle, 
  CheckCircle2, 
  Check,
  X,
  Clock, 
  Building2, 
  MapPin, 
  DollarSign, 
  BookOpen, 
  Save, 
  Sparkles,
  AlertTriangle,
  Send
} from 'lucide-react';

interface StudentPortalProps {
  student: StudentRecord;
  config: SystemConfig;
  onSave: (updated: StudentRecord) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  config,
  onSave,
}) => {
  // Form State
  const [formData, setFormData] = useState<StudentRecord>({ ...student });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({ ...student });
  }, [student]);

  // When category changes, auto update available departments and pick first
  const handleCategoryChange = (category: VocationalCategory) => {
    const availableDepts = VOCATIONAL_DEPARTMENTS[category] || [];
    setFormData(prev => ({
      ...prev,
      vocationalCategory: category,
      department: availableDepts.includes(prev.department) ? prev.department : (availableDepts[0] || ''),
    }));
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } catch (e) {
      console.log('Confetti error:', e);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.phone || formData.phone.trim().length < 9) {
      newErrors.phone = 'กรุณาระบุหมายเลขโทรศัพท์ที่ติดต่อได้';
    }

    if (!formData.vocationalCategory) {
      newErrors.vocationalCategory = 'กรุณาเลือกประเภทวิชา';
    }

    if (!formData.department) {
      newErrors.department = 'กรุณาเลือกสาขาวิชา';
    }

    if (!formData.currentStatus || formData.currentStatus === 'not_updated') {
      newErrors.currentStatus = 'กรุณาเลือกสถานะปัจจุบันของท่าน';
    }

    if (formData.currentStatus === 'employed') {
      if (!formData.workplaceName?.trim()) newErrors.workplaceName = 'กรุณาระบุชื่อหน่วยงาน/บริษัท';
      if (!formData.jobPosition?.trim()) newErrors.jobPosition = 'กรุณาระบุตำแหน่งงาน';
      if (formData.monthlyIncome === undefined || formData.monthlyIncome < 0) newErrors.monthlyIncome = 'กรุณาระบุรายได้ต่อเดือน';
      if (!formData.jobMatch) newErrors.jobMatch = 'กรุณาเลือกลักษณะงานตรงสาขาวิชาหรือไม่';
      if (!formData.province) newErrors.province = 'กรุณาเลือกจังหวัดที่ตั้งสถานประกอบการ';
    }

    if (formData.currentStatus === 'studying') {
      if (!formData.furtherStudyLevel) newErrors.furtherStudyLevel = 'กรุณาเลือกระดับการศึกษาต่อ';
      if (!formData.institution?.trim()) newErrors.institution = 'กรุณาระบุสถาบัน/มหาวิทยาลัย';
      if (!formData.facultyMajor?.trim()) newErrors.facultyMajor = 'กรุณาระบุคณะ/สาขาวิชา';
    }

    if (formData.currentStatus === 'unemployed') {
      if (!formData.unemployedReason?.trim()) newErrors.unemployedReason = 'กรุณาระบุสาเหตุที่ยังไม่ได้ทำงาน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    const updatedRecord: StudentRecord = {
      ...formData,
      isUpdated: true,
      updatedAt: new Date().toLocaleString('th-TH'),
    };

    onSave(updatedRecord);
    setSaveSuccessNotice(true);
    setShowSuccessDialog(true);
    triggerConfetti();
  };

  const availableDepts = VOCATIONAL_DEPARTMENTS[formData.vocationalCategory] || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Floating Success Toast */}
      {saveSuccessNotice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 border-2 border-emerald-400 animate-bounce duration-300">
          <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base flex items-center gap-1.5">
              <span>บันทึกข้อมูลเรียบร้อยแล้ว</span>
            </div>
            <div className="text-xs text-emerald-100">ระบบได้บันทึกข้อมูลภาวะการมีงานทำเรียบร้อยแล้ว</div>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(false)}
            className="ml-3 text-emerald-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="ปิดการแจ้งเตือน"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Student Profile Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-slate-200/60 border border-slate-200 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/50 via-indigo-50/30 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 text-2xl font-bold">
              {formData.prefix?.includes('นาง') ? '👩‍🎓' : '👨‍🎓'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {formData.prefix}{formData.fullName}
                </h2>
                {formData.isUpdated ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    บันทึกข้อมูลเรียบร้อยแล้ว
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                    รอการบันทึกข้อมูล
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-1 gap-x-4 text-xs sm:text-sm text-slate-600 mt-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">รหัสนักศึกษา</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{formData.studentId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ระดับชั้น & กลุ่มเรียน</span>
                  <span className="font-semibold text-slate-900">{formData.educationLevel} กลุ่ม {formData.studyGroup}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">แผนกวิชา</span>
                  <span className="font-semibold text-slate-900">{formData.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ระบบการเรียน</span>
                  <span className="font-semibold text-slate-900">{formData.studySystem}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Notice Banner inside Card */}
        {saveSuccessNotice && (
          <div className="mt-6 p-4.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-sm flex items-center justify-between gap-3 animate-fadeIn shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <strong className="text-base font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <Check className="w-5 h-5 text-emerald-600" />
                  บันทึกข้อมูลเรียบร้อยแล้ว
                </strong>
                <p className="text-xs text-emerald-700 mt-0.5">
                  ข้อมูลของท่านถูกบันทึกและส่งรายงานไปยัง {config.collegeName} เรียบร้อยแล้ว
                </p>
              </div>
            </div>
            <button
              onClick={() => setSaveSuccessNotice(false)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              title="ปิดการแจ้งเตือน"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Survey Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Contact Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                1. ข้อมูลการติดต่อ
              </h3>
              <p className="text-xs text-slate-500">โปรดระบุเบอร์โทรศัพท์และ Line ID เพื่อให้สถานศึกษาติดต่อประสานงานได้</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                หมายเลขโทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="เช่น 081-234-5678"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                  }`}
                  required
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                Line ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.lineId || ''}
                  onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                  placeholder="เช่น somchai_lineid"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Vocational Category & Academic Field */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                2. ข้อมูลประเภทวิชาและสาขาวิชา
              </h3>
              <p className="text-xs text-slate-500">เลือกประเภทวิชา สาขาวิชา ระดับชั้น และระบบการเรียน</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Category Selector Buttons */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                ประเภทวิชา <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['อุตสาหกรรม', 'บริหารธุรกิจ', 'คหกรรม', 'เทคโนโลยีธุรกิจดิจิทัล'] as VocationalCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`p-3.5 rounded-2xl border text-center transition-all text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      formData.vocationalCategory === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span>
                      {cat === 'อุตสาหกรรม' ? '⚙️' : cat === 'บริหารธุรกิจ' ? '💼' : cat === 'คหกรรม' ? '🍳' : '💻'}
                    </span>
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Department (Chained Dropdown based on Category) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-1">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  สาขาวิชา <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                >
                  {availableDepts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">สาขาวิชาในหมวด {formData.vocationalCategory}</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  ระดับชั้น <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ปวช.', 'ปวส.'] as EducationLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({ ...formData, educationLevel: lvl })}
                      className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        formData.educationLevel === lvl
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  ระบบการเรียน <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['ปกติ', 'ม.6', 'ทวิภาคี'] as StudySystem[]).map((sys) => (
                    <button
                      key={sys}
                      type="button"
                      onClick={() => setFormData({ ...formData, studySystem: sys })}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formData.studySystem === sys
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sys}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Current Status (สถานะปัจจุบัน) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                3. สถานะปัจจุบันของท่าน (ขณะนี้ท่าน) <span className="text-red-500">*</span>
              </h3>
              <p className="text-xs text-slate-500">เลือกสถานะตามความเป็นจริงในปัจจุบัน</p>
            </div>
          </div>

          {/* 3 Status Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
            {/* Employed */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, currentStatus: 'employed' })}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                formData.currentStatus === 'employed'
                  ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">💼</span>
                  {formData.currentStatus === 'employed' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                  )}
                </div>
                <div className="font-bold text-slate-900 text-sm sm:text-base">
                  มีงานทำ / ประกอบอาชีพ
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  ทำงานประจำ, ธุรกิจส่วนตัว, อาชีพอิสระ, ลูกจ้าง
                </p>
              </div>
            </button>

            {/* Studying */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, currentStatus: 'studying' })}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                formData.currentStatus === 'studying'
                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🎓</span>
                  {formData.currentStatus === 'studying' && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">✓</span>
                  )}
                </div>
                <div className="font-bold text-slate-900 text-sm sm:text-base">
                  ศึกษาต่อ
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  กำลังศึกษาต่อในระดับ ปวส., ปริญญาตรี หรือสถาบันอื่นๆ
                </p>
              </div>
            </button>

            {/* Unemployed */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, currentStatus: 'unemployed' })}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                formData.currentStatus === 'unemployed'
                  ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">⏳</span>
                  {formData.currentStatus === 'unemployed' && (
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">✓</span>
                  )}
                </div>
                <div className="font-bold text-slate-900 text-sm sm:text-base">
                  ว่างงาน / กำลังหางาน
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  ยังไม่ได้ทำงาน, รอเกณฑ์ทหาร, กำลังเตรียมสอบ ฯลฯ
                </p>
              </div>
            </button>
          </div>

          {errors.currentStatus && (
            <p className="text-xs text-red-500 mb-4">{errors.currentStatus}</p>
          )}

          {/* Conditional Sub-forms based on status */}

          {/* SUB-FORM 1: EMPLOYED */}
          {formData.currentStatus === 'employed' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-700" />
                <span>รายละเอียดข้อมูลการทำงาน</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    ชื่อหน่วยงาน / บริษัท / สถานประกอบการ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.workplaceName || ''}
                    onChange={(e) => setFormData({ ...formData, workplaceName: e.target.value })}
                    placeholder="เช่น บริษัท โตโยต้า อ่างทอง จำกัด, ธุรกิจส่วนตัว"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  {errors.workplaceName && <p className="text-xs text-red-500 mt-1">{errors.workplaceName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    ตำแหน่งงาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jobPosition || ''}
                    onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                    placeholder="เช่น ช่างซ่อมบำรุง, พนักงานบัญชี, โปรแกรมเมอร์"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  {errors.jobPosition && <p className="text-xs text-red-500 mt-1">{errors.jobPosition}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    รายได้ต่อเดือน (บาท) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                      ฿
                    </div>
                    <input
                      type="number"
                      value={formData.monthlyIncome ?? ''}
                      onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="เช่น 15000"
                      min="0"
                      step="500"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  {errors.monthlyIncome && <p className="text-xs text-red-500 mt-1">{errors.monthlyIncome}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    จังหวัดที่ตั้งสถานประกอบการ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.province || 'อ่างทอง'}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {THAI_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  ลักษณะงานตรงสาขาวิชาหรือไม่ <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['ตรงสาขา', 'ไม่ตรงสาขา', 'ประยุกต์ใช้'] as JobMatch[]).map((match) => (
                    <button
                      key={match}
                      type="button"
                      onClick={() => setFormData({ ...formData, jobMatch: match })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formData.jobMatch === match
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {match === 'ตรงสาขา' ? '🎯 ตรงสาขา' : match === 'ไม่ตรงสาขา' ? '🔄 ไม่ตรงสาขา' : '🧩 ประยุกต์ใช้'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-FORM 2: STUDYING */}
          {formData.currentStatus === 'studying' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-700" />
                <span>รายละเอียดข้อมูลการศึกษาต่อ</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    ระดับการศึกษาต่อ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.furtherStudyLevel || 'ปริญญาตรี'}
                    onChange={(e) => setFormData({ ...formData, furtherStudyLevel: e.target.value as FurtherStudyLevel })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="ปวส.">ระดับ ปวส.</option>
                    <option value="ปริญญาตรี">ระดับ ปริญญาตรี</option>
                    <option value="อื่นๆ">ระดับ อื่นๆ (เช่น หลักสูตรวิชาชีพระยะสั้น)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    สถาบัน / มหาวิทยาลัย <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.institution || ''}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    placeholder="เช่น ม.เทคโนโลยีราชมงคลสุวรรณภูมิ, มรภ.พระนครศรีอยุธยา"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.institution && <p className="text-xs text-red-500 mt-1">{errors.institution}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    คณะ / สาขาวิชา <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.facultyMajor || ''}
                    onChange={(e) => setFormData({ ...formData, facultyMajor: e.target.value })}
                    placeholder="เช่น วิศวกรรมไฟฟ้า, บริหารธุรกิจ สาขาการบัญชี"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.facultyMajor && <p className="text-xs text-red-500 mt-1">{errors.facultyMajor}</p>}
                </div>
              </div>
            </div>
          )}

          {/* SUB-FORM 3: UNEMPLOYED */}
          {formData.currentStatus === 'unemployed' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>สาเหตุที่ยังไม่ได้ทำงาน</span>
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  กรุณาเลือกหรือระบุสาเหตุ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unemployedReason || UNEMPLOYED_REASONS[0]}
                  onChange={(e) => setFormData({ ...formData, unemployedReason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2"
                  required
                >
                  {UNEMPLOYED_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={formData.unemployedReason || ''}
                  onChange={(e) => setFormData({ ...formData, unemployedReason: e.target.value })}
                  placeholder="หรือระบุรายละเอียดเพิ่มเติม..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">
            <span className="font-bold text-slate-700">ข้อควรทราบ:</span> ข้อมูลทั้งหมดจะถูกนำไปใช้เพื่อการประเมินคุณภาพและพัฒนาหลักสูตรของสถานศึกษา
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="btn-save-survey"
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{formData.isUpdated ? 'บันทึกการแก้ไขข้อมูล' : 'ยืนยันและบันทึกข้อมูล'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Success Dialog Modal */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 text-center relative overflow-hidden my-6">
            {/* Top color bar */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
            
            {/* Large Green Checkmark */}
            <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 stroke-[2.5]" />
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
              บันทึกข้อมูลเรียบร้อยแล้ว
            </h3>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              ระบบได้บันทึกข้อมูลภาวะการมีงานทำและการศึกษาต่อของ <strong className="text-slate-900 font-bold">{formData.prefix}{formData.fullName}</strong> เข้าระบบของ{config.collegeName} เรียบร้อยแล้ว
            </p>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowSuccessDialog(false)}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>รับทราบ / ตกลง</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
