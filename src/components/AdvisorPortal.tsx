import React, { useState, useMemo } from 'react';
import { StudentRecord, AdvisorAccount, SystemConfig, CurrentStatus } from '../types';
import { exportStudentsToCsv, generateLineReminderText } from '../services/storage';
import { ConfirmationSlip } from './ConfirmationSlip';
import { 
  UserCheck, 
  Users, 
  CheckCircle2, 
  Clock, 
  Download, 
  Copy, 
  Search, 
  Filter, 
  Edit3, 
  Eye, 
  MessageSquare, 
  Briefcase, 
  GraduationCap, 
  HelpCircle, 
  Check, 
  AlertCircle,
  X,
  Printer,
  ChevronDown
} from 'lucide-react';

interface AdvisorPortalProps {
  advisor: AdvisorAccount;
  allStudents: StudentRecord[];
  config: SystemConfig;
  onUpdateStudent: (student: StudentRecord) => void;
}

export const AdvisorPortal: React.FC<AdvisorPortalProps> = ({
  advisor,
  allStudents,
  config,
  onUpdateStudent,
}) => {
  // Current active study group filter (defaults to advisor's assigned group)
  const [selectedGroup, setSelectedGroup] = useState<string>(advisor.studyGroup);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Selected student for detail/edit modal
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [viewingSlipStudent, setViewingSlipStudent] = useState<StudentRecord | null>(null);
  const [lineCopiedToast, setLineCopiedToast] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // Filter students by selected study group
  const groupStudents = useMemo(() => {
    return allStudents.filter(s => s.studyGroup.toLowerCase() === selectedGroup.toLowerCase());
  }, [allStudents, selectedGroup]);

  // Statistics calculation for this group
  const stats = useMemo(() => {
    const total = groupStudents.length;
    const updated = groupStudents.filter(s => s.isUpdated).length;
    const pending = total - updated;
    const employed = groupStudents.filter(s => s.isUpdated && s.currentStatus === 'employed').length;
    const studying = groupStudents.filter(s => s.isUpdated && s.currentStatus === 'studying').length;
    const unemployed = groupStudents.filter(s => s.isUpdated && s.currentStatus === 'unemployed').length;
    const responseRate = total > 0 ? Math.round((updated / total) * 100) : 0;
    const employmentRate = updated > 0 ? Math.round((employed / updated) * 100) : 0;

    return { total, updated, pending, employed, studying, unemployed, responseRate, employmentRate };
  }, [groupStudents]);

  // Filtered student list for table
  const displayedStudents = useMemo(() => {
    return groupStudents.filter(s => {
      // Search
      const matchesSearch = 
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.includes(searchQuery) ||
        (s.phone && s.phone.includes(searchQuery));

      // Status
      let matchesStatus = true;
      if (statusFilter === 'updated') matchesStatus = s.isUpdated;
      else if (statusFilter === 'pending') matchesStatus = !s.isUpdated;
      else if (statusFilter === 'employed') matchesStatus = s.isUpdated && s.currentStatus === 'employed';
      else if (statusFilter === 'studying') matchesStatus = s.isUpdated && s.currentStatus === 'studying';
      else if (statusFilter === 'unemployed') matchesStatus = s.isUpdated && s.currentStatus === 'unemployed';

      return matchesSearch && matchesStatus;
    });
  }, [groupStudents, searchQuery, statusFilter]);

  // Handle LINE Reminder Copy
  const handleCopyLineReminder = () => {
    const unupdated = groupStudents.filter(s => !s.isUpdated);
    const text = generateLineReminderText(unupdated, selectedGroup, config.collegeName, config.academicYear);
    navigator.clipboard.writeText(text);
    setLineCopiedToast(true);
    setTimeout(() => setLineCopiedToast(false), 3500);
  };

  // Pie chart calculation
  const pieData = [
    { key: 'employed', label: 'มีงานทำ', count: stats.employed, color: '#10b981', bg: 'bg-emerald-500' },
    { key: 'studying', label: 'ศึกษาต่อ', count: stats.studying, color: '#3b82f6', bg: 'bg-blue-500' },
    { key: 'unemployed', label: 'ว่างงาน', count: stats.unemployed, color: '#f59e0b', bg: 'bg-amber-500' },
    { key: 'pending', label: 'ยังไม่อัปเดต', count: stats.pending, color: '#94a3b8', bg: 'bg-slate-400' },
  ];

  const totalPie = stats.total || 1;
  let cumulativePercent = 0;

  const pieSlices = pieData.map(item => {
    const percent = (item.count / totalPie) * 100;
    const startAngle = (cumulativePercent / 100) * 360;
    cumulativePercent += percent;
    const endAngle = (cumulativePercent / 100) * 360;
    return { ...item, percent: Math.round(percent), startAngle, endAngle };
  });

  // SVG Arc generator
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Info Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 text-2xl">
            👨‍🏫
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {advisor.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                ครูที่ปรึกษา
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-0.5">
              กลุ่มเรียนในที่ปรึกษา: <strong className="text-slate-900 font-bold">{selectedGroup}</strong> • แผนกวิชา{advisor.department}
            </p>
          </div>
        </div>

        {/* Group Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-copy-line-reminder"
            onClick={handleCopyLineReminder}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            title="คัดลอกรายชื่อนักเรียนที่ยังไม่ตอบแบบสำรวจเพื่อส่งเข้า LINE"
          >
            {lineCopiedToast ? <Check className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            <span>{lineCopiedToast ? 'คัดลอกข้อความ LINE แล้ว!' : '📢 คัดลอกแจ้งเตือนกลุ่ม LINE'}</span>
          </button>

          <button
            onClick={() => exportStudentsToCsv(groupStudents, `รายงานกลุ่ม_${selectedGroup}_เทคนิคอ่างทอง.csv`)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>นักเรียนทั้งหมด</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total} <span className="text-xs font-normal text-slate-500">คน</span></div>
          <div className="text-xs text-slate-500 mt-1">ประจำกลุ่มเรียน {selectedGroup}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-2">
            <span>อัปเดตข้อมูลแล้ว (✅)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{stats.updated} <span className="text-xs font-normal text-slate-500">คน</span></div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">อัตราตอบกลับ {stats.responseRate}%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold mb-2">
            <span>ยังไม่ได้อัปเดต (⏳)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">{stats.pending} <span className="text-xs font-normal text-slate-500">คน</span></div>
          <div className="text-xs text-amber-600 font-semibold mt-1">คงเหลือ {100 - stats.responseRate}%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold mb-2">
            <span>มีงานทำ / ศึกษาต่อ</span>
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">{stats.employed + stats.studying} <span className="text-xs font-normal text-slate-500">คน</span></div>
          <div className="text-xs text-blue-600 font-semibold mt-1">มีงานทำ {stats.employed} • เรียนต่อ {stats.studying}</div>
        </div>
      </div>

      {/* Interactive Pie Chart & Status Breakdown */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="w-full md:w-1/2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              สัดส่วนสถานะนักเรียนในที่ปรึกษา (Interactive Pie Chart)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              วางเมาส์เหนือชิ้นส่วนของแผนภูมิเพื่อดูจำนวนและสัดส่วนเปอร์เซ็นต์
            </p>

            {/* Interactive Status List */}
            <div className="space-y-3">
              {pieData.map((item) => {
                const percent = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                const isHovered = hoveredSlice === item.key;
                return (
                  <div
                    key={item.key}
                    onMouseEnter={() => setHoveredSlice(item.key)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isHovered ? 'bg-slate-50 border-slate-400 shadow-xs scale-[1.01]' : 'border-slate-200'
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

          {/* SVG Pie Chart Visualization */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64">
              <svg viewBox="-1.2 -1.2 2.4 2.4" className="transform -rotate-90 w-full h-full">
                {stats.total === 0 ? (
                  <circle cx="0" cy="0" r="1" fill="#e2e8f0" />
                ) : (
                  pieSlices.map((slice, index) => {
                    if (slice.count === 0) return null;
                    const start = (slice.startAngle * Math.PI) / 180;
                    const end = (slice.endAngle * Math.PI) / 180;
                    const x1 = Math.cos(start);
                    const y1 = Math.sin(start);
                    const x2 = Math.cos(end);
                    const y2 = Math.sin(end);
                    const largeArcFlag = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
                    const isHovered = hoveredSlice === slice.key;

                    // If single 100% slice
                    if (slice.percent >= 99.5) {
                      return (
                        <circle
                          key={index}
                          cx="0"
                          cy="0"
                          r="1"
                          fill={slice.color}
                          onMouseEnter={() => setHoveredSlice(slice.key)}
                          onMouseLeave={() => setHoveredSlice(null)}
                          className="transition-all cursor-pointer"
                        />
                      );
                    }

                    const pathData = `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    return (
                      <path
                        key={index}
                        d={pathData}
                        fill={slice.color}
                        onMouseEnter={() => setHoveredSlice(slice.key)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        className={`transition-all cursor-pointer ${
                          isHovered ? 'opacity-90 stroke-white stroke-2' : 'hover:opacity-90'
                        }`}
                      />
                    );
                  })
                )}
                {/* Center Donut Cutout */}
                <circle cx="0" cy="0" r="0.6" fill="white" />
              </svg>

              {/* Donut Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {hoveredSlice
                    ? pieData.find(p => p.key === hoveredSlice)?.count
                    : `${stats.responseRate}%`}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {hoveredSlice
                    ? pieData.find(p => p.key === hoveredSlice)?.label
                    : 'อัตราตอบกลับ'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Classroom Student Roster Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              รายชื่อนักเรียนในที่ปรึกษา ({displayedStudents.length}/{groupStudents.length} คน)
            </h3>
            <p className="text-xs text-slate-500">
              เครื่องหมาย ✅ = อัปเดตข้อมูลแล้ว | ⏳ = ยังไม่ได้อัปเดตข้อมูล
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ, รหัสนักศึกษา..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'updated', label: '✅ บันทึกแล้ว' },
                { id: 'pending', label: '⏳ ยังไม่บันทึก' },
                { id: 'employed', label: '💼 มีงานทำ' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">สถานะ</th>
                <th className="py-3.5 px-4">รหัสนักศึกษา</th>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-4">เบอร์โทรศัพท์</th>
                <th className="py-3.5 px-4">สถานะปัจจุบัน</th>
                <th className="py-3.5 px-4">สถานที่ทำงาน / สถาบัน</th>
                <th className="py-3.5 px-4 text-right">การกระทำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                displayedStudents.map((std) => {
                  return (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
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

                      {/* Full Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{std.prefix}{std.fullName}</div>
                        <div className="text-[11px] text-slate-400">{std.studySystem}</div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {std.phone || '-'}
                      </td>

                      {/* Current Status Pill */}
                      <td className="py-3.5 px-4">
                        {std.isUpdated ? (
                          std.currentStatus === 'employed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              💼 มีงานทำ
                            </span>
                          ) : std.currentStatus === 'studying' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              🎓 ศึกษาต่อ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              ⏳ ว่างงาน
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            ยังไม่อัปเดต
                          </span>
                        )}
                      </td>

                      {/* Workplace / Institution Details */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {std.currentStatus === 'employed'
                          ? `${std.workplaceName || '-'} (${std.jobPosition || '-'})`
                          : std.currentStatus === 'studying'
                          ? `${std.institution || '-'} (${std.facultyMajor || '-'})`
                          : std.currentStatus === 'unemployed'
                          ? `${std.unemployedReason || 'ยังไม่ได้ทำงาน'}`
                          : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingStudent(std)}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="บันทึกข้อมูลแทนนักเรียน / แก้ไข"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {std.isUpdated && (
                            <button
                              onClick={() => setViewingSlipStudent(std)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="ดูใบยืนยัน"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit or Record On Behalf of Student */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>บันทึกข้อมูลแทนนักเรียน ({editingStudent.prefix}{editingStudent.fullName})</span>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateStudent({
                  ...editingStudent,
                  isUpdated: true,
                  updatedAt: new Date().toLocaleString('th-TH'),
                });
                setEditingStudent(null);
              }}
              className="p-6 space-y-4 text-xs sm:text-sm"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={editingStudent.phone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    placeholder="081-xxx-xxxx"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Line ID</label>
                  <input
                    type="text"
                    value={editingStudent.lineId || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, lineId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    placeholder="line id"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">สถานะปัจจุบัน</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'employed', label: '💼 มีงานทำ' },
                    { id: 'studying', label: '🎓 ศึกษาต่อ' },
                    { id: 'unemployed', label: '⏳ ว่างงาน' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setEditingStudent({ ...editingStudent, currentStatus: st.id as CurrentStatus })}
                      className={`py-2 rounded-xl border font-bold cursor-pointer transition-all ${
                        editingStudent.currentStatus === st.id
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {editingStudent.currentStatus === 'employed' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ชื่อหน่วยงาน / บริษัท</label>
                    <input
                      type="text"
                      value={editingStudent.workplaceName || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, workplaceName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      placeholder="ชื่อบริษัท..."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ตำแหน่งงาน</label>
                      <input
                        type="text"
                        value={editingStudent.jobPosition || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, jobPosition: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        placeholder="ตำแหน่ง..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">รายได้ต่อเดือน (บาท)</label>
                      <input
                        type="number"
                        value={editingStudent.monthlyIncome || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, monthlyIncome: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        placeholder="15000"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {editingStudent.currentStatus === 'studying' && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">สถาบัน / มหาวิทยาลัย</label>
                    <input
                      type="text"
                      value={editingStudent.institution || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, institution: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      placeholder="เช่น ม.ราชมงคลสุวรรณภูมิ"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">คณะ / สาขาวิชา</label>
                    <input
                      type="text"
                      value={editingStudent.facultyMajor || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, facultyMajor: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      placeholder="เช่น วิศวกรรมไฟฟ้า"
                      required
                    />
                  </div>
                </div>
              )}

              {editingStudent.currentStatus === 'unemployed' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">สาเหตุที่ยังไม่ได้ทำงาน</label>
                    <input
                      type="text"
                      value={editingStudent.unemployedReason || 'กำลังมองหางาน'}
                      onChange={(e) => setEditingStudent({ ...editingStudent, unemployedReason: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      placeholder="สาเหตุ..."
                      required
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Confirmation Slip */}
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
