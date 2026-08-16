import * as XLSX from 'xlsx';
import { StudentRecord, EducationLevel, VocationalCategory, StudySystem, CurrentStatus, JobMatch, FurtherStudyLevel } from '../types';
import { VOCATIONAL_DEPARTMENTS } from '../data/constants';

// Template sample data
export const TEMPLATE_SAMPLE_STUDENTS = [
  {
    studentId: '65201010001',
    prefix: 'นาย',
    fullName: 'กิตติศักดิ์ มั่นคง',
    educationLevel: 'ปวช.',
    studyGroup: 'ช.3ชย.1',
    vocationalCategory: 'อุตสาหกรรม',
    department: 'ช่างยนต์',
    studySystem: 'ปกติ',
    phone: '081-234-5678',
    lineId: 'kittisak.m',
    currentStatus: 'มีงานทำ / ประกอบอาชีพ',
    workplaceName: 'บริษัท ฮอนด้า ออโตโมบิล (ประเทศไทย) จำกัด',
    jobPosition: 'ช่างเทคนิคซ่อมบำรุง',
    monthlyIncome: 18500,
    jobMatch: 'ตรงสาขา',
    province: 'พระนครศรีอยุธยา',
    notes: 'ตัวอย่างข้อมูลนักเรียนที่มีงานทำ',
  },
  {
    studentId: '65201010002',
    prefix: 'นางสาว',
    fullName: 'วรรณภา แจ่มใส',
    educationLevel: 'ปวช.',
    studyGroup: 'ช.3ชย.1',
    vocationalCategory: 'อุตสาหกรรม',
    department: 'ช่างยนต์',
    studySystem: 'ปกติ',
    phone: '082-345-6789',
    lineId: 'wannapa_j',
    currentStatus: 'ศึกษาต่อ',
    furtherStudyLevel: 'ปวส.',
    institution: 'วิทยาลัยเทคนิคอ่างทอง',
    facultyMajor: 'สาขาวิชาเทคนิคเครื่องกล (ช่างยนต์)',
    notes: 'ตัวอย่างข้อมูลนักเรียนที่ศึกษาต่อ',
  },
  {
    studentId: '65201010003',
    prefix: 'นาย',
    fullName: 'ธนากร ภักดีชน',
    educationLevel: 'ปวช.',
    studyGroup: 'ช.3ชย.1',
    vocationalCategory: 'อุตสาหกรรม',
    department: 'ช่างยนต์',
    studySystem: 'ปกติ',
    phone: '089-987-6543',
    lineId: 'thanakorn.p',
    currentStatus: 'ยังไม่อัปเดตข้อมูล',
    notes: 'ตัวอย่างข้อมูลนักเรียนใหม่ (รอการกรอกแบบสำรวจ)',
  },
  {
    studentId: '65302010001',
    prefix: 'นางสาว',
    fullName: 'ศิริพร บุญมี',
    educationLevel: 'ปวส.',
    studyGroup: 'ส.2บค.1',
    vocationalCategory: 'บริหารธุรกิจ',
    department: 'การบัญชี',
    studySystem: 'ปกติ',
    phone: '084-555-1234',
    lineId: 'siriporn_acc',
    currentStatus: 'มีงานทำ / ประกอบอาชีพ',
    workplaceName: 'สำนักงานบัญชีและภาษี อ่างทอง',
    jobPosition: 'พนักงานตรวจสอบบัญชี',
    monthlyIncome: 16000,
    jobMatch: 'ตรงสาขา',
    province: 'อ่างทอง',
    notes: '',
  },
];

