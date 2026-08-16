import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_STUDENTS, INITIAL_ADVISORS, DEFAULT_CONFIG } from './src/data/constants';
import { StudentRecord, AdvisorAccount, SystemConfig } from './src/types';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Interface for server database
interface DatabaseState {
  students: StudentRecord[];
  advisors: AdvisorAccount[];
  config: SystemConfig;
  lastUpdated: number;
}

// In-memory state
let db: DatabaseState = {
  students: [...INITIAL_STUDENTS],
  advisors: [...INITIAL_ADVISORS],
  config: { ...DEFAULT_CONFIG },
  lastUpdated: Date.now(),
};

// Ensure data folder and load persisted data
function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.students)) {
        db = {
          students: parsed.students,
          advisors: Array.isArray(parsed.advisors) && parsed.advisors.length > 0 ? parsed.advisors : INITIAL_ADVISORS,
          config: parsed.config ? { ...DEFAULT_CONFIG, ...parsed.config } : DEFAULT_CONFIG,
          lastUpdated: parsed.lastUpdated || Date.now(),
        };
        console.log(`[Database] Loaded ${db.students.length} students from disk.`);
        return;
      }
    }
    // If no existing file, write initial data
    saveDatabaseToDisk();
  } catch (err) {
    console.error('[Database] Failed to initialize DB from disk, using defaults:', err);
  }
}

function saveDatabaseToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastUpdated = Date.now();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Failed to write database to disk:', err);
  }
}

// SSE (Server-Sent Events) clients registry for cross-device real-time sync
const sseClients = new Set<Response>();

function broadcastSseEvent(type: string, detail?: string, count?: number) {
  const payload = JSON.stringify({
    type,
    timestamp: Date.now(),
    detail: detail || 'Database updated',
    count: count !== undefined ? count : db.students.length,
    studentsCount: db.students.length,
  });

  const sseData = `data: ${payload}\n\n`;

  sseClients.forEach((client) => {
    try {
      client.write(sseData);
    } catch (err) {
      console.warn('[SSE] Error sending to client, removing client:', err);
      sseClients.delete(client);
    }
  });
}

// Periodic keep-alive ping for SSE
setInterval(() => {
  sseClients.forEach((client) => {
    try {
      client.write(': keepalive\n\n');
    } catch {
      sseClients.delete(client);
    }
  });
}, 15000);

