import { StudentRecord, SystemConfig } from '../types';
import { INITIAL_STUDENTS, DEFAULT_CONFIG } from '../data/constants';

const STORAGE_KEYS = {
  STUDENTS: 'attc_tracking_students_v1',
  CONFIG: 'attc_tracking_config_v1',
};

export const getStoredStudents = (): StudentRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_STUDENTS;
  } catch (err) {
    console.error('Failed to load students from localStorage:', err);
    return INITIAL_STUDENTS;
  }
};

export const saveAllStudents = (students: StudentRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (err) {
    console.error('Failed to save students:', err);
  }
};

export const updateStudentRecord = (updated: StudentRecord): StudentRecord[] => {
  const current = getStoredStudents();
  const index = current.findIndex(s => s.id === updated.id || s.studentId === updated.studentId);
  let nextList: StudentRecord[];
  
  if (index >= 0) {
    nextList = [...current];
    nextList[index] = {
      ...nextList[index],
      ...updated,
      isUpdated: true,
      updatedAt: updated.updatedAt || new Date().toLocaleString('th-TH'),
    };
  } else {
    nextList = [
      ...current,
      {
        ...updated,
        id: updated.id || `std-${Date.now()}`,
        isUpdated: true,
        updatedAt: updated.updatedAt || new Date().toLocaleString('th-TH'),
      }
    ];
  }
  
  saveAllStudents(nextList);
  return nextList;
};

export const deleteStudentRecord = (id: string): StudentRecord[] => {
  const current = getStoredStudents();
  const nextList = current.filter(s => s.id !== id && s.studentId !== id);
  saveAllStudents(nextList);
  return nextList;
};

export const resetStudentRecord = (id: string): StudentRecord[] => {
  const current = getStoredStudents();
  const nextList = current.map(s => {
    if (s.id === id || s.studentId === id) {
      return {
        ...s,
        isUpdated: false,
        updatedAt: null,
        currentStatus: 'not_updated' as const,
        workplaceName: undefined,
        jobPosition: undefined,
        monthlyIncome: undefined,
        jobMatch: undefined,
        province: undefined,
        furtherStudyLevel: undefined,
        institution: undefined,
        facultyMajor: undefined,
        unemployedReason: undefined,
      };
    }
    return s;
  });
  saveAllStudents(nextList);
  return nextList;
};

export const getStoredConfig = (): SystemConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      return DEFAULT_CONFIG;
    }
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load system config:', err);
    return DEFAULT_CONFIG;
  }
};

export const saveStoredConfig = (config: Partial<SystemConfig>): SystemConfig => {
  const current = getStoredConfig();
  const next = { ...current, ...config, lastSyncedAt: new Date().toLocaleString('th-TH') };
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to save config:', err);
  }
  return next;
};

export const resetToInitialData = (): { students: StudentRecord[]; config: SystemConfig } => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
  return { students: INITIAL_STUDENTS, config: DEFAULT_CONFIG };
};