// Helper to determine category from department name
export const inferCategoryFromDepartment = (dept: string): VocationalCategory => {
  const cleanDept = dept.trim();
  for (const [cat, depts] of Object.entries(VOCATIONAL_DEPARTMENTS)) {
    if (depts.some(d => d.includes(cleanDept) || cleanDept.includes(d))) {
      return cat as VocationalCategory;
    }
  }
  if (cleanDept.includes('ช่าง') || cleanDept.includes('ยนต์') || cleanDept.includes('ไฟฟ้า') || cleanDept.includes('อิเล็กทรอนิกส์') || cleanDept.includes('กล')) {
    return 'อุตสาหกรรม';
  }
  if (cleanDept.includes('บัญชี') || cleanDept.includes('การตลาด') || cleanDept.includes('จัดการ') || cleanDept.includes('เลขา')) {
    return 'บริหารธุรกิจ';
  }
  if (cleanDept.includes('คอมพิวเตอร์') || cleanDept.includes('ดิจิทัล') || cleanDept.includes('ไอที') || cleanDept.includes('สารสนเทศ')) {
    return 'เทคโนโลยีธุรกิจดิจิทัล';
  }
  if (cleanDept.includes('อาหาร') || cleanDept.includes('คหกรรม') || cleanDept.includes('ผ้า') || cleanDept.includes('โรงแรม')) {
    return 'คหกรรม';
  }
  return 'อุตสาหกรรม';
};

// Helper to determine education level from study group code
export const inferEducationLevel = (groupCode: string, inputLevel?: string): EducationLevel => {
  if (inputLevel) {
    if (inputLevel.includes('ปวส') || inputLevel.toLowerCase().includes('dip') || inputLevel.toLowerCase().includes('high')) {
      return 'ปวส.';
    }
    if (inputLevel.includes('ปวช') || inputLevel.toLowerCase().includes('voc') || inputLevel.toLowerCase().includes('cert')) {
      return 'ปวช.';
    }
  }
  const clean = groupCode.trim();
  if (clean.startsWith('ส.') || clean.startsWith('ส') || clean.includes('ปวส')) {
    return 'ปวส.';
  }
  return 'ปวช.';
};

/**
 * Generate and download Excel Template (.xlsx)
 */
