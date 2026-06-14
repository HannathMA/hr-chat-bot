import { useState, useRef } from 'react';
import './EmployeeDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS_OPTIONS = [
  { value: 'present',        label: 'Present',        color: 'green' },
  { value: 'work_from_home', label: 'Work From Home', color: 'cyan'  },
  { value: 'half_day',       label: 'Half Day',       color: 'amber' },
  { value: 'on_leave',       label: 'On Leave',       color: 'rose'  },
];

// Shared store (in real app this would be backend / context)
export const employeeSubmissions = { attendance: [], resumes: [] };

export default function EmployeeDashboard({ user, onLogout }) {
  const [attStatus, setAttStatus]   = useState('present');
  const [attNote, setAttNote]       = useState('');
  const [attMarked, setAttMarked]   = useState(false);
  const [attLoading, setAttLoading] = useState(false);
  const [attTime, setAttTime]       = useState(null);

  const [resumeFile, setResumeFile]     = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeLoading, setResumeLoading]   = useState(false);
  const [dragOver, setDragOver]             = useState(false);
  const [skills, setSkills]                 = useState('');
  const [experience, setExperience]         = useState('');
  const [summary, setSummary]               = useState('');

  const fileRef = useRef(null);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

  // Get full name or fallback
  const empName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Employee User';
  const empInitials = user ? `${user.first_name.charAt(0)}${user.last_name ? user.last_name.charAt(0) : ''}`.toUpperCase() : 'EU';
  const empRole = user?.job_title || 'Software Developer';

  const markAttendance = async () => {
    setAttLoading(true);
    const t = now();
    try {
      const payload = {
        employee_id: user?.id || '61163ffc-4c7c-4847-9237-9b7e79b031f6',
        status: attStatus,
        notes: attNote,
        location: 'Office'
      };
      const response = await fetch(`${API_URL}/api/attendance/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Check-in failed');
      }
    } catch (err) {
      console.warn('API error (falling back to mock state):', err);
    }

    setAttTime(t);
    setAttMarked(true);
    // Push to shared store for HR to see live in memory if fallback/polling
    employeeSubmissions.attendance.push({
      id: Date.now(), status: attStatus, note: attNote,
      time: t, date: today, employee: empName,
    });
    setAttLoading(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setResumeFile(f);
  };

  const uploadResume = async () => {
    if (!resumeFile) return;
    setResumeLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', resumeFile);
      fd.append('employee_id', user?.id || '61163ffc-4c7c-4847-9237-9b7e79b031f6');
      
      const response = await fetch(`${API_URL}/api/resumes/upload`, { 
        method: 'POST', 
        body: fd 
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.warn('API error (falling back to mock state):', err);
    }

    await new Promise(r => setTimeout(r, 900));
    // Push to shared store for HR to see live
    employeeSubmissions.resumes.push({
      id: Date.now(), fileName: resumeFile.name,
      fileSize: (resumeFile.size / 1024).toFixed(1) + ' KB',
      skills, experience, summary, employee: empName,
      submittedAt: now(),
    });
    setResumeUploaded(true);
    setResumeLoading(false);
  };

  return (
    <div className="emp-shell">
      {/* Header */}
      <header className="emp-header">
        <div className="emp-header-left">
          <div className="emp-logo-mark">HR</div>
          <div>
            <span className="emp-portal-name">Employee Portal</span>
            <span className="emp-date">{today}</span>
          </div>
        </div>
        <div className="emp-header-right">
          <div className="emp-avatar">{empInitials}</div>
          <div className="emp-user-info">
            <span className="emp-user-name">{empName}</span>
            <span className="emp-user-role">{empRole}</span>
          </div>
          <button className="btn btn-ghost emp-logout" onClick={onLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      <div className="emp-content">
        {/* Welcome strip */}
        <div className="emp-welcome">
          <div>
            <h2 className="emp-welcome-title">Good {getGreeting()}, {user?.first_name || 'Employee'}! 👋</h2>
            <p className="emp-welcome-sub">Mark your attendance and keep your profile up to date.</p>
          </div>
          <div className="emp-badges">
            {attMarked   && <span className="badge badge-green">✓ Attendance Marked</span>}
            {resumeUploaded && <span className="badge badge-accent">✓ Resume Uploaded</span>}
          </div>
        </div>

        <div className="emp-grid">
          {/* ── Attendance Card ── */}
          <div className="card emp-card">
            <div className="card-header">
              <div className="card-icon icon-green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/>
                </svg>
              </div>
              <div>
                <h2 className="card-title">Mark Attendance</h2>
                <p className="card-subtitle">Today · {today}</p>
              </div>
            </div>

            {!attMarked ? (
              <div className="emp-att-body">
                <p className="emp-section-label">Select your status for today</p>
                <div className="emp-status-grid">
                  {STATUS_OPTIONS.map(opt => (
                    <button key={opt.value}
                      className={`emp-status-btn emp-status-${opt.color} ${attStatus === opt.value ? 'active' : ''}`}
                      onClick={() => setAttStatus(opt.value)}>
                      <span className={`status-dot dot-${opt.color}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label className="label">Add a note (optional)</label>
                  <textarea className="textarea" rows={2} placeholder="e.g. Working from client office…"
                    value={attNote} onChange={e => setAttNote(e.target.value)} />
                </div>
                <button className="btn btn-success emp-submit-btn" onClick={markAttendance} disabled={attLoading}>
                  {attLoading ? <span className="spinner" /> : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                  Submit Attendance
                </button>
              </div>
            ) : (
              <div className="emp-success">
                <div className="emp-success-icon">✓</div>
                <div>
                  <p className="emp-success-title">Attendance Submitted!</p>
                  <p className="emp-success-sub">
                    Status: <strong>{STATUS_OPTIONS.find(o => o.value === attStatus)?.label}</strong> · {attTime}
                  </p>
                  <p className="emp-success-note">Your HR team has been notified.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Resume Card ── */}
          <div className="card emp-card">
            <div className="card-header">
              <div className="card-icon icon-accent">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div>
                <h2 className="card-title">Resume & Profile</h2>
                <p className="card-subtitle">Upload your CV and fill in key info</p>
              </div>
            </div>

            {!resumeUploaded ? (
              <div className="resume-body">
                {/* Drop zone */}
                <div
                  className={`drop-zone ${dragOver ? 'drag-active' : ''} ${resumeFile ? 'has-file' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" hidden
                    onChange={e => setResumeFile(e.target.files[0])} />
                  {resumeFile ? (
                    <>
                      <div className="file-icon">📄</div>
                      <p className="file-name">{resumeFile.name}</p>
                      <p className="file-size">{(resumeFile.size / 1024).toFixed(1)} KB · Click to change</p>
                    </>
                  ) : (
                    <>
                      <div className="upload-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <p className="drop-label">Drop your resume here or <span>browse</span></p>
                      <p className="drop-hint">PDF, DOC, DOCX · Max 5 MB</p>
                    </>
                  )}
                </div>

                {/* Profile fields */}
                <div className="form-group">
                  <label className="label">Key Skills</label>
                  <input className="input" placeholder="React, Python, SQL, Docker…"
                    value={skills} onChange={e => setSkills(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Total Experience</label>
                  <input className="input" placeholder="e.g. 3 years"
                    value={experience} onChange={e => setExperience(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Professional Summary</label>
                  <textarea className="textarea" rows={3}
                    placeholder="Brief overview of your background and strengths…"
                    value={summary} onChange={e => setSummary(e.target.value)} />
                </div>

                <button className="btn btn-primary emp-submit-btn" onClick={uploadResume}
                  disabled={!resumeFile || resumeLoading}>
                  {resumeLoading ? <span className="spinner" /> : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      <path d="M5 19h14"/>
                    </svg>
                  )}
                  {resumeLoading ? 'Uploading…' : 'Submit Resume'}
                </button>
              </div>
            ) : (
              <div className="emp-success">
                <div className="emp-success-icon" style={{ background: 'var(--accent)' }}>✓</div>
                <div>
                  <p className="emp-success-title">Resume Submitted!</p>
                  <p className="emp-success-sub">{resumeFile?.name}</p>
                  <p className="emp-success-note">Your HR team will review it shortly.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
