import React, { useState, useRef } from 'react';
import { StudentRecord } from '../types';
import { 
  downloadStudentExcelTemplate, 
  parseStudentFile, 
  fetchGoogleSheetData, 
  ParsedImportResult 
} from '../services/excelService';
import confetti from 'canvas-confetti';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  X, 
  Link, 
  FileText, 
  Users, 
  RefreshCw, 
  ArrowRight,
  Database,
  Search
} from 'lucide-react';

interface ImportStudentsModalProps {
  existingStudents: StudentRecord[];
  onImportSuccess: (imported: StudentRecord[], mode: 'merge' | 'replace') => void;
  onClose: () => void;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  existingStudents,
  onImportSuccess,
  onClose,
}) => {
  const [activeSourceTab, setActiveSourceTab] = useState<'file' | 'sheet'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ParsedImportResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [previewSearch, setPreviewSearch] = useState('');
  const [isImportDone, setIsImportDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Upload Change
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setImportResult(null);

    const result = await parseStudentFile(file);
    setImportResult(result);
    setIsProcessing(false);
  };

  // Handle Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        await handleFileChange(file);
      } else {
        alert('กรุณาเลือกไฟล์ .xlsx, .xls หรือ .csv เท่านั้น');
      }
    }
  };

  // Handle Google Sheet Fetch
  const handleFetchSheet = async () => {
    if (!googleSheetUrl.trim()) return;
    setIsProcessing(true);
    setImportResult(null);

    const result = await fetchGoogleSheetData(googleSheetUrl);
    setImportResult(result);
    setIsProcessing(false);
  };

  // Execute Import
  const handleConfirmImport = () => {
    if (!importResult || importResult.validStudents.length === 0) return;

    onImportSuccess(importResult.validStudents, importMode);
    setImportedCount(importResult.validStudents.length);
    setIsImportDone(true);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignored if confetti fails
    }
  };

  // Filter preview list
  const filteredPreview = (importResult?.validStudents || []).filter(s => {
    if (!previewSearch.trim()) return true;
    const q = previewSearch.toLowerCase();
    return (
      s.studentId.includes(q) ||
      s.fullName.toLowerCase().includes(q) ||
      s.studyGroup.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  });

  const existingStudentIds = new Set(existingStudents.map(s => s.studentId));
  const newStudentsCount = (importResult?.validStudents || []).filter(s => !existingStudentIds.has(s.studentId)).length;
  const updateExistingCount = (importResult?.validStudents || []).filter(s => existingStudentIds.has(s.studentId)).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full my-6 overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                นำเข้าข้อมูลนักศึกษาผ่านไฟล์ Excel / Google Sheets
              </h3>
              <p className="text-xs text-purple-200">
                ดาวน์โหลดไฟล์ตัวอย่าง กรอกข้อมูล และอัปโหลดกลับเข้าสู่ระบบได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isImportDone ? (
          /* SUCCESS STATE */
          <div className="p-8 sm:p-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-slate-900">
                นำเข้าข้อมูลนักศึกษาสำเร็จเรียบร้อยแล้ว!
              </h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                ระบบได้ดำเนินการ {importMode === 'replace' ? 'แทนที่ฐานข้อมูลเดิมทั้งหมด' : 'เพิ่มและอัปเดตข้อมูลนักศึกษา'} จำนวนทั้งสิ้น{' '}
                <strong className="text-emerald-600 font-bold">{importedCount} คน</strong> พร้อมใช้งานในระบบทันที
              </p>
            </div>
            <div className="pt-4 flex justify-center">
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-500/20 cursor-pointer"
              >
                เสร็จสิ้น / กลับสู่หน้าจัดการ
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Step 1: Download Template */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Download className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <span>ขั้นตอนที่ 1: ดาวน์โหลดไฟล์แบบฟอร์มตัวอย่าง (Template)</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold">
                      แนะนำ
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    มีหัวตารางภาษาไทยและตัวอย่างข้อมูลนักศึกษาครบถ้วน สามารถเปิดใน Microsoft Excel หรือ Google Sheets เพื่อแก้ไขแล้วนำมาอัปโหลด
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                <button
                  onClick={() => downloadStudentExcelTemplate()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์ Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Step 2: Choose Source (Upload File vs Google Sheet URL) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>ขั้นตอนที่ 2: เลือกวิธีนำเข้าข้อมูล</span>
                </span>

                {/* Source Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setActiveSourceTab('file')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeSourceTab === 'file'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดไฟล์ (Excel/CSV)</span>
                  </button>
                  <button
                    onClick={() => setActiveSourceTab('sheet')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeSourceTab === 'sheet'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>ลิงก์ Google Sheets</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Zone */}
              {activeSourceTab === 'file' ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                  />
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                      selectedFile
                        ? 'border-purple-400 bg-purple-50/50'
                        : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-7 h-7" />
                    </div>
                    {selectedFile ? (
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-2">
                          <FileText className="w-4 h-4 text-purple-600" />
                          <span>{selectedFile.name}</span>
                          <span className="text-xs text-slate-400 font-normal">
                            ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <p className="text-xs text-purple-600 font-medium">
                          คลิกเพื่อเปลี่ยนไฟล์ หรือลากไฟล์ใหม่มาวางที่นี่
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-800">
                          ลากและวางไฟล์ หรือคลิกเพื่อเลือกไฟล์จากอุปกรณ์
                        </div>
                        <p className="text-xs text-slate-500">
                          รองรับไฟล์ Microsoft Excel (<code className="bg-slate-200 px-1 rounded">.xlsx</code>, <code className="bg-slate-200 px-1 rounded">.xls</code>) และ <code className="bg-slate-200 px-1 rounded">.csv</code>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Google Sheet Link Input */
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      URL ของ Google Sheet (ต้องตั้งค่าสิทธิ์ให้ "ทุกคนที่มีลิงก์มีสิทธิ์ดู")
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                        value={googleSheetUrl}
                        onChange={(e) => setGoogleSheetUrl(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleFetchSheet}
                        disabled={isProcessing || !googleSheetUrl.trim()}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>กำลังดึงข้อมูล...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            <span>ดึงข้อมูล</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-700">💡 วิธีตั้งค่าการแชร์ใน Google Sheet:</div>
                    <div>1. เปิด Google Sheet ของท่าน &gt; คลิกปุ่ม <strong>"แชร์ (Share)"</strong> มุมขวาบน</div>
                    <div>2. ภายใต้การเข้าถึงทั่วไป ให้เปลี่ยนเป็น <strong>"ทุกคนที่มีลิงก์ (Anyone with the link)"</strong> และสิทธิ์เป็น <strong>"ผู้มีสิทธิ์อ่าน (Viewer)"</strong></div>
                    <div>3. คัดลอกลิงก์มาวางในช่องด้านบนแล้วกด "ดึงข้อมูล"</div>
                  </div>
                </div>
              )}
            </div>

            {/* Processing Spinner */}
            {isProcessing && (
              <div className="py-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                <div className="text-sm font-bold text-slate-700">กำลังอ่านและตรวจสอบโครงสร้างข้อมูล...</div>
              </div>
            )}

            {/* Step 3: Parse Results & Preview */}
            {importResult && (
              <div className="space-y-5 animate-fadeIn">
                {/* Result Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-semibold">พบข้อมูลในไฟล์</div>
                    <div className="text-xl font-bold text-slate-900">{importResult.totalParsed} แถว</div>
                  </div>

                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                    <div className="text-xs text-emerald-700 font-semibold">ข้อมูลถูกต้อง</div>
                    <div className="text-xl font-bold text-emerald-700">
                      {importResult.validStudents.length} คน
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200">
                    <div className="text-xs text-blue-700 font-semibold">เพิ่มนักศึกษาใหม่</div>
                    <div className="text-xl font-bold text-blue-700">+{newStudentsCount} คน</div>
                  </div>

                  <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                    <div className="text-xs text-amber-700 font-semibold">อัปเดตนักศึกษาเดิม</div>
                    <div className="text-xl font-bold text-amber-700">{updateExistingCount} คน</div>
                  </div>
                </div>

                {/* Errors Display if any */}
                {importResult.errors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-red-900">
                      <AlertCircle className="w-4 h-4" />
                      <span>พบข้อผิดพลาดที่ไม่สามารถนำเข้าได้ ({importResult.errors.length} รายการ):</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] max-h-32 overflow-y-auto">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings Display if any */}
                {importResult.warnings.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="w-4 h-4" />
                      <span>ข้อสังเกต ({importResult.warnings.length} รายการ):</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] max-h-24 overflow-y-auto">
                      {importResult.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Step 4: Import Mode Selection */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-3">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-600" />
                    <span>ขั้นตอนที่ 3: เลือกรูปแบบการนำเข้าฐานข้อมูล</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        importMode === 'merge'
                          ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="mt-1 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-slate-900">
                          รวมข้อมูลและอัปเดตรายการเดิม (Merge & Update)
                        </div>
                        <p className="text-slate-500 leading-relaxed">
                          เพิ่มนักศึกษาใหม่เข้าระบบ และหากรหัสนักศึกษาตรงกับคนเดิมจะทำการอัปเดตข้อมูลให้ทันสมัย (คงข้อมูลนักศึกษาคนอื่นไว้)
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        importMode === 'replace'
                          ? 'bg-red-50/70 border-red-300 ring-2 ring-red-500/20'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="mt-1 text-red-600 focus:ring-red-500"
                      />
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-red-950">
                          แทนที่ฐานข้อมูลทั้งหมด (Replace All)
                        </div>
                        <p className="text-slate-500 leading-relaxed">
                          ล้างฐานข้อมูลนักศึกษาเดิมในระบบ ({existingStudents.length} คน) แล้วใช้เฉพาะข้อมูลจากไฟล์ชุดนี้แทน
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Preview Table */}
                {importResult.validStudents.length > 0 && (
                  <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-0">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span>ตัวอย่างข้อมูลที่พร้อมนำเข้า ({filteredPreview.length} / {importResult.validStudents.length} คน)</span>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="ค้นหาในตัวอย่าง..."
                          value={previewSearch}
                          onChange={(e) => setPreviewSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">รหัสนักศึกษา</th>
                            <th className="py-2 px-3">ชื่อ - นามสกุล</th>
                            <th className="py-2 px-3">ระดับ/กลุ่ม</th>
                            <th className="py-2 px-3">สาขาวิชา/แผนก</th>
                            <th className="py-2 px-3">ประเภทวิชา</th>
                            <th className="py-2 px-3">สถานะในระบบ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredPreview.slice(0, 50).map((s) => {
                            const isExisting = existingStudentIds.has(s.studentId);
                            return (
                              <tr key={s.studentId} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-mono font-bold text-purple-700">
                                  {s.studentId}
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-800">
                                  {s.prefix} {s.fullName}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                                    {s.studyGroup}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-600">{s.department}</td>
                                <td className="py-2 px-3 text-slate-500">{s.vocationalCategory}</td>
                                <td className="py-2 px-3">
                                  {isExisting ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                      รายการเดิม (จะอัปเดต)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      + รายการใหม่
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {filteredPreview.length > 50 && (
                        <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 border-t border-slate-100">
                          ...และอีก {filteredPreview.length - 50} รายการ
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={!importResult || importResult.validStudents.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-500/20 transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>
                  ยืนยันนำเข้าข้อมูลนักศึกษา ({importResult ? importResult.validStudents.length : 0} คน)
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