export const downloadStudentExcelTemplate = (filename: string = 'แบบฟอร์มนำเข้าข้อมูลนักศึกษา_เทคนิคอ่างทอง.xlsx') => {
  const headers = [
    'รหัสนักศึกษา *',
    'คำนำหน้า *',
    'ชื่อ - นามสกุล *',
    'ระดับชั้น (ปวช./ปวส.)',
    'กลุ่มเรียน *',
    'ประเภทวิชา',
    'สาขาวิชา/แผนก *',
    'ระบบการเรียน (ปกติ/ม.6/ทวิภาคี)',
    'เบอร์โทรศัพท์',
    'Line ID',
    'สถานะปัจจุบัน (ถ้ามี)',
    'ชื่อหน่วยงาน/บริษัท (ถ้ามีงานทำ)',
    'ตำแหน่งงาน',
    'รายได้ต่อเดือน (บาท)',
    'ความตรงสาขา (ตรงสาขา/ไม่ตรงสาขา/ประยุกต์ใช้)',
    'จังหวัดที่ตั้งสถานประกอบการ',
    'ระดับการศึกษาต่อ (ปวส./ปริญญาตรี/อื่นๆ)',
    'สถาบันการศึกษาต่อ',
    'คณะ/สาขาวิชาที่ศึกษาต่อ',
    'สาเหตุที่ยังไม่ได้ทำงาน (ถ้าว่างงาน)',
    'หมายเหตุ',
  ];

  const dataRows = TEMPLATE_SAMPLE_STUDENTS.map(s => [
    s.studentId,
    s.prefix,
    s.fullName,
    s.educationLevel,
    s.studyGroup,
    s.vocationalCategory,
    s.department,
    s.studySystem,
    s.phone,
    s.lineId,
    s.currentStatus,
    s.workplaceName || '',
    s.jobPosition || '',
    s.monthlyIncome || '',
    s.jobMatch || '',
    s.province || '',
    s.furtherStudyLevel || '',
    s.institution || '',
    s.facultyMajor || '',
    '',
    s.notes || '',
  ]);

  const worksheetData = [headers, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 18 }, // รหัสนักศึกษา
    { wch: 12 }, // คำนำหน้า
    { wch: 26 }, // ชื่อ-สกุล
    { wch: 14 }, // ระดับชั้น
    { wch: 14 }, // กลุ่มเรียน
    { wch: 18 }, // ประเภทวิชา
    { wch: 22 }, // สาขาวิชา
    { wch: 16 }, // ระบบการเรียน
    { wch: 16 }, // เบอร์โทร
    { wch: 16 }, // Line ID
    { wch: 22 }, // สถานะปัจจุบัน
    { wch: 32 }, // หน่วยงาน
    { wch: 22 }, // ตำแหน่ง
    { wch: 16 }, // รายได้
    { wch: 20 }, // ความตรงสาขา
    { wch: 20 }, // จังหวัด
    { wch: 18 }, // ระดับศึกษาต่อ
    { wch: 26 }, // สถาบันศึกษาต่อ
    { wch: 26 }, // คณะศึกษาต่อ
    { wch: 26 }, // สาเหตุว่างงาน
    { wch: 28 }, // หมายเหตุ
  ];

  // Create instructions sheet
  const instructionHeaders = ['ข้อกำหนดและคำแนะนำการเตรียมไฟล์นำเข้าข้อมูลนักศึกษา'];
  const instructionRows = [
    ['1. คอลัมน์ที่มีเครื่องหมาย * เป็นข้อมูลที่จำเป็นต้องระบุ (รหัสนักศึกษา, คำนำหน้า, ชื่อ-สกุล, กลุ่มเรียน, สาขาวิชา)'],
    ['2. "รหัสนักศึกษา" แนะนำให้เป็นตัวเลข 11 หลัก เช่น 65201010001 (ระบบจะใช้เป็น Username และ Password เริ่มต้น)'],
    ['3. "ระดับชั้น" สามารถระบุเป็น "ปวช." หรือ "ปวส." (หากเว้นว่าง ระบบจะตรวจสอบจากรหัสกลุ่มเรียนให้อัตโนมัติ เช่น ช.3 = ปวช., ส.2 = ปวส.)'],
    ['4. "ประเภทวิชา" ได้แก่: อุตสาหกรรม, บริหารธุรกิจ, คหกรรม, เทคโนโลยีธุรกิจดิจิทัล (หากเว้นว่าง ระบบจะอนุมานจากแผนกวิชาให้อัตโนมัติ)'],
    ['5. "ระบบการเรียน" ได้แก่: ปกติ, ม.6, ทวิภาคี (ค่าเริ่มต้น: ปกติ)'],
    ['6. ข้อมูลภาวะการมีงานทำ (คอลัมน์ K เป็นต้นไป) สามารถเว้นว่างไว้ให้นักศึกษาหรือครูที่ปรึกษาเข้ามาบันทึกเองในระบบภายหลังได้'],
    ['7. สามารถบันทึกไฟล์เป็น .xlsx, .xls หรือ .csv แล้วนำมาอัปโหลดเข้าสู่ระบบได้ทันที'],
  ];
  const instructionSheet = XLSX.utils.aoa_to_sheet([instructionHeaders, [], ...instructionRows]);
  instructionSheet['!cols'] = [{ wch: 100 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อนักศึกษา');
  XLSX.utils.book_append_sheet(workbook, instructionSheet, 'คำแนะนำการใช้งาน');

  XLSX.writeFile(workbook, filename);
};

/**
 * Export all students to formatted Excel (.xlsx) file
 */
export const exportStudentsToExcel = (
  students: StudentRecord[], 
  filename: string = 'รายงานภาวะการมีงานทำ_เทคนิคอ่างทอง.xlsx'
) => {
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
    'สถานะการบันทึกข้อมูล',
    'วันที่อัปเดตล่าสุด',
    'สถานะปัจจุบัน',
    'ชื่อหน่วยงาน/สถานประกอบการ',
    'ตำแหน่งงาน',
    'รายได้ต่อเดือน (บาท)',
    'ลักษณะงานตรงสาขา',
    'จังหวัดที่ตั้งสถานประกอบการ',
    'ระดับการศึกษาต่อ',
    'สถาบันการศึกษาต่อ',
    'คณะ/สาขาวิชาที่ศึกษาต่อ',
    'สาเหตุที่ยังไม่ได้ทำงาน',
    'หมายเหตุ',
  ];

  const rows = students.map((s, idx) => {
    const statusText = 
      s.currentStatus === 'employed' ? 'มีงานทำ / ประกอบอาชีพ' :
      s.currentStatus === 'studying' ? 'ศึกษาต่อ' :
      s.currentStatus === 'unemployed' ? 'ว่างงาน / กำลังหางาน' : 'ยังไม่อัปเดตข้อมูล';

    return [
      idx + 1,
      s.studentId,
      s.prefix || '',
      s.fullName || '',
      s.educationLevel || '',
      s.studyGroup || '',
      s.vocationalCategory || '',
      s.department || '',
      s.studySystem || 'ปกติ',
      s.phone || '',
      s.lineId || '',
      s.isUpdated ? 'อัปเดตแล้ว' : 'ยังไม่อัปเดต',
      s.updatedAt || '-',
      statusText,
      s.workplaceName || '-',
      s.jobPosition || '-',
      s.monthlyIncome !== undefined ? s.monthlyIncome : '-',
      s.jobMatch || '-',
      s.province || '-',
      s.furtherStudyLevel || '-',
      s.institution || '-',
      s.facultyMajor || '-',
      s.unemployedReason || '-',
      s.notes || '',
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 18 }, // รหัส
    { wch: 10 }, // คำนำหน้า
    { wch: 24 }, // ชื่อ-สกุล
    { wch: 12 }, // ระดับ
    { wch: 14 }, // กลุ่ม
    { wch: 18 }, // ประเภท
    { wch: 22 }, // แผนก
    { wch: 14 }, // ระบบ
    { wch: 16 }, // เบอร์
    { wch: 16 }, // Line ID
    { wch: 18 }, // สถานะบันทึก
    { wch: 20 }, // วันที่อัปเดต
    { wch: 22 }, // สถานะปัจจุบัน
    { wch: 32 }, // สถานประกอบการ
    { wch: 22 }, // ตำแหน่ง
    { wch: 18 }, // รายได้
    { wch: 18 }, // ตรงสาขา
    { wch: 20 }, // จังหวัด
    { wch: 18 }, // ระดับศึกษาต่อ
    { wch: 26 }, // สถาบันศึกษาต่อ
    { wch: 26 }, // คณะศึกษาต่อ
    { wch: 26 }, // สาเหตุว่างงาน
    { wch: 24 }, // หมายเหตุ
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานข้อมูลนักศึกษา');
  XLSX.writeFile(workbook, filename);
};

export interface ParsedImportResult {
  success: boolean;
  totalParsed: number;
  validStudents: StudentRecord[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse raw row object into a StudentRecord
 */
export const parseRawRowToStudent = (
  raw: Record<string, any>, 
  index: number
): { student: StudentRecord | null; error?: string; warning?: string } => {
  // Extract keys flexibly by matching patterns
  const keys = Object.keys(raw);
  const findVal = (...patterns: string[]): any => {
    for (const p of patterns) {
      const foundKey = keys.find(k => {
        const cleanK = k.replace(/[*#]/g, '').trim().toLowerCase();
        return cleanK === p.toLowerCase() || cleanK.includes(p.toLowerCase());
      });
      if (foundKey && raw[foundKey] !== undefined && raw[foundKey] !== null) {
        return raw[foundKey];
      }
    }
    return '';
  };

  // 1. Student ID
  let rawStudentId = String(findVal('รหัสนักศึกษา', 'รหัสประจำตัว', 'studentid', 'student_id', 'รหัส') || '').trim();
  // Strip decimals if Excel read it as float like 65201010001.0
  if (rawStudentId.includes('.')) {
    rawStudentId = rawStudentId.split('.')[0];
  }
  // Remove any non-alphanumeric/spaces
  rawStudentId = rawStudentId.replace(/\s+/g, '');

  if (!rawStudentId) {
    return { student: null, error: `แถวที่ ${index + 1}: ไม่พบรหัสนักศึกษา` };
  }

  // 2. Prefix and Full Name
  let prefix = String(findVal('คำนำหน้า', 'คำนำหน้านาม', 'prefix', 'title') || '').trim();
  let fullName = String(findVal('ชื่อ - นามสกุล', 'ชื่อ-นามสกุล', 'ชื่อสกุล', 'fullname', 'name', 'ชื่อ') || '').trim();
  const lastName = String(findVal('นามสกุล', 'lastname', 'surname') || '').trim();

  if (lastName && !fullName.includes(lastName)) {
    fullName = `${fullName} ${lastName}`.trim();
  }

  // Auto separate prefix from fullName if prefix is blank
  if (!prefix) {
    if (fullName.startsWith('นาย ')) {
      prefix = 'นาย';
      fullName = fullName.replace(/^นาย\s+/, '');
    } else if (fullName.startsWith('นางสาว ')) {
      prefix = 'นางสาว';
      fullName = fullName.replace(/^นางสาว\s+/, '');
    } else if (fullName.startsWith('นาง ')) {
      prefix = 'นาง';
      fullName = fullName.replace(/^นาง\s+/, '');
    } else if (fullName.startsWith('นาย')) {
      prefix = 'นาย';
      fullName = fullName.replace(/^นาย/, '');
    } else if (fullName.startsWith('นางสาว')) {
      prefix = 'นางสาว';
      fullName = fullName.replace(/^นางสาว/, '');
    } else if (fullName.startsWith('นาง')) {
      prefix = 'นาง';
      fullName = fullName.replace(/^นาง/, '');
    } else {
      prefix = 'นาย';
    }
  }

  if (!fullName) {
    return { student: null, error: `แถวที่ ${index + 1} (รหัส ${rawStudentId}): ไม่พบชื่อ-นามสกุลนักศึกษา` };
  }

  // 3. Study Group & Department
  const studyGroup = String(findVal('กลุ่มเรียน', 'รหัสกลุ่ม', 'ห้อง', 'studygroup', 'group') || 'ไม่ระบุกลุ่ม').trim();
  let department = String(findVal('สาขาวิชา/แผนก', 'สาขาวิชา', 'แผนกวิชา', 'แผนก', 'สาขา', 'department', 'major') || '').trim();
  
  if (!department) {
    department = 'ทั่วไป';
  }

  // 4. Vocational Category
  let categoryRaw = String(findVal('ประเภทวิชา', 'vocationalcategory', 'category') || '').trim();
  let vocationalCategory: VocationalCategory = 'อุตสาหกรรม';
  if (['อุตสาหกรรม', 'บริหารธุรกิจ', 'คหกรรม', 'เทคโนโลยีธุรกิจดิจิทัล'].includes(categoryRaw)) {
    vocationalCategory = categoryRaw as VocationalCategory;
  } else {
    vocationalCategory = inferCategoryFromDepartment(department);
  }

  // 5. Education Level
  const levelRaw = String(findVal('ระดับชั้น', 'ระดับการศึกษา', 'educationlevel', 'level') || '').trim();
  const educationLevel = inferEducationLevel(studyGroup, levelRaw);

  // 6. Study System
  let studySystem: StudySystem = 'ปกติ';
  const systemRaw = String(findVal('ระบบการเรียน', 'ระบบ', 'studysystem') || '').trim();
  if (systemRaw.includes('ทวิ')) {
    studySystem = 'ทวิภาคี';
  } else if (systemRaw.includes('ม.6') || systemRaw.includes('ม6')) {
    studySystem = 'ม.6';
  }

  // 7. Contact info
  const phone = String(findVal('เบอร์โทรศัพท์', 'โทรศัพท์', 'phone', 'tel', 'เบอร์') || '').trim();
  const lineId = String(findVal('line id', 'lineid', 'line', 'ไลน์ไอดี', 'ไลน์') || '').trim();

  // 8. Survey status if already present in file
  const rawStatus = String(findVal('สถานะปัจจุบัน', 'สถานะ', 'currentstatus', 'status') || '').trim();
  let currentStatus: CurrentStatus = 'not_updated';
  let isUpdated = false;

  if (rawStatus.includes('งาน') || rawStatus.includes('ทำงาน') || rawStatus.toLowerCase().includes('employ')) {
    currentStatus = 'employed';
    isUpdated = true;
  } else if (rawStatus.includes('ศึกษา') || rawStatus.includes('เรียน') || rawStatus.toLowerCase().includes('study')) {
    currentStatus = 'studying';
    isUpdated = true;
  } else if (rawStatus.includes('ว่าง') || rawStatus.includes('หา') || rawStatus.toLowerCase().includes('unemploy')) {
    currentStatus = 'unemployed';
    isUpdated = true;
  }

  const workplaceName = String(findVal('ชื่อหน่วยงาน/บริษัท', 'ชื่อหน่วยงาน', 'สถานประกอบการ', 'บริษัท', 'workplacename', 'workplace') || '').trim() || undefined;
  const jobPosition = String(findVal('ตำแหน่งงาน', 'ตำแหน่ง', 'jobposition', 'position') || '').trim() || undefined;
  const rawIncome = findVal('รายได้ต่อเดือน', 'รายได้', 'เงินเดือน', 'monthlyincome', 'income', 'salary');
  const monthlyIncome = rawIncome ? Number(String(rawIncome).replace(/[^0-9.]/g, '')) || undefined : undefined;
  
  const rawMatch = String(findVal('ความตรงสาขา', 'ลักษณะงานตรงสาขา', 'ตรงสาขา', 'jobmatch') || '').trim();
  let jobMatch: JobMatch | undefined = undefined;
  if (rawMatch.includes('ไม่ตรง')) {
    jobMatch = 'ไม่ตรงสาขา';
  } else if (rawMatch.includes('ประยุกต์')) {
    jobMatch = 'ประยุกต์ใช้';
  } else if (rawMatch.includes('ตรง')) {
    jobMatch = 'ตรงสาขา';
  }

  const province = String(findVal('จังหวัดที่ตั้งสถานประกอบการ', 'จังหวัด', 'province') || '').trim() || undefined;
  
  const rawFurtherLevel = String(findVal('ระดับการศึกษาต่อ', 'ระดับที่ศึกษาต่อ', 'furtherstudylevel') || '').trim();
  let furtherStudyLevel: FurtherStudyLevel | undefined = undefined;
  if (rawFurtherLevel.includes('ปวส')) furtherStudyLevel = 'ปวส.';
  else if (rawFurtherLevel.includes('ตรี') || rawFurtherLevel.includes('ปริญญา')) furtherStudyLevel = 'ปริญญาตรี';
  else if (rawFurtherLevel) furtherStudyLevel = 'อื่นๆ';

  const institution = String(findVal('สถาบันการศึกษาต่อ', 'สถาบัน', 'มหาวิทยาลัย', 'วิทยาลัย', 'institution') || '').trim() || undefined;
  const facultyMajor = String(findVal('คณะ/สาขาวิชาที่ศึกษาต่อ', 'คณะ', 'สาขาศึกษาต่อ', 'facultymajor') || '').trim() || undefined;
  const unemployedReason = String(findVal('สาเหตุที่ยังไม่ได้ทำงาน', 'สาเหตุว่างงาน', 'unemployedreason') || '').trim() || undefined;
  const notes = String(findVal('หมายเหตุ', 'notes', 'remark') || '').trim() || undefined;

  // If workplaceName or institution is provided, mark as updated
  if ((workplaceName || jobPosition) && currentStatus === 'not_updated') {
    currentStatus = 'employed';
    isUpdated = true;
  } else if ((institution || facultyMajor) && currentStatus === 'not_updated') {
    currentStatus = 'studying';
    isUpdated = true;
  }

  const student: StudentRecord = {
    id: `std-${rawStudentId}`,
    studentId: rawStudentId,
    prefix,
    fullName,
    educationLevel,
    studyGroup,
    vocationalCategory,
    department,
    studySystem,
    phone,
    lineId,
    isUpdated,
    updatedAt: isUpdated ? new Date().toLocaleString('th-TH') : null,
    currentStatus,
    workplaceName,
    jobPosition,
    monthlyIncome,
    jobMatch,
    province,
    furtherStudyLevel,
    institution,
    facultyMajor,
    unemployedReason,
    notes,
  };

  return { student };
};

/**
 * Parse Excel or CSV ArrayBuffer/Binary into StudentRecords
 */
export const parseStudentWorkbook = (workbook: XLSX.WorkBook): ParsedImportResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validStudents: StudentRecord[] = [];
  const seenStudentIds = new Set<string>();

  // Pick first sheet
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return {
      success: false,
      totalParsed: 0,
      validStudents: [],
      errors: ['ไม่พบแผ่นงาน (Sheet) ในไฟล์'],
      warnings: [],
    };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse rows as array of objects
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    return {
      success: false,
      totalParsed: 0,
      validStudents: [],
      errors: ['ไฟล์ว่างเปล่า ไม่พบแถวข้อมูลนักศึกษา'],
      warnings: [],
    };
  }

  rawRows.forEach((row, idx) => {
    // Check if entire row is empty
    const values = Object.values(row).filter(v => String(v).trim() !== '');
    if (values.length === 0) return;

    const { student, error, warning } = parseRawRowToStudent(row, idx);
    if (error) {
      errors.push(error);
      return;
    }

    if (warning) {
      warnings.push(warning);
    }

    if (student) {
      if (seenStudentIds.has(student.studentId)) {
        warnings.push(`แถวที่ ${idx + 1}: รหัสนักศึกษา ${student.studentId} ซ้ำกันในไฟล์ (ใช้ข้อมูลแถวล่าสุด)`);
        // Overwrite or update
        const existingIdx = validStudents.findIndex(s => s.studentId === student.studentId);
        if (existingIdx >= 0) {
          validStudents[existingIdx] = student;
        }
      } else {
        seenStudentIds.add(student.studentId);
        validStudents.push(student);
      }
    }
  });

  return {
    success: validStudents.length > 0,
    totalParsed: rawRows.length,
    validStudents,
    errors,
    warnings,
  };
};

/**
 * Read File from browser upload and parse
 */
export const parseStudentFile = async (file: File): Promise<ParsedImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            success: false,
            totalParsed: 0,
            validStudents: [],
            errors: ['ไม่สามารถอ่านข้อมูลจากไฟล์ได้'],
            warnings: [],
          });
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const result = parseStudentWorkbook(workbook);
        resolve(result);
      } catch (err: any) {
        console.error('Failed to parse file:', err);
        resolve({
          success: false,
          totalParsed: 0,
          validStudents: [],
          errors: [`เกิดข้อผิดพลาดในการประมวลผลไฟล์: ${err.message || err}`],
          warnings: [],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        totalParsed: 0,
        validStudents: [],
        errors: ['เกิดข้อผิดพลาดในการเปิดไฟล์'],
        warnings: [],
      });
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * Convert Google Sheet Share URL into exportable CSV URL and fetch data
 */
export const fetchGoogleSheetData = async (sheetUrl: string): Promise<ParsedImportResult> => {
  try {
    let cleanUrl = sheetUrl.trim();
    if (!cleanUrl) {
      return {
        success: false,
        totalParsed: 0,
        validStudents: [],
        errors: ['กรุณาระบุ URL ของ Google Sheet'],
        warnings: [],
      };
    }

    // Extract sheet ID from standard Google Sheets URL
    // e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
    let csvUrl = cleanUrl;
    const match = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    
    if (match && match[1]) {
      const sheetId = match[1];
      // Extract gid if present
      const gidMatch = cleanUrl.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    }

    const response = await fetch(csvUrl);
    if (!response.ok) {
      return {
        success: false,
        totalParsed: 0,
        validStudents: [],
        errors: [`ไม่สามารถเข้าถึง Google Sheet ได้ (Status ${response.status}). กรุณาตรวจสอบว่าได้ตั้งค่าการแชร์ให้ "ทุกคนที่มีลิงก์มีสิทธิ์ดู (Anyone with link can view)"`],
        warnings: [],
      };
    }

    const csvText = await response.text();
    const workbook = XLSX.read(csvText, { type: 'string' });
    return parseStudentWorkbook(workbook);
  } catch (err: any) {
    return {
      success: false,
      totalParsed: 0,
      validStudents: [],
      errors: [`ไม่สามารถเชื่อมต่อ Google Sheet: ${err.message || 'กรุณาตรวจสอบการตั้งค่าการแชร์ไฟล์เป็นสาธารณะ'}`],
      warnings: [],
    };
  }
};
