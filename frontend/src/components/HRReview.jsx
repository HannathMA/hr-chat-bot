import { useState, useEffect } from 'react';
import { employeeSubmissions } from '../pages/EmployeeDashboard';
import './HRReview.css';

const STATUS_COLOR = {
  present:        'green',
  work_from_home: 'cyan',
  half_day:       'amber',
  on_leave:       'rose',
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function HRReview({ user }) {
  const [tab, setTab]         = useState('attendance'); // 'attendance' | 'resumes'
  const [attendance, setAtt]  = useState([]);
  const [resumes, setResumes] = useState([]);
  const [employeesMap, setEmployeesMap] = useState({});
  const [tick, setTick]       = useState(0);

  // Load employees once to map IDs to names
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_URL}/api/employees/`);
        if (res.ok) {
          const data = await res.json();
          const map = {};
          data.forEach(emp => {
            map[emp.id] = `${emp.first_name} ${emp.last_name || ''}`.trim();
          });
          setEmployeesMap(map);
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  // Poll database records & merge with local in-memory actions
  useEffect(() => {
    const loadData = async () => {
      let dbAtt = [];
      let dbResumes = [];
      try {
        const attRes = await fetch(`${API_URL}/api/attendance/logs`);
        if (attRes.ok) {
          const logs = await attRes.json();
          dbAtt = logs
            .filter(log => localStorage.getItem(`att_rejected_${log.id}`) !== 'true')
            .map(log => ({
              id: log.id,
              employee_id: log.employee_id,
              employee: employeesMap[log.employee_id] || 'Loading...',
              status: log.status,
              note: log.notes,
              time: log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              date: log.attendance_date,
              approved: !!log.approved_by,
              isDb: true
            }));
        }
      } catch (err) {
        console.warn('Could not load attendance logs:', err);
      }

      try {
        const resumeRes = await fetch(`${API_URL}/api/resumes/`);
        if (resumeRes.ok) {
          const list = await resumeRes.json();
          dbResumes = list.map(res => {
            const reviewed = localStorage.getItem(`resume_reviewed_${res.id}`) === 'true';
            return {
              id: res.id,
              employee_id: res.employee_id,
              employee: employeesMap[res.employee_id] || 'Loading...',
              fileName: res.file_name,
              fileSize: res.file_size_bytes ? (res.file_size_bytes / 1024).toFixed(1) + ' KB' : 'Unknown',
              skills: res.summary ? 'Parsed' : '',
              experience: res.total_experience_yrs ? `${res.total_experience_yrs} yrs` : '',
              summary: res.summary || '',
              submittedAt: res.created_at ? new Date(res.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              reviewed,
              isDb: true
            };
          });
        }
      } catch (err) {
        console.warn('Could not load resumes:', err);
      }

      // Merge local in-memory submissions (avoiding duplicates)
      const mergedAtt = [...dbAtt];
      employeeSubmissions.attendance.forEach(local => {
        const isDuplicate = mergedAtt.some(item => 
          item.id === local.id || 
          (item.employee === local.employee && item.date === local.date)
        );
        if (!isDuplicate && localStorage.getItem(`att_rejected_${local.id}`) !== 'true') {
          mergedAtt.push(local);
        }
      });

      const mergedResumes = [...dbResumes];
      employeeSubmissions.resumes.forEach(local => {
        const isDuplicate = mergedResumes.some(item => 
          item.id === local.id || 
          (item.employee === local.employee && item.fileName === local.fileName)
        );
        if (!isDuplicate) {
          const reviewed = localStorage.getItem(`resume_reviewed_${local.id}`) === 'true';
          mergedResumes.push({ ...local, reviewed });
        }
      });

      setAtt(mergedAtt);
      setResumes(mergedResumes);
    };

    loadData();
    const id = setInterval(() => {
      loadData();
    }, 4000);
    return () => clearInterval(id);
  }, [employeesMap, tick]);

  const approveAtt = async (id, isDb) => {
    if (isDb) {
      try {
        const approverId = user?.id || '6a967947-ce10-4889-a8c0-117be0c295f3';
        const res = await fetch(`${API_URL}/api/attendance/${id}/approve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved_by: approverId })
        });
        if (!res.ok) throw new Error('Failed to approve');
      } catch (err) {
        console.error(err);
      }
    } else {
      const idx = employeeSubmissions.attendance.findIndex(a => a.id === id);
      if (idx !== -1) employeeSubmissions.attendance[idx].approved = true;
    }
    setTick(t => t + 1);
  };

  const rejectAtt = async (id, isDb) => {
    if (isDb) {
      localStorage.setItem(`att_rejected_${id}`, 'true');
    } else {
      employeeSubmissions.attendance = employeeSubmissions.attendance.filter(a => a.id !== id);
    }
    setTick(t => t + 1);
  };

  const viewResume = (resume) => {
    localStorage.setItem(`resume_reviewed_${resume.id}`, 'true');
    const idx = employeeSubmissions.resumes.findIndex(r => r.id === resume.id);
    if (idx !== -1) employeeSubmissions.resumes[idx].reviewed = true;
    setTick(t => t + 1);
  };

  return (
    <div className="card hrr-card">
      <div className="hrr-header">
        <div className="card-icon icon-amber">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <div>
          <h2 className="card-title">Employee Submissions</h2>
          <p className="card-subtitle">Review attendance and resumes from employees</p>
        </div>
        <div className="hrr-counters">
          {attendance.filter(a => !a.approved).length > 0 && (
            <span className="hrr-counter counter-amber">
              {attendance.filter(a => !a.approved).length} pending
            </span>
          )}
          {resumes.filter(r => !r.reviewed).length > 0 && (
            <span className="hrr-counter counter-accent">
              {resumes.filter(r => !r.reviewed).length} new
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="hrr-tabs">
        <button className={`hrr-tab ${tab === 'attendance' ? 'active' : ''}`}
          onClick={() => setTab('attendance')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Attendance
          {attendance.filter(a => !a.approved).length > 0 && (
            <span className="tab-badge">{attendance.filter(a => !a.approved).length}</span>
          )}
        </button>
        <button className={`hrr-tab ${tab === 'resumes' ? 'active' : ''}`}
          onClick={() => setTab('resumes')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Resumes
          {resumes.filter(r => !r.reviewed).length > 0 && (
            <span className="tab-badge tab-badge-accent">{resumes.filter(r => !r.reviewed).length}</span>
          )}
        </button>
      </div>

      {/* Attendance tab */}
      {tab === 'attendance' && (
        <div className="hrr-list">
          {attendance.length === 0 ? (
            <div className="hrr-empty">
              <div className="hrr-empty-icon">📋</div>
              <p>No attendance submissions yet.</p>
              <p className="hrr-empty-hint">Ask an employee to log in and mark their attendance.</p>
            </div>
          ) : (
            attendance.map(a => (
              <div key={a.id} className={`hrr-row ${a.approved ? 'hrr-approved' : ''}`}>
                <div className="hrr-emp-avatar">EU</div>
                <div className="hrr-row-info">
                  <div className="hrr-row-name">{a.employee}</div>
                  <div className="hrr-row-meta">
                    <span className={`badge badge-${STATUS_COLOR[a.status] || 'accent'}`}>{a.status.replace(/_/g,' ')}</span>
                    <span className="hrr-dot">·</span>
                    <span>{a.date}</span>
                    <span className="hrr-dot">·</span>
                    <span>{a.time}</span>
                  </div>
                  {a.note && <div className="hrr-note">"{a.note}"</div>}
                </div>
                <div className="hrr-actions">
                  {a.approved ? (
                    <span className="badge badge-green">✓ Approved</span>
                  ) : (
                    <>
                      <button className="hrr-btn hrr-approve" onClick={() => approveAtt(a.id, a.isDb)}>Approve</button>
                      <button className="hrr-btn hrr-reject"  onClick={() => rejectAtt(a.id, a.isDb)}>Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Resumes tab */}
      {tab === 'resumes' && (
        <div className="hrr-list">
          {resumes.length === 0 ? (
            <div className="hrr-empty">
              <div className="hrr-empty-icon">📄</div>
              <p>No resume submissions yet.</p>
              <p className="hrr-empty-hint">Ask an employee to log in and submit their resume.</p>
            </div>
          ) : (
            resumes.map(r => (
              <div key={r.id} className={`hrr-row ${r.reviewed ? 'hrr-approved' : ''}`}>
                <div className="hrr-file-icon">📄</div>
                <div className="hrr-row-info">
                  <div className="hrr-row-name">
                    {r.employee}
                    {!r.reviewed && <span className="new-tag">NEW</span>}
                  </div>
                  <div className="hrr-row-meta">
                    <span className="hrr-filename">{r.fileName}</span>
                    <span className="hrr-dot">·</span>
                    <span>{r.fileSize}</span>
                    <span className="hrr-dot">·</span>
                    <span>{r.submittedAt}</span>
                  </div>
                  {r.skills     && <div className="hrr-detail"><strong>Skills:</strong> {r.skills}</div>}
                  {r.experience && <div className="hrr-detail"><strong>Exp:</strong> {r.experience}</div>}
                  {r.summary    && <div className="hrr-note">"{r.summary}"</div>}
                </div>
                <div className="hrr-actions">
                  {r.reviewed ? (
                    <span className="badge badge-cyan">✓ Reviewed</span>
                  ) : (
                    <button className="hrr-btn hrr-approve" onClick={() => viewResume(r)}>Mark Reviewed</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
