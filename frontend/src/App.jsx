import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Sidebar from './components/Sidebar';
import AttendanceCard from './components/AttendanceCard';
import SkillsForm from './components/SkillsForm';
import ProjectTimeline from './components/ProjectTimeline';
import Chatbot from './components/Chatbot';
import HRReview from './components/HRReview';
import './App.css';

const STATS = [
  { label: 'Total Employees', value: '284',  delta: '+12 this month',   color: 'accent' },
  { label: 'Present Today',   value: '231',  delta: '81.3% attendance', color: 'green'  },
  { label: 'Active Projects', value: '14',   delta: '3 due this week',  color: 'cyan'   },
  { label: 'Open Leaves',     value: '7',    delta: '2 pending review', color: 'amber'  },
];

function TopBar({ page, onLogout }) {
  const pageLabel = page.charAt(0).toUpperCase() + page.slice(1);
  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">{pageLabel}</h1>
        <span className="page-date">{now}</span>
      </div>
      <div className="topbar-right">
        <div className="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="search-input" placeholder="Search employees, projects…" />
        </div>
        <button className="btn btn-primary topbar-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Quick Add
        </button>
        <button className="icon-circle-btn" title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="notif-dot" />
        </button>
        <button className="btn btn-ghost topbar-btn" onClick={onLogout}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
}

function StatCard({ stat }) {
  return (
    <div className={`kpi-card kpi-${stat.color}`}>
      <div className="kpi-value">{stat.value}</div>
      <div className="kpi-label">{stat.label}</div>
      <div className="kpi-delta">{stat.delta}</div>
      <div className="kpi-glow" />
    </div>
  );
}

function HRDashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');
  return (
    <div className="app-shell">
      <Sidebar active={activePage} onNav={setActivePage} user={user} />
      <div className="main-area">
        <TopBar page={activePage} onLogout={onLogout} />
        <div className="content-scroll">
          {/* KPI Row */}
          <div className="kpi-row">
            {STATS.map(s => <StatCard key={s.label} stat={s} />)}
          </div>

          {/* HR Review panel — full width above grid */}
          <HRReview user={user} />

          {/* Main dashboard grid */}
          <div className="dashboard-grid">
            <div className="col-left">
              <AttendanceCard user={user} />
              <SkillsForm user={user} />
            </div>
            <div className="col-middle">
              <ProjectTimeline user={user} />
            </div>
            <div className="col-right">
              <Chatbot user={user} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(null); // null | 'hr' | 'employee'
  const [user, setUser] = useState(null);

  const handleLogin = (selectedRole, loggedInUser) => {
    setRole(selectedRole);
    setUser(loggedInUser);
  };

  if (!role) {
    return <LoginPage onLogin={handleLogin} />;
  }
  if (role === 'employee') {
    return <EmployeeDashboard user={user} onLogout={() => { setRole(null); setUser(null); }} />;
  }
  return <HRDashboard user={user} onLogout={() => { setRole(null); setUser(null); }} />;
}
