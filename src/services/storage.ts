import { StudentRecord, SystemConfig, AdvisorAccount } from '../types';
import { INITIAL_STUDENTS, DEFAULT_CONFIG, INITIAL_ADVISORS } from '../data/constants';

const STORAGE_KEYS = {
  STUDENTS: 'attc_tracking_students_v1',
  CONFIG: 'attc_tracking_config_v1',
  ADVISORS: 'attc_tracking_advisors_v1',
  LAST_UPDATE: 'attc_tracking_last_update_v1',
  SERVER_SYNC_TIME: 'attc_tracking_server_sync_time_v1',
};

// Real-time Event Definitions
export type RealtimeEventType = 
  | 'students_updated' 
  | 'advisors_updated' 
  | 'config_updated' 
  | 'data_reset' 
  | 'batch_imported'
  | 'server_connected';

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  timestamp: number;
  senderId?: string;
  count?: number;
  detail?: string;
}

type RealtimeListener = (payload: RealtimeEventPayload) => void;
const listeners = new Set<RealtimeListener>();

// Unique Tab/Device instance ID
export const TAB_INSTANCE_ID = typeof window !== 'undefined' 
  ? `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  : 'server_inst';

// Local BroadcastChannel for same-device multi-tab communication
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('attc_realtime_sync_channel');
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type) {
        notifyListeners(event.data);
      }
    };
  }
} catch (e) {
  console.warn('[Realtime] BroadcastChannel init error, falling back to SSE:', e);
}

// Function to invoke all local subscribers
function notifyListeners(payload: RealtimeEventPayload) {
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (err) {
      console.error('[Realtime] Listener error:', err);
    }
  });
}

// Global dispatch for local + broadcast events
export const broadcastRealtimeUpdate = (type: RealtimeEventType, detail?: string, count?: number) => {
  const timestamp = Date.now();
  const payload: RealtimeEventPayload = {
    type,
    timestamp,
    senderId: TAB_INSTANCE_ID,
    detail,
    count,
  };

  try {
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, JSON.stringify({ timestamp, type, detail }));
  } catch (e) {
    // Ignore localStorage quota errors
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (err) {
      console.warn('[Realtime] Broadcast error:', err);
    }
  }

  notifyListeners(payload);
};

export const subscribeRealtimeUpdates = (listener: RealtimeListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// ================= CROSS-DEVICE SERVER SSE & HTTP SYNC =================
let eventSource: EventSource | null = null;
let isFetchingServer = false;
let sseReconnectTimer: any = null;

// Connect to Server-Sent Events (SSE) for live multi-device push updates
export function initCrossDeviceRealtimeSync() {
  if (typeof window === 'undefined' || !('EventSource' in window)) return;

  // Cleanup old connection
  if (eventSource) {
    try {
      eventSource.close();
    } catch {
      // ignore
    }
  }

  try {
    eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      console.log('[Multi-Device Sync] Connected to central real-time server stream');
      // Fetch latest snapshot upon establishing connection
      fetchDataFromServer(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'connected') {
          return;
        }

        // When any device updates the server, refresh local cached data
        fetchDataFromServer(true, payload.detail);
      } catch (err) {
        console.error('[Multi-Device Sync] Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('[Multi-Device Sync] SSE disconnected, attempting reconnect in 3s...');
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      clearTimeout(sseReconnectTimer);
      sseReconnectTimer = setTimeout(() => {
        initCrossDeviceRealtimeSync();
      }, 3000);
    };
  } catch (e) {
    console.error('[Multi-Device Sync] Failed to initialize SSE:', e);
  }
}

// Fetch all fresh data from server and synchronize local cache
export async function fetchDataFromServer(notify = true, customDetail?: string) {
  if (isFetchingServer || typeof window === 'undefined') return;
  isFetchingServer = true;

  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.students && Array.isArray(data.students)) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
      }
      if (data.advisors && Array.isArray(data.advisors)) {
        localStorage.setItem(STORAGE_KEYS.ADVISORS, JSON.stringify(data.advisors));
      }
      if (data.config) {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.config));
      }
      localStorage.setItem(STORAGE_KEYS.SERVER_SYNC_TIME, String(Date.now()));

      if (notify) {
        broadcastRealtimeUpdate('students_updated', customDetail || 'ซิงค์ข้อมูลจากเซิร์ฟเวอร์แบบเรียลไทม์', data.students?.length);
      }
    }
  } catch (err) {
    console.warn('[Multi-Device Sync] Server fetch skipped (using local cache):', err);
  } finally {
    isFetchingServer = false;
  }
}

// Setup background live sync loop & window focus trigger
if (typeof window !== 'undefined') {
  // 1. Start SSE stream immediately
  initCrossDeviceRealtimeSync();

  // 2. Initial fetch
  fetchDataFromServer(false);

  // 3. Fallback periodic polling every 6 seconds to ensure cross-device consistency
  setInterval(() => {
    fetchDataFromServer(false);
  }, 6000);

  // 4. Re-sync when user refocuses browser/phone screen
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      fetchDataFromServer(true, 'รีเฟรชข้อมูลล่าสุดอัตโนมัติ');
      if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
        initCrossDeviceRealtimeSync();
      }
    }
  });

  // 5. Cross-tab storage fallback
  window.addEventListener('storage', (e) => {
    if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
      const payload: RealtimeEventPayload = {
        type: e.key === STORAGE_KEYS.STUDENTS ? 'students_updated' :
              e.key === STORAGE_KEYS.ADVISORS ? 'advisors_updated' : 'config_updated',
        timestamp: Date.now(),
        detail: `Storage key ${e.key} changed`,
      };
      notifyListeners(payload);
    }
  });
}

// ================= DATA GETTERS & SETTERS =================

export const getStoredAdvisors = (): AdvisorAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADVISORS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ADVISORS, JSON.stringify(INITIAL_ADVISORS));
      return INITIAL_ADVISORS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ADVISORS;
  } catch (err) {
    console.error('Failed to load advisors:', err);
    return INITIAL_ADVISORS;
  }
};

export const saveAllAdvisors = (advisors: AdvisorAccount[], notify = true) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ADVISORS, JSON.stringify(advisors));
    if (notify) {
      broadcastRealtimeUpdate('advisors_updated', `บันทึกข้อมูลครูที่ปรึกษา (${advisors.length} ท่าน)`, advisors.length);
    }
  } catch (err) {
    console.error('Failed to save advisors:', err);
  }
};

export const updateAdvisorRecord = (updated: AdvisorAccount): AdvisorAccount[] => {
  const current = getStoredAdvisors();
  const index = current.findIndex(a => (updated.id && a.id === updated.id) || a.username === updated.username);
  let nextList: AdvisorAccount[];

  if (index >= 0) {
    nextList = [...current];
    nextList[index] = { ...nextList[index], ...updated };
  } else {
    nextList = [
      ...current,
      { ...updated, id: updated.id || `adv-${Date.now()}` }
    ];
  }

  saveAllAdvisors(nextList, true);

  // Sync to server
  fetch('/api/advisors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  }).catch(e => console.warn('Failed to push advisor update to server:', e));

  return nextList;
};

export const deleteAdvisorRecord = (idOrUsername: string): AdvisorAccount[] => {
  const current = getStoredAdvisors();
  const nextList = current.filter(a => a.id !== idOrUsername && a.username !== idOrUsername);
  saveAllAdvisors(nextList, true);

  // Sync to server
  fetch(`/api/advisors/${encodeURIComponent(idOrUsername)}`, {
    method: 'DELETE',
  }).catch(e => console.warn('Failed to push advisor delete to server:', e));

  return nextList;
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
    console.error('Failed to load students:', err);
    return INITIAL_STUDENTS;
  }
};

export const saveAllStudents = (students: StudentRecord[], notify = true) => {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    if (notify) {
      broadcastRealtimeUpdate('students_updated', `อัปเดตข้อมูลนักเรียน (${students.length} รายการ)`, students.length);
    }
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
      isUpdated: updated.isUpdated !== undefined ? updated.isUpdated : true,
      updatedAt: updated.updatedAt !== undefined ? updated.updatedAt : (updated.isUpdated ? new Date().toLocaleString('th-TH') : null),
    };
  } else {
    nextList = [
      ...current,
      {
        ...updated,
        id: updated.id || `std-${Date.now()}`,
        isUpdated: updated.isUpdated !== undefined ? updated.isUpdated : false,
        updatedAt: updated.updatedAt || (updated.isUpdated ? new Date().toLocaleString('th-TH') : null),
      }
    ];
  }
  
  saveAllStudents(nextList, false);
  const actionText = index >= 0 ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลใหม่สำเร็จ';
  broadcastRealtimeUpdate('students_updated', `นักศึกษา ${updated.prefix}${updated.fullName} (${updated.studentId}) ${actionText}`, nextList.length);

  // Sync to central server (which broadcasts via SSE to all other devices/browsers)
  fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  }).catch(e => console.warn('Failed to push student update to server:', e));

  return nextList;
};

export const forceServerSync = (): { students: StudentRecord[]; advisors: AdvisorAccount[]; config: SystemConfig } => {
  // Trigger immediate server fetch
  fetchDataFromServer(false);

  const students = getStoredStudents();
  const advisors = getStoredAdvisors();
  const config = getStoredConfig();
  
  broadcastRealtimeUpdate('students_updated', `รีเฟรชและซิงค์ฐานข้อมูลทั้งเซิร์ฟเวอร์เรียบร้อย (${students.length} รายการ)`, students.length);
  return { students, advisors, config };
};

export const deleteStudentRecord = (id: string): StudentRecord[] => {
  const current = getStoredStudents();
  const nextList = current.filter(s => s.id !== id && s.studentId !== id);
  saveAllStudents(nextList, true);

  // Sync delete to server
  fetch(`/api/students/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch(e => console.warn('Failed to push student delete to server:', e));

  return nextList;
};

