import React from 'react';
import { StudentRecord, SystemConfig } from '../types';
import { CheckCircle2, Printer, X, Award, Building, Calendar, Phone, MessageSquare } from 'lucide-react';

interface ConfirmationSlipProps {
  student: StudentRecord;
  config: SystemConfig;
  onClose: () => void;
}

export const ConfirmationSlip: React.FC<ConfirmationSlipProps> = ({
  student,
  config,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const getStatusDisplay = () => {
    switch (student.currentStatus) {
      case 'employed':
        return {
          title: 'มีงานทำ / ประกอบอาชีพ',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          details: [
            { label: 'หน่วยงาน / บริษัท', value: student.workplaceName || '-' },
            { label: 'ตำแหน่งงาน', value: student.jobPosition || '-' },
            { label: 'รายได้ต่อเดือน', value: student.monthlyIncome ? `${student.monthlyIncome.toLocaleString()} บาท` : '-' },
            { label: 'ลักษณะงานตรงสาขา', value: student.jobMatch || '-' },
            { label: 'จังหวัดที่ตั้งสถานประกอบการ', value: student.province || '-' },
          ]
        };
      case 'studying':
        return {
          title: 'ศึกษาต่อ',
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          details: [
            { label: 'ระดับการศึกษาต่อ', value: student.furtherStudyLevel || '-' },
            { label: 'สถาบัน / มหาวิทยาลัย', value: student.institution || '-' },
            { label: 'คณะ / สาขาวิชา', value: student.facultyMajor || '-' },
          ]
        };
      case 'unemployed':
        return {
          title: 'ว่างงาน / กำลังหางาน',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          details: [
            { label: 'สาเหตุที่ยังไม่ได้ทำงาน', value: student.unemployedReason || '-' },
          ]
        };
      default:
        return {
          title: 'ยังไม่อัปเดตข้อมูล',
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
          details: []
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-6">
        {/* Top Action Bar (hidden during print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>ใบยืนยันการบันทึกข้อมูลภาวะการมีงานทำ</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Area */}
        <div className="p-8 sm:p-10 bg-white" id="printable-slip">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-md">
              <Award className="w-10 h-10 text-yellow-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {config.collegeName}
            </h2>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              {config.systemTitle}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              เอกสารยืนยันการรายงานตัวและบันทึกข้อมูลภาวะการมีงานทำและการศึกษาต่อ ประจำปีการศึกษา {config.academicYear}
            </p>
          </div>

          {/* Student Profile Info Grid */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 block text-xs">รหัสนักศึกษา</span>
                <span className="font-bold text-slate-900 font-mono text-base">{student.studentId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">ชื่อ - นามสกุล</span>
                <span className="font-bold text-slate-900">{student.prefix}{student.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">ระดับชั้น / กลุ่มเรียน</span>
                <span className="font-medium text-slate-800">{student.educationLevel} กลุ่ม {student.studyGroup} ({student.studySystem})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">แผนกวิชา / ประเภทวิชา</span>
                <span className="font-medium text-slate-800">{student.department} ({student.vocationalCategory})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">เบอร์โทรศัพท์</span>
                <span className="font-medium text-slate-800">{student.phone || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Line ID</span>
                <span className="font-medium text-slate-800">{student.lineId || '-'}</span>
              </div>
            </div>
          </div>

          {/* Survey Result Details */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>ผลการรายงานสถานะปัจจุบัน</span>
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badge}`}>
                {statusInfo.title}
              </span>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
              {statusInfo.details.map((d, i) => (
                <div key={i} className="flex justify-between p-3 text-xs sm:text-sm bg-white hover:bg-slate-50">
                  <span className="text-slate-600">{d.label}</span>
                  <span className="font-semibold text-slate-900 text-right">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Stamp & Timestamp */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <div className="font-bold text-slate-800">บันทึกข้อมูลสมบูรณ์</div>
                <div>วันที่บันทึก: {student.updatedAt || new Date().toLocaleString('th-TH')}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono text-[11px] text-slate-400">DOC-ID: ATTC-{student.studentId}-{Date.now().toString().slice(-6)}</div>
              <div className="text-[11px] text-slate-400">งานแนะแนวและส่งเสริมการมีงานทำ</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ใบยืนยัน</span>
          </button>
        </div>
      </div>
    </div>
  );
};
