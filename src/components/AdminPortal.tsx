import React, { useState, useMemo } from 'react';
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
import { exportStudentsToCsv } from '../services/storage';
import { VOCATIONAL_DEPARTMENTS, THAI_PROVINCES, UNEMPLOYED_REASONS } from '../data/constants';
import { ConfirmationSlip } from './ConfirmationSlip';
import { 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  Briefcase, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  Target, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  FileSpreadsheet, 
  Building2, 
  Layers, 
  Eye, 
  X, 
  Save, 
  DollarSign, 
  BarChart3, 
  PieChart as PieIcon,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface AdminPortalProps {
  students: StudentRecord[];
  config: SystemConfig;
  onSaveStudent: (student: StudentRecord) => void;
  onDeleteStudent: (id: string) => void;
  onResetStudent: (id: string) => void;
  onOpenGoogleSheetSettings: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  students,
  config,
  onSaveStudent,
  onDeleteStudent,
  onResetStudent,
  onOpenGoogleSheetSettings,
}) => {
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSystem, setFilterSystem] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Active view tab in admin: overview dashboard vs student database
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students'>('dashboard');

  // Modals
  const [studentModalMode, setStudentModalMode] = useState<'add' | 'edit' | null>(null);
  const [currentEditStudent, setCurrentEditStudent] = useState<StudentRecord | null>(null);
  const [viewingSlipStudent, setViewingSlipStudent] = useState<StudentRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Pie chart hover state
  const [hoveredPie, setHoveredPie] = useState<string | null>(null);

  // Overall Statistics Calculations
  const stats = useMemo(() => {
    const total = students.length;
    const updated = students.filter(s => s.isUpdated).length;
    const pending = total - updated;
    const employed = students.filter(s => s.isUpdated && s.currentStatus === 'employed');
    const studying = students.filter(s => s.isUpdated && s.currentStatus === 'studying');
    const unemployed = students.filter(s => s.isUpdated && s.currentStatus === 'unemployed');

    const directMatch = employed.filter(s => s.jobMatch === 'ตรงสาขา').length;
    const appliedMatch = employed.filter(s => s.jobMatch === 'ประยุกต์ใช้').length;

    const responseRate = total > 0 ? Math.round((updated / total) * 100) : 0;
    const employmentRate = updated > 0 ? Math.round((employed.length / updated) * 100) : 0;
    const studyRate = updated > 0 ? Math.round((studying.length / updated) * 100) : 0;
    const matchRate = employed.length > 0 ? Math.round((directMatch / employed.length) * 100) : 0;

    // Average income
    const incomes = employed
      .map(s => s.monthlyIncome)
      .filter((inc): inc is number => inc !== undefined && inc > 0);
    const avgIncome = incomes.length > 0 ? Math.round(incomes.reduce((a, b) => a + b, 0) / incomes.length) : 0;

    return {
      total,
      updated,
      pending,
      employedCount: employed.length,
      studyingCount: studying.length,
      unemployedCount: unemployed.length,
      directMatchCount: directMatch,
      appliedMatchCount: appliedMatch,
      responseRate,
      employmentRate,
      studyRate,
      matchRate,
      avgIncome,
    };
  }, [students]);

  // Department breakdown data
  const departmentBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; updated: number; employed: number; studying: number; unemployed: number; category: string }>();

    students.forEach(s => {
      const dept = s.department || 'ไม่ระบุ';
      const existing = map.get(dept) || { total: 0, updated: 0, employed: 0, studying: 0, unemployed: 0, category: s.vocationalCategory };
      existing.total += 1;
      if (s.isUpdated) {
        existing.updated += 1;
        if (s.currentStatus === 'employed') existing.employed += 1;
        if (s.currentStatus === 'studying') existing.studying += 1;
        if (s.currentStatus === 'unemployed') existing.unemployed += 1;
      }
      map.set(dept, existing);
    });

    return Array.from(map.entries()).map(([dept, data]) => {
      const responseRate = data.total > 0 ? Math.round((data.updated / data.total) * 100) : 0;
      const employmentRate = data.updated > 0 ? Math.round((data.employed / data.updated) * 100) : 0;
      return { dept, ...data, responseRate, employmentRate };
    }).sort((a, b) => b.total - a.total);
  }, [students]);

  // Filtered students for database table
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Search
      const matchesSearch = 
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.includes(searchQuery) ||
        (s.phone && s.phone.includes(searchQuery)) ||
        (s.studyGroup && s.studyGroup.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filters
      const matchesCat = filterCategory === 'all' || s.vocationalCategory === filterCategory;
      const matchesDept = filterDept === 'all' || s.department === filterDept;
      const matchesLevel = filterLevel === 'all' || s.educationLevel === filterLevel;
      const matchesSystem = filterSystem === 'all' || s.studySystem === filterSystem;

      let matchesStatus = true;
      if (filterStatus === 'updated') matchesStatus = s.isUpdated;
      else if (filterStatus === 'pending') matchesStatus = !s.isUpdated;
      else if (filterStatus === 'employed') matchesStatus = s.isUpdated && s.currentStatus === 'employed';
      else if (filterStatus === 'studying') matchesStatus = s.isUpdated && s.currentStatus === 'studying';
      else if (filterStatus === 'unemployed') matchesStatus = s.isUpdated && s.currentStatus === 'unemployed';

      return matchesSearch && matchesCat && matchesDept && matchesLevel && matchesSystem && matchesStatus;
    });
  }, [students, searchQuery, filterCategory, filterDept, filterLevel, filterSystem, filterStatus]);

  // Overall Pie Data
  const pieData = [
    { key: 'employed', label: 'มีงานทำ / ประกอบอาชีพ', count: stats.employedCount, color: '#10b981', bg: 'bg-emerald-500' },
    { key: 'studying', label: 'ศึกษาต่อ', count: stats.studyingCount, color: '#3b82f6', bg: 'bg-blue-500' },
    { key: 'unemployed', label: 'ว่างงาน / กำลังหางาน', count: stats.unemployedCount, color: '#f59e0b', bg: 'bg-amber-500' },
    { key: 'pending', label: 'ยังไม่ได้ตอบแบบสำรวจ', count: stats.pending, color: '#94a3b8', bg: 'bg-slate-400' },
  ];

  const totalPie = stats.total || 1;
  let cumulative = 0;
  const pieSlices = pieData.map(item => {
    const percent = (item.count / totalPie) * 100;
    const startAngle = (cumulative / 100) * 360;
    cumulative += percent;
    const endAngle = (cumulative / 100) * 360;
    return { ...item, percent: Math.round(percent), startAngle, endAngle };
  });

  // Open Add Student Modal
  const handleOpenAddModal = () => {
    setCurrentEditStudent({
      id: `std-${Date.now()}`,
      studentId: '',
      prefix: 'นาย',
      fullName: '',
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
    });
    setStudentModalMode('add');
  };

  // Open Edit Student Modal
  const handleOpenEditModal = (s: StudentRecord) => {
    setCurrentEditStudent({ ...s });
    setStudentModalMode('edit');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-purple-500/20 text-2xl">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                ศูนย์บริหารจัดการข้อมูลภาวะการมีงานทำ ({config.collegeName})
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                ผู้ดูแลระบบ (Admin Portal)
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-0.5">
              ติดตามสถิติผู้สำเร็จการศึกษาประจำปีการศึกษา {config.academicYear} • เชื่อมต่อ Google Sheet แบบเรียลไทม์
            </p>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-admin-google-sheet"
            onClick={onOpenGoogleSheetSettings}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>จัดการระบบ & Google Sheet</span>
          </button>

          <button
            id="btn-admin-export-csv"
            onClick={() => exportStudentsToCsv(students, `รายงานภาวะการมีงานทำ_${config.collegeName}_ปี${config.academicYear}.csv`)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Excel / CSV</span>
          </button>

          <button
            id="btn-admin-add-student"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มนักศึกษาใหม่</span>
          </button>
        </div>
      </div>

      {/* Main Tabs (Dashboard Overview vs Student Database) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>สถิติภาพรวม & แผนกวิชา (Analytics)</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการฐานข้อมูลนักเรียน ({students.length} คน)</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD & ANALYTICS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Employment Rate */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-2">
                <span>อัตราการมีงานทำ</span>
                <Briefcase className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                {stats.employmentRate}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                มีงานทำ {stats.employedCount} จากผู้ตอบ {stats.updated} คน
              </div>
            </div>

            {/* Further Study Rate */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-blue-700 text-xs font-bold mb-2">
                <span>อัตราศึกษาต่อ</span>
                <GraduationCap className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">
                {stats.studyRate}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ศึกษาต่อ {stats.studyingCount} คน (ปวส./ป.ตรี)
              </div>
            </div>

            {/* Direct Match Rate */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-indigo-700 text-xs font-bold mb-2">
                <span>ความตรงสาขาวิชา</span>
                <Target className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700">
                {stats.matchRate}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ตรงสาขา {stats.directMatchCount} • ประยุกต์ {stats.appliedMatchCount} คน
              </div>
            </div>

            {/* Response Rate */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-purple-700 text-xs font-bold mb-2">
                <span>อัตราการตอบแบบสำรวจ</span>
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">
                {stats.responseRate}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ตอบแล้ว {stats.updated} / ทั้งหมด {stats.total} คน
              </div>
            </div>
          </div>

          {/* Overall Pie Chart & Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart Card (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    แผนภูมิวงกลมภาพรวมทั้งวิทยาลัย (Overall Status Breakdown)
                  </h3>
                  <p className="text-xs text-slate-500">
                    สัดส่วนสถานะการมีงานทำและการศึกษาต่อของผู้สำเร็จการศึกษาทั้งหมด ({stats.total} คน)
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                {/* SVG Donut */}
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 shrink-0">
                  <svg viewBox="-1.2 -1.2 2.4 2.4" className="transform -rotate-90 w-full h-full">
                    {pieSlices.map((slice, index) => {
                      if (slice.count === 0) return null;
                      const start = (slice.startAngle * Math.PI) / 180;
                      const end = (slice.endAngle * Math.PI) / 180;
                      const x1 = Math.cos(start);
                      const y1 = Math.sin(start);
                      const x2 = Math.cos(end);
                      const y2 = Math.sin(end);
                      const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
                      const isHovered = hoveredPie === slice.key;

                      const pathData = `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArc} 1 ${x2} ${y2} Z`;

                      return (
                        <path
                          key={index}
                          d={pathData}
                          fill={slice.color}
                          onMouseEnter={() => setHoveredPie(slice.key)}
                          onMouseLeave={() => setHoveredPie(null)}
                          className={`transition-all cursor-pointer ${
                            isHovered ? 'opacity-90 stroke-white stroke-2' : 'hover:opacity-90'
                          }`}
                        />
                      );
                    })}
                    <circle cx="0" cy="0" r="0.65" fill="white" />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {hoveredPie
                        ? pieData.find(p => p.key === hoveredPie)?.count
                        : `${stats.employmentRate}%`}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {hoveredPie
                        ? pieData.find(p => p.key === hoveredPie)?.label
                        : 'อัตรามีงานทำ'}
                    </span>
                  </div>
                </div>

                {/* Slices Legend Table */}
                <div className="w-full space-y-3">
                  {pieData.map((item) => {
                    const percent = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                    const isHovered = hoveredPie === item.key;
                    return (
                      <div
                        key={item.key}
                        onMouseEnter={() => setHoveredPie(item.key)}
                        onMouseLeave={() => setHoveredPie(null)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isHovered ? 'bg-slate-50 border-slate-400 shadow-xs' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3.5 h-3.5 rounded-md ${item.bg}`} />
                          <span className="text-xs sm:text-sm font-semibold text-slate-800">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-900">{item.count} คน</span>
                          <span className="text-xs font-semibold text-slate-500 w-12 text-right">({percent}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Income & Extra Insights Card (1 col) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                  ข้อมูลรายได้เฉลี่ย & คุณภาพ
                </h3>
                <p className="text-xs text-slate-500">
                  รายได้ของบัณฑิตสายอาชีวศึกษาที่ทำงาน
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-center">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  รายได้เฉลี่ยต่อเดือน (บาท)
                </span>
                <span className="text-3xl font-extrabold text-emerald-900">
                  ฿{stats.avgIncome.toLocaleString()}
                </span>
                <p className="text-xs text-emerald-700 mt-1">
                  สำรวจจากผู้ตอบแบบสำรวจที่มีงานทำ
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-600">ทำงานตรงสาขา</span>
                  <strong className="text-slate-900 font-bold">{stats.directMatchCount} คน ({stats.matchRate}%)</strong>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-600">ทำงานประยุกต์ใช้</span>
                  <strong className="text-slate-900 font-bold">{stats.appliedMatchCount} คน</strong>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-600">ยังไม่ตอบแบบสำรวจ (คงเหลือ)</span>
                  <strong className="text-amber-700 font-bold">{stats.pending} คน</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Department Breakdown Table & Bar Visualization */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  การวิเคราะห์ข้อมูลแยกตามแผนกวิชา (Department Breakdown)
                </h3>
                <p className="text-xs text-slate-500">
                  สรุปผลการมีงานทำ อัตราศึกษาต่อ และอัตราการตอบแบบสำรวจของแต่ละแผนกวิชา
                </p>
              </div>
            </div>

            {/* Department Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">แผนกวิชา / สาขา</th>
                    <th className="py-3 px-4 text-center">ประเภทวิชา</th>
                    <th className="py-3 px-4 text-center">จำนวนทั้งหมด</th>
                    <th className="py-3 px-4 text-center">ตอบแล้ว (คน)</th>
                    <th className="py-3 px-4 text-center">อัตราตอบ (%)</th>
                    <th className="py-3 px-4 text-center">มีงานทำ (คน)</th>
                    <th className="py-3 px-4 text-center">ศึกษาต่อ (คน)</th>
                    <th className="py-3 px-4">อัตราการมีงานทำ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {departmentBreakdown.map((item) => (
                    <tr key={item.dept} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.dept}
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">
                        {item.total}
                      </td>
                      <td className="py-3.5 px-4 text-center text-emerald-700 font-bold">
                        {item.updated}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-purple-700">{item.responseRate}%</span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-emerald-800 font-semibold">
                        {item.employed}
                      </td>
                      <td className="py-3.5 px-4 text-center text-blue-800 font-semibold">
                        {item.studying}
                      </td>
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all"
                              style={{ width: `${item.employmentRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-10 text-right">
                            {item.employmentRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT DATABASE TABLE & MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
          {/* Table Header & Multi-Filters */}
          <div className="p-6 border-b border-slate-200 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  ฐานข้อมูลนักเรียนทั้งหมด ({filteredStudents.length}/{students.length} คน)
                </h3>
                <p className="text-xs text-slate-500">
                  แสดงเครื่องหมาย ✅ สำหรับนักเรียนที่อัปเดตข้อมูลแล้ว และ ⏳ สำหรับผู้ที่ยังไม่ได้อัปเดต
                </p>
              </div>

              {/* Search */}
              <div className="relative min-w-[260px]">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ, รหัสนักศึกษา, กลุ่มเรียน..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">ประเภทวิชา</label>
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setFilterDept('all');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="all">ทุกประเภทวิชา</option>
                  <option value="อุตสาหกรรม">อุตสาหกรรม</option>
                  <option value="บริหารธุรกิจ">บริหารธุรกิจ</option>
                  <option value="คหกรรม">คหกรรม</option>
                  <option value="เทคโนโลยีธุรกิจดิจิทัล">เทคโนโลยีธุรกิจดิจิทัล</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">แผนกวิชา</label>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="all">ทุกแผนกวิชา</option>
                  {departmentBreakdown.map(d => (
                    <option key={d.dept} value={d.dept}>{d.dept}</option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">ระดับชั้น</label>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="all">ทุกระดับชั้น</option>
                  <option value="ปวช.">ปวช.</option>
                  <option value="ปวส.">ปวส.</option>
                </select>
              </div>

              {/* Study System Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">ระบบการเรียน</label>
                <select
                  value={filterSystem}
                  onChange={(e) => setFilterSystem(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="all">ทุกระบบ</option>
                  <option value="ปกติ">ปกติ</option>
                  <option value="ม.6">ม.6</option>
                  <option value="ทวิภาคี">ทวิภาคี</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">สถานะข้อมูล</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="updated">✅ อัปเดตแล้ว</option>
                  <option value="pending">⏳ ยังไม่อัปเดต</option>
                  <option value="employed">💼 มีงานทำ</option>
                  <option value="studying">🎓 ศึกษาต่อ</option>
                  <option value="unemployed">⏳ ว่างงาน</option>
                </select>
              </div>
            </div>
          </div>

          {/* Database Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 text-center w-12">สถานะ</th>
                  <th className="py-3 px-4">รหัสนักศึกษา</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4">ระดับ / กลุ่ม</th>
                  <th className="py-3 px-4">แผนกวิชา</th>
                  <th className="py-3 px-4">สถานะปัจจุบัน</th>
                  <th className="py-3 px-4">รายละเอียดงาน / สถาบัน</th>
                  <th className="py-3 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      ไม่พบข้อมูลนักศึกษาตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std) => (
                    <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                      {/* Status Icon */}
                      <td className="py-3.5 px-4 text-center">
                        {std.isUpdated ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold" title="อัปเดตข้อมูลแล้ว">
                            ✅
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold" title="ยังไม่ได้อัปเดตข้อมูล">
                            ⏳
                          </span>
                        )}
                      </td>

                      {/* Student ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {std.studentId}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{std.prefix}{std.fullName}</div>
                        <div className="text-[11px] text-slate-400">โทร: {std.phone || '-'}</div>
                      </td>

                      {/* Level & Group */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold">{std.educationLevel} {std.studyGroup}</div>
                        <div className="text-slate-400">({std.studySystem})</div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                        {std.department}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {std.isUpdated ? (
                          std.currentStatus === 'employed' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              มีงานทำ
                            </span>
                          ) : std.currentStatus === 'studying' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              ศึกษาต่อ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              ว่างงาน
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            ยังไม่อัปเดต
                          </span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {std.currentStatus === 'employed'
                          ? `${std.workplaceName || '-'} (${std.jobPosition || '-'}) - ฿${std.monthlyIncome?.toLocaleString() || '-'}`
                          : std.currentStatus === 'studying'
                          ? `${std.institution || '-'} (${std.facultyMajor || '-'})`
                          : std.currentStatus === 'unemployed'
                          ? `${std.unemployedReason || 'ยังไม่ได้ทำงาน'}`
                          : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {std.isUpdated && (
                            <button
                              onClick={() => setViewingSlipStudent(std)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="ดูใบยืนยัน"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditModal(std)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {std.isUpdated && (
                            <button
                              onClick={() => onResetStudent(std.id)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="รีเซ็ตสถานะเป็นยังไม่อัปเดต"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteConfirmId(std.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบนักศึกษา"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STUDENT */}
      {studentModalMode && currentEditStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <span>
                  {studentModalMode === 'add' ? 'เพิ่มข้อมูลนักศึกษาใหม่' : `แก้ไขข้อมูลนักศึกษา (${currentEditStudent.studentId})`}
                </span>
              </div>
              <button
                onClick={() => setStudentModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSaveStudent(currentEditStudent);
                setStudentModalMode(null);
              }}
              className="p-6 space-y-4 text-xs sm:text-sm max-h-[75vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสนักศึกษา 11 หลัก *</label>
                  <input
                    type="text"
                    value={currentEditStudent.studentId}
                    onChange={(e) => setCurrentEditStudent({ ...currentEditStudent, studentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    placeholder="65201010001"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">คำนำหน้า *</label>
                  <select
                    value={currentEditStudent.prefix}
                    onChange={(e) => setCurrentEditStudent({ ...currentEditStudent, prefix: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="นาง">นาง</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ - นามสกุล *</label>
                  <input
                    type="text"
                    value={currentEditStudent.fullName}
                    onChange={(e) => setCurrentEditStudent({ ...currentEditStudent, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    placeholder="สมชาย ใจดี"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ประเภทวิชา *</label>
                  <select
                    value={currentEditStudent.vocationalCategory}
                    onChange={(e) => {
                      const cat = e.target.value as VocationalCategory;
                      const depts = VOCATIONAL_DEPARTMENTS[cat] || [];
                      setCurrentEditStudent({
                        ...currentEditStudent,
                        vocationalCategory: cat,
                        department: depts[0] || '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="อุตสาหกรรม">อุตสาหกรรม</option>
                    <option value="บริหารธุรกิจ">บริหารธุรกิจ</option>
                    <option value="คหกรรม">คหกรรม</option>
                    <option value="เทคโนโลยีธุรกิจดิจิทัล">เทคโนโลยีธุรกิจดิจิทัล</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สาขาวิชา *</label>
                  <select
                    value={currentEditStudent.department}
                    onChange={(e) => setCurrentEditStudent({ ...currentEditStudent, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {(VOCATIONAL_DEPARTMENTS[currentEditStudent.vocationalCategory] || []).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">กลุ่มเรียน *</label>
                  <input
                    type="text"
                    value={currentEditStudent.studyGroup}
                    onChange={(e) => setCurrentEditStudent({ ...currentEditStudent, studyGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    placeholder="เช่น ช.3ชย.1, ส.2ชฟ.1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ระดับชั้น *</label>
                  <select
                    value={currentEditStudent.educationLevel}
                    onChange={(e) => setCurrentEditStudent({ ...currentEditStudent, educationLevel: e.target.value as EducationLevel })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="ปวช.">ปวช.</option>
                    <option value="ปวส.">ปวส.</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ระบบการเรียน *</label>
                  <select
                    value={currentEditStudent.studySystem}
                    onChange={(e) => setCurrentEditStudent({ ...currentEditStudent, studySystem: e.target.value as StudySystem })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="ปกติ">ปกติ</option>
                    <option value="ม.6">ม.6</option>
                    <option value="ทวิภาคี">ทวิภาคี</option>
                  </select>
                </div>
              </div>

              {/* Status Toggle in Admin */}
              <div className="pt-2">
                <label className="block font-semibold text-slate-700 mb-1.5">สถานะการตอบแบบสำรวจ</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'not_updated', label: '⏳ ยังไม่อัปเดต' },
                    { id: 'employed', label: '💼 มีงานทำ' },
                    { id: 'studying', label: '🎓 ศึกษาต่อ' },
                    { id: 'unemployed', label: '⏳ ว่างงาน' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        const status = st.id as CurrentStatus;
                        setCurrentEditStudent({
                          ...currentEditStudent,
                          currentStatus: status,
                          isUpdated: status !== 'not_updated',
                          updatedAt: status !== 'not_updated' ? (currentEditStudent.updatedAt || new Date().toLocaleString('th-TH')) : null,
                        });
                      }}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        currentEditStudent.currentStatus === st.id
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional sub fields */}
              {currentEditStudent.currentStatus === 'employed' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ชื่อหน่วยงาน/บริษัท</label>
                      <input
                        type="text"
                        value={currentEditStudent.workplaceName || ''}
                        onChange={(e) => setCurrentEditStudent({ ...currentEditStudent, workplaceName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        placeholder="ชื่อบริษัท..."
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ตำแหน่งงาน</label>
                      <input
                        type="text"
                        value={currentEditStudent.jobPosition || ''}
                        onChange={(e) => setCurrentEditStudent({ ...currentEditStudent, jobPosition: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        placeholder="ตำแหน่งงาน..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">รายได้ต่อเดือน (บาท)</label>
                      <input
                        type="number"
                        value={currentEditStudent.monthlyIncome ?? ''}
                        onChange={(e) => setCurrentEditStudent({ ...currentEditStudent, monthlyIncome: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        placeholder="18000"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ความตรงสาขา</label>
                      <select
                        value={currentEditStudent.jobMatch || 'ตรงสาขา'}
                        onChange={(e) => setCurrentEditStudent({ ...currentEditStudent, jobMatch: e.target.value as JobMatch })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="ตรงสาขา">ตรงสาขา</option>
                        <option value="ไม่ตรงสาขา">ไม่ตรงสาขา</option>
                        <option value="ประยุกต์ใช้">ประยุกต์ใช้</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStudentModalMode(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">ยืนยันการลบข้อมูลนักศึกษา</h3>
            <p className="text-xs sm:text-sm text-slate-600">
              ท่านต้องการลบข้อมูลนักศึกษารายนี้ออกจากฐานข้อมูลใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteStudent(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Slip Modal */}
      {viewingSlipStudent && (
        <ConfirmationSlip
          student={viewingSlipStudent}
          config={config}
          onClose={() => setViewingSlipStudent(null)}
        />
      )}
    </div>
  );
};