export const resetStudentRecord = (id: string): StudentRecord[] => {
  const current = getStoredStudents();
  const index = current.findIndex(s => s.id === id || s.studentId === id);
  if (index >= 0) {
    const nextList = [...current];
    nextList[index] = {
      ...nextList[index],
      isUpdated: false,
      updatedAt: null,
      currentStatus: 'not_updated',
      workplaceName: undefined,
      jobPosition: undefined,
      monthlyIncome: undefined,
      jobMatch: undefined,
      province: undefined,
      furtherStudyLevel: undefined,
      institution: undefined,
      facultyMajor: undefined,
      unemployedReason: undefined,
      notes: undefined,
    };
    saveAllStudents(nextList, true);

    // Sync to server
    fetch(`/api/students/${encodeURIComponent(id)}/reset`, {
      method: 'POST',
    }).catch(e => console.warn('Failed to push student reset to server:', e));

    return nextList;
  }
  return current;
};

export const batchImportStudents = (
  imported: StudentRecord[],
  mode: 'merge' | 'replace'
): StudentRecord[] => {
  let nextList: StudentRecord[];

  if (mode === 'replace') {
    nextList = imported;
  } else {
    // Merge Mode
    const current = getStoredStudents();
    const studentMap = new Map<string, StudentRecord>();

    current.forEach(s => {
      studentMap.set(s.studentId, s);
    });

    imported.forEach(imp => {
      const existing = studentMap.get(imp.studentId);
      if (existing) {
        studentMap.set(imp.studentId, {
          ...existing,
          ...imp,
          id: existing.id || imp.id,
          isUpdated: imp.isUpdated !== undefined ? imp.isUpdated : existing.isUpdated,
          updatedAt: imp.updatedAt || existing.updatedAt,
        });
      } else {
        studentMap.set(imp.studentId, imp);
      }
    });

    nextList = Array.from(studentMap.values());
  }

  saveAllStudents(nextList, false);
  broadcastRealtimeUpdate('batch_imported', `นำเข้าข้อมูลนักศึกษาเรียบร้อย (${nextList.length} รายการ)`, nextList.length);

  // Sync batch to server
  fetch('/api/students/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students: imported, mode }),
  }).catch(e => console.warn('Failed to push batch import to server:', e));

  return nextList;
};