async function startServer() {
  initDatabase();

  const app = express();
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // ================= API ROUTES =================

  // 1. Health check & live connection count
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      connectedClients: sseClients.size,
      studentsCount: db.students.length,
      lastUpdated: db.lastUpdated,
      timestamp: Date.now(),
    });
  });

  // 2. Real-time SSE Stream (Connects multiple devices for live updates)
  app.get('/api/events', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now(), clientCount: sseClients.size + 1 })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // 3. Get all data (students, advisors, config)
  app.get('/api/data', (_req: Request, res: Response) => {
    res.json({
      students: db.students,
      advisors: db.advisors,
      config: db.config,
      lastUpdated: db.lastUpdated,
    });
  });

  // 4. Save/Update single student
  app.post('/api/students', (req: Request, res: Response) => {
    const student = req.body as StudentRecord;
    if (!student || !student.studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    const index = db.students.findIndex(s => s.id === student.id || s.studentId === student.studentId);
    let actionType = 'add';

    if (index >= 0) {
      actionType = 'update';
      db.students[index] = {
        ...db.students[index],
        ...student,
        isUpdated: student.isUpdated !== undefined ? student.isUpdated : true,
        updatedAt: student.updatedAt !== undefined ? student.updatedAt : (student.isUpdated ? new Date().toLocaleString('th-TH') : null),
      };
    } else {
      actionType = 'add';
      db.students.push({
        ...student,
        id: student.id || `std-${Date.now()}`,
        isUpdated: student.isUpdated !== undefined ? student.isUpdated : false,
        updatedAt: student.updatedAt || (student.isUpdated ? new Date().toLocaleString('th-TH') : null),
      });
    }

    saveDatabaseToDisk();
    const actionDesc = actionType === 'add' ? 'เพิ่มข้อมูลใหม่' : 'อัปเดตข้อมูล';
    broadcastSseEvent('students_updated', `นักศึกษา ${student.prefix || ''}${student.fullName} (${student.studentId}) ${actionDesc} สำเร็จ`, db.students.length);

    res.json({
      success: true,
      students: db.students,
      student: index >= 0 ? db.students[index] : db.students[db.students.length - 1],
    });
  });

  // 5. Batch import students
  app.post('/api/students/batch', (req: Request, res: Response) => {
    const { students: imported, mode } = req.body as { students: StudentRecord[]; mode: 'merge' | 'replace' };

    if (!Array.isArray(imported)) {
      return res.status(400).json({ error: 'students must be an array' });
    }

    if (mode === 'replace') {
      db.students = imported;
    } else {
      // Merge
      const studentMap = new Map<string, StudentRecord>();
      db.students.forEach(s => studentMap.set(s.studentId, s));

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

      db.students = Array.from(studentMap.values());
    }

    saveDatabaseToDisk();
    broadcastSseEvent('batch_imported', `นำเข้าข้อมูลนักศึกษาเรียบร้อย (${db.students.length} รายการ)`, db.students.length);

    res.json({
      success: true,
      students: db.students,
      count: db.students.length,
    });
  });

  // 6. Delete student
  app.delete('/api/students/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.students = db.students.filter(s => s.id !== id && s.studentId !== id);

    saveDatabaseToDisk();
    broadcastSseEvent('students_updated', `ลบข้อมูลนักศึกษาเรียบร้อย คงเหลือ ${db.students.length} รายการ`, db.students.length);

    res.json({ success: true, students: db.students });
  });

  // 7. Reset student survey status
  app.post('/api/students/:id/reset', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.students.findIndex(s => s.id === id || s.studentId === id);

    if (index >= 0) {
      db.students[index] = {
        ...db.students[index],
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

      saveDatabaseToDisk();
      broadcastSseEvent('students_updated', `รีเซ็ตสถานะแบบสำรวจของนักศึกษา ${db.students[index].fullName}`, db.students.length);
      return res.json({ success: true, student: db.students[index], students: db.students });
    }

    res.status(404).json({ error: 'Student not found' });
  });

  // 8. Save/Update advisor
  app.post('/api/advisors', (req: Request, res: Response) => {
    const advisor = req.body as AdvisorAccount;
    const index = db.advisors.findIndex(a => (advisor.id && a.id === advisor.id) || a.username === advisor.username);

    if (index >= 0) {
      db.advisors[index] = { ...db.advisors[index], ...advisor };
    } else {
      db.advisors.push({
        ...advisor,
        id: advisor.id || `adv-${Date.now()}`,
      });
    }

    saveDatabaseToDisk();
    broadcastSseEvent('advisors_updated', `อัปเดตข้อมูลครูที่ปรึกษา ${advisor.name}`);
    res.json({ success: true, advisors: db.advisors });
  });

  // 9. Delete advisor
  app.delete('/api/advisors/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.advisors = db.advisors.filter(a => a.id !== id && a.username !== id);

    saveDatabaseToDisk();
    broadcastSseEvent('advisors_updated', `ลบข้อมูลครูที่ปรึกษาเรียบร้อย`);
    res.json({ success: true, advisors: db.advisors });
  });

  // 10. Save config
  app.post('/api/config', (req: Request, res: Response) => {
    const updated = req.body as Partial<SystemConfig>;
    db.config = {
      ...db.config,
      ...updated,
      realtimeSyncEnabled: true,
      lastRealtimeUpdateAt: new Date().toLocaleString('th-TH'),
    };

    saveDatabaseToDisk();
    broadcastSseEvent('config_updated', 'อัปเดตการตั้งค่าระบบเรียบร้อย');
    res.json({ success: true, config: db.config });
  });

  // 11. Reset whole database to defaults
  app.post('/api/reset', (_req: Request, res: Response) => {
    db.students = [...INITIAL_STUDENTS];
    db.advisors = [...INITIAL_ADVISORS];
    db.config = { ...DEFAULT_CONFIG };
    saveDatabaseToDisk();
    broadcastSseEvent('data_reset', 'รีเซ็ตข้อมูลทั้งระบบกลับเป็นค่าเริ่มต้น', db.students.length);
    res.json({ success: true, students: db.students, advisors: db.advisors, config: db.config });
  });

  // ================= VITE / STATIC SERVING =================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Application running in full-stack multi-device mode on http://0.0.0.0:${PORT}`);
  });
}

startServer();
