export type UserRole = 'student' | 'advisor' | 'admin';

export type VocationalCategory = 
  | 'อุตสาหกรรม'
  | 'บริหารธุรกิจ'
  | 'คหกรรม'
  | 'เทคโนโลยีธุรกิจดิจิทัล';

export type EducationLevel = 'ปวช.' | 'ปวส.';

export type StudySystem = 'ปกติ' | 'ม.6' | 'ทวิภาคี';

export type CurrentStatus = 'employed' | 'studying' | 'unemployed' | 'not_updated';

export type JobMatch = 'ตรงสาขา' | 'ไม่ตรงสาขา' | 'ประยุกต์ใช้';

export type FurtherStudyLevel = 'ปวส.' | 'ปริญญาตรี' | 'อื่นๆ';

export interface StudentRecord {
  id: string;
  studentId: string; // 11 digits
  prefix: string; // นาย / นางสาว / นาง
  fullName: string;
  educationLevel: EducationLevel;
  studyGroup: string; // e.g. ส.2ชฟ.1, ช.3ชย.1
  department: string; // e.g. ช่างยนต์, ช่างไฟฟ้า
  vocationalCategory: VocationalCategory;
  studySystem: StudySystem;
  phone: string;
  lineId: string;
  
  isUpdated: boolean;
  updatedAt: string | null;
  currentStatus: CurrentStatus;
  
  // Employed
  workplaceName?: string;
  jobPosition?: string;
  monthlyIncome?: number;
  jobMatch?: JobMatch;
  province?: string;
  
  // Studying
  furtherStudyLevel?: FurtherStudyLevel;
  institution?: string;
  facultyMajor?: string;
  
  // Unemployed
  unemployedReason?: string;
  
  // Note/Remarks
  notes?: string;
}

export interface SystemConfig {
  collegeName: string;
  systemTitle: string;
  academicYear: string;
  contactPhone: string;
  contactEmail: string;
  surveyDeadline: string;
  realtimeSyncEnabled: boolean;
  lastRealtimeUpdateAt: string | null;
  autoSync?: boolean;
}

export interface AdvisorAccount {
  id?: string;
  username: string; // studyGroup code or login username
  name: string;
  department: string;
  studyGroup: string;
  category: VocationalCategory;
  phone?: string;
  email?: string;
}

export interface CurrentUser {
  role: UserRole;
  username: string;
  displayName: string;
  studentData?: StudentRecord;
  advisorData?: AdvisorAccount;
}