export const getStoredConfig = (): SystemConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      return DEFAULT_CONFIG;
    }
    const parsed = JSON.parse(raw);
    if (parsed.systemTitle === 'ศูนย์บริหารจัดการข้อมูลภาวะการมีงานทำ (วิทยาลัยเทคนิคอ่างทอง)' || !parsed.systemTitle) {
      parsed.systemTitle = DEFAULT_CONFIG.systemTitle;
    }
    return { ...DEFAULT_CONFIG, ...parsed, realtimeSyncEnabled: true };
  } catch (err) {
    console.error('Failed to load system config:', err);
    return DEFAULT_CONFIG;
  }
};

export const saveStoredConfig = (config: Partial<SystemConfig>): SystemConfig => {
  const current = getStoredConfig();
  const next: SystemConfig = { 
    ...current, 
    ...config, 
    realtimeSyncEnabled: true,
    lastRealtimeUpdateAt: new Date().toLocaleString('th-TH') 
  };
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(next));
    broadcastRealtimeUpdate('config_updated', 'อัปเดตการตั้งค่าระบบเรียลไทม์');
  } catch (err) {
    console.error('Failed to save config:', err);
  }

  // Sync config to server
  fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  }).catch(e => console.warn('Failed to push config update to server:', e));

  return next;
};

export const resetToInitialData = (): { students: StudentRecord[]; config: SystemConfig; advisors: AdvisorAccount[] } => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
  localStorage.setItem(STORAGE_KEYS.ADVISORS, JSON.stringify(INITIAL_ADVISORS));
  broadcastRealtimeUpdate('data_reset', 'รีเซ็ตฐานข้อมูลเป็นค่าเริ่มต้นสำหรับการสาธิต');

  // Sync reset to server
  fetch('/api/reset', { method: 'POST' }).catch(e => console.warn('Failed to push reset to server:', e));

  return { students: INITIAL_STUDENTS, config: DEFAULT_CONFIG, advisors: INITIAL_ADVISORS };
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

👉 ขอให้นักศึกษาเข้าสู่ระบบเพื่อบันทึกข้อมูลด่วนที่ระบบติดตามงาน (อัปเดตเรียลไทม์):
เข้าสู่ระบบด้วย: รหัสนักศึกษา 11 หลัก (ทั้ง Username และ Password)
🙏 ขอบคุณสำหรับความร่วมมือครับ/ค่ะ`;
};