// Export CSV with UTF-8 BOM so Excel opens Thai properly without mojibake
export const exportStudentsToCsv = (students: StudentRecord[], filename: string = 'รายงานภาวะการมีงานทำ_เทคนิคอ่างทอง.csv') => {
  const headers = [
    'ลำดับ',
    'รหัสนักศึกษา',
    'คำนำหน้า',
    'ชื่อ - นามสกุล',
    'ระดับชั้น',
    'กลุ่มเรียน',
    'ประเภทวิชา',
    'สาขาวิชา/แผนก',
    'ระบบการเรียน',
    'เบอร์โทรศัพท์',
    'Line ID',
    'สถานะการกรอกข้อมูล',
    'วันที่อัปเดตล่าสุด',
    'สถานะปัจจุบัน',
    'ชื่อหน่วยงาน/บริษัท',
    'ตำแหน่งงาน',
    'รายได้ต่อเดือน (บาท)',
    'ลักษณะงานตรงสาขา',
    'จังหวัดที่ตั้งสถานประกอบการ',
    'ระดับการศึกษาต่อ',
    'สถาบันการศึกษาต่อ',
    'คณะ/สาขาวิชาที่ศึกษาต่อ',
    'สาเหตุที่ยังไม่ได้ทำงาน',
  ];

  const rows = students.map((s, idx) => {
    const statusText = 
      s.currentStatus === 'employed' ? 'มีงานทำ / ประกอบอาชีพ' :
      s.currentStatus === 'studying' ? 'ศึกษาต่อ' :
      s.currentStatus === 'unemployed' ? 'ว่างงาน / กำลังหางาน' : 'ยังไม่อัปเดตข้อมูล';

    return [
      idx + 1,
      `"${s.studentId}"`,
      `"${s.prefix || ''}"`,
      `"${s.fullName || ''}"`,
      `"${s.educationLevel || ''}"`,
      `"${s.studyGroup || ''}"`,
      `"${s.vocationalCategory || ''}"`,
      `"${s.department || ''}"`,
      `"${s.studySystem || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.lineId || ''}"`,
      s.isUpdated ? 'อัปเดตแล้ว (✅)' : 'ยังไม่ได้อัปเดต (⏳)',
      `"${s.updatedAt || '-'}"`,
      `"${statusText}"`,
      `"${s.workplaceName || '-'}"`,
      `"${s.jobPosition || '-'}"`,
      s.monthlyIncome !== undefined ? s.monthlyIncome : '-',
      `"${s.jobMatch || '-'}"`,
      `"${s.province || '-'}"`,
      `"${s.furtherStudyLevel || '-'}"`,
      `"${s.institution || '-'}"`,
      `"${s.facultyMajor || '-'}"`,
      `"${s.unemployedReason || '-'}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateLineReminderText = (
  unupdated: StudentRecord[],
  studyGroup: string,
  collegeName: string,
  academicYear: string
): string => {
  const count = unupdated.length;
  const listText = unupdated
    .slice(0, 30)
    .map((s, i) => `${i + 1}. ${s.studentId} ${s.prefix}${s.fullName}`)
    .join('\n');

  const moreNotice = unupdated.length > 30 ? `\n...และอีก ${unupdated.length - 30} ท่าน` : '';

  return `📢 แจ้งเตือนนักศึกษา/ผู้สำเร็จการศึกษา ${collegeName}
📌 ประจำปีการศึกษา ${academicYear} กลุ่มเรียน: ${studyGroup}

⚠️ พบรายชื่อที่ยังไม่ได้บันทึกข้อมูลภาวะการมีงานทำและการศึกษาต่อ (คงเหลือ ${count} คน):
${listText}${moreNotice}

👉 ขอให้นักศึกษาเข้าสู่ระบบเพื่อบันทึกข้อมูลด่วนที่ระบบติดตามงาน:
เข้าสู่ระบบด้วย: รหัสนักศึกษา 11 หลัก (ทั้ง Username และ Password)
🙏 ขอบคุณสำหรับความร่วมมือครับ/ค่ะ`;
};

export const generateGoogleAppsScriptCode = (collegeName: string, systemTitle: string): string => {
  return `/**
 * Google Apps Script WebApp Backend
 * ${systemTitle} - ${collegeName}
 * นำโค้ดนี้ไปวางใน Extensions > Apps Script ใน Google Sheet ของท่าน
 */

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : 'read';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'getConfig') {
    var configSheet = ss.getSheetByName('Config') || ss.getSheets()[0];
    var data = {
      collegeName: "${collegeName}",
      systemTitle: "${systemTitle}",
      academicYear: "2567",
      status: "online"
    };
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Default: Read students
  var sheet = ss.getSheetByName('Students') || ss.getSheets()[0];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = rows[0];
  var students = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    students.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify(students))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Students') || ss.getActiveSheet();
    
    if (contents.action === 'updateConfig') {
      var configSheet = ss.getSheetByName('Config') || ss.insertSheet('Config');
      configSheet.getRange('A1:B1').setValues([['Key', 'Value']]);
      configSheet.getRange('A2:B2').setValues([['collegeName', contents.config.collegeName]]);
      configSheet.getRange('A3:B3').setValues([['systemTitle', contents.config.systemTitle]]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Updated Config' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Batch save or single student update
    if (contents.action === 'saveStudent') {
      var student = contents.student;
      var data = sheet.getDataRange().getValues();
      var foundRow = -1;
      
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][1]) === String(student.studentId)) { // Column B = studentId
          foundRow = i + 1;
          break;
        }
      }
      
      var rowData = [
        student.id || Utilities.getUuid(),
        student.studentId,
        student.prefix,
        student.fullName,
        student.educationLevel,
        student.studyGroup,
        student.vocationalCategory,
        student.department,
        student.studySystem,
        student.phone,
        student.lineId,
        student.isUpdated ? 'YES' : 'NO',
        student.updatedAt || new Date().toISOString(),
        student.currentStatus,
        student.workplaceName || '',
        student.jobPosition || '',
        student.monthlyIncome || '',
        student.jobMatch || '',
        student.province || '',
        student.furtherStudyLevel || '',
        student.institution || '',
        student.facultyMajor || '',
        student.unemployedReason || ''
      ];
      
      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Saved successfully' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
};
