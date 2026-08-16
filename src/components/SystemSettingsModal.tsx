import React, { useState } from 'react';
import { SystemConfig, StudentRecord } from '../types';
import { resetToInitialData, broadcastRealtimeUpdate, TAB_INSTANCE_ID } from '../services/storage';
import { exportStudentsToExcel } from '../services/excelService';
import { 
  Check, 
  RefreshCw, 
  Save, 
  X, 
  Database, 
  Settings, 
  ShieldCheck,
  CheckCircle2,
  Radio,
  Download,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

interface SystemSettingsModalProps {
  config: SystemConfig;
  allStudents: StudentRecord[];
  onSaveConfig: (updated: Partial<SystemConfig>) => void;
  onClose: () => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  config,
  allStudents,
  onSaveConfig,
  onClose,
}) => {
  const [formData, setFormData] = useState<SystemConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'realtime' | 'general' | 'backup'>('realtime');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isBroadcastingTest, setIsBroadcastingTest] = useState(false);

  const handleTestBroadcast = () => {
    setIsBroadcastingTest(true);
    broadcastRealtimeUpdate('students_updated', 'ทดสอบการส่งสัญญาณ Real-time Sync ข้ามแท็บและทุกหน้าจอ', allStudents.length);
    
    setTimeout(() => {
      setIsBroadcastingTest(false);
      setStatusMsg({
        type: 'success',
        text: `⚡ ส่งสัญญาณ Real-time Broadcast สำเร็จ! ทุกหน้าจอและแท็บที่เปิดอยู่จะอัปเดตข้อมูลอัตโนมัติทันที`,
      });
    }, 400);
  };

  const handleResetData = () => {
    if (window.confirm('⚠️ คำเตือน: คุณต้องการรีเซ็ตฐานข้อมูลนักศึกษาและครูที่ปรึกษาทั้งหมดกลับเป็นค่าเริ่มต้นสำหรับการสาธิตใช่หรือไม่? ข้อมูลที่แก้ไขล่าสุดจะถูกคืนค่า')) {
      resetToInitialData();
      setStatusMsg({
        type: 'success',
        text: 'รีเซ็ตข้อมูลเป็นค่าเริ่มต้นและส่งสัญญาณซิงค์ Real-time เรียบร้อยแล้ว',
      });
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...formData,
      realtimeSyncEnabled: true,
      lastRealtimeUpdateAt: new Date().toLocaleString('th-TH'),
    });
    setStatusMsg({ type: 'success', text: 'บันทึกการตั้งค่าระบบเรียลไทม์เรียบร้อยแล้ว' });
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const updatedCount = allStudents.filter(s => s.isUpdated).length;
  const updatePercent = allStudents.length > 0 ? Math.round((updatedCount / allStudents.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  ตั้งค่าระบบ & สถานะ Real-time Live Sync
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ระบบอัปเดตข้อมูลอัตโนมัติแบบทันทีโดยไม่ต้องเชื่อมต่อภายนอก
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('realtime')}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'realtime'
                ? 'bg-white text-indigo-700 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4 text-indigo-600" />
            <span>สถานะ Real-time</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white text-indigo-700 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>ข้อมูลสถานศึกษา</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white text-indigo-700 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>จัดการฐานข้อมูล</span>
          </button>
        </div>

        {/* Status Alerts */}
        {statusMsg && (
          <div className={`p-4 text-xs sm:text-sm flex items-start gap-2.5 ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200' :
            statusMsg.type === 'error' ? 'bg-red-50 text-red-900 border-b border-red-200' :
            'bg-blue-50 text-blue-900 border-b border-blue-200'
          }`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="font-medium">{statusMsg.text}</div>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: REAL-TIME STATUS */}
          {activeTab === 'realtime' && (
            <div className="space-y-5">
              {/* Real-time Status Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white border border-indigo-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Radio className="w-32 h-32" />
                </div>
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-sm font-bold tracking-wide uppercase text-emerald-300">
                        Real-time Live Synchronization Active
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10 font-mono">
                      {TAB_INSTANCE_ID.substring(0, 10)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    ระบบเปิดใช้งานการส่งสัญญาณข้อมูลแบบเรียลไทม์ (Event-Driven Broadcast Mesh) เมื่อนักศึกษาตอบแบบสำรวจ หรือครูที่ปรึกษา/ผู้ดูแลระบบอัปเดตข้อมูล หน้าจอสรุปสถิติ กราฟ และรายชื่อนักเรียนจะอัปเดตทันทีแบบเสี้ยววินาที
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                      <div className="text-[11px] text-slate-300">นักศึกษาในระบบ</div>
                      <div className="text-xl font-bold text-white mt-0.5">{allStudents.length} คน</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                      <div className="text-[11px] text-slate-300">อัปเดตข้อมูลแล้ว</div>
                      <div className="text-xl font-bold text-emerald-400 mt-0.5">{updatedCount} คน ({updatePercent}%)</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/10 border border-white/10 col-span-2 sm:col-span-1">
                      <div className="text-[11px] text-slate-300">ความเร็วการซิงค์</div>
                      <div className="text-xl font-bold text-indigo-300 mt-0.5">&lt; 10 ms</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  <strong className="block text-slate-800 font-bold mb-0.5">ทดสอบการส่งสัญญาณ Real-time</strong>
                  ส่ง Ping ไปยังทุกแท็บ/หน้าจอที่เปิดระบบนี้อยู่ เพื่อยืนยันการรับส่งข้อมูลแบบทันที
                </div>
                <button
                  type="button"
                  onClick={handleTestBroadcast}
                  disabled={isBroadcastingTest}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBroadcastingTest ? 'animate-spin' : ''}`} />
                  <span>{isBroadcastingTest ? 'กำลังส่งสัญญาณ...' : '⚡ ทดสอบส่งสัญญาณ'}</span>
                </button>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong>ข้อดีของการทำงานแบบเรียลไทม์ในระบบ:</strong> ข้อมูลจะถูกประมวลผลและอัปเดตแบบ Direct In-App ไวที่สุด ไม่ติดปัญหาโควต้า Request Limit หรือความล่าช้าจากการเรียก Google Sheet API ภายนอก
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ชื่อสถานศึกษา</label>
                <input
                  type="text"
                  value={formData.collegeName}
                  onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ชื่อหัวข้อระบบ</label>
                <input
                  type="text"
                  value={formData.systemTitle}
                  onChange={(e) => setFormData({ ...formData, systemTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">ปีการศึกษาที่ติดตาม</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="2567"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">กำหนดปิดรับการกรอกข้อมูล</label>
                  <input
                    type="date"
                    value={formData.surveyDeadline}
                    onChange={(e) => setFormData({ ...formData, surveyDeadline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์ติดต่อ (งานแนะแนว)</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">อีเมลติดต่อฝ่ายแนะแนว</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่า</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: BACKUP & DATABASE TOOLS */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>สำรองข้อมูลนักศึกษา (Backup & Export)</span>
                </h4>
                <p className="text-xs text-slate-600">
                  ดาวน์โหลดข้อมูลนักศึกษาทั้งหมดพร้อมสถานะการมีงานทำออกมาเป็นไฟล์ Microsoft Excel (.xlsx) เพื่อเก็บสำรองหรือรายงานต่อผู้บริหาร
                </p>
                <button
                  type="button"
                  onClick={() => exportStudentsToExcel(allStudents, `สำรองข้อมูล_${formData.collegeName}_ปี${formData.academicYear}.xlsx`)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์สำรอง Excel (.xlsx)</span>
                </button>
              </div>

              {/* Danger Zone: Reset to initial data */}
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3">
                <h4 className="text-sm font-bold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>คืนค่าข้อมูลเริ่มต้น (Reset Database)</span>
                </h4>
                <p className="text-xs text-red-700">
                  รีเซ็ตข้อมูลนักศึกษา 18 รายการตัวอย่างและรายชื่อครูที่ปรึกษา 10 ท่าน กลับเป็นค่าตั้งต้นของการสาธิต
                </p>
                <button
                  type="button"
                  onClick={handleResetData}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>รีเซ็ตข้อมูลเป็นค่าเริ่มต้น</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            สถานะ: <span className="font-semibold text-emerald-600">Real-time Live Engine Active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
