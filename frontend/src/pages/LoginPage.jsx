import { useState } from 'react';
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
  const [role, setRole]       = useState(null); // 'employee' | 'hr'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // Demo credentials
  const DEMO = {
    employee: { email: 'employee@hrportal.com', password: 'emp123' },
    hr:       { email: 'aprnna@hrportal.com',   password: 'hr123'  },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const creds = DEMO[role];
      if (email !== creds.email || password !== creds.password) {
        setError('Invalid credentials. Use the demo hint below.');
        setLoading(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/employees/`);
      if (res.ok) {
        const employees = await res.json();
        const matchedUser = employees.find(emp => emp.email.toLowerCase() === email.toLowerCase());
        if (matchedUser) {
          onLogin(role, matchedUser);
        } else {
          onLogin(role, { id: role === 'hr' ? '6a967947-ce10-4889-a8c0-117be0c295f3' : '61163ffc-4c7c-4847-9237-9b7e79b031f6', first_name: role === 'hr' ? 'Aprnna' : 'Demo', email });
        }
      } else {
        onLogin(role, { id: role === 'hr' ? '6a967947-ce10-4889-a8c0-117be0c295f3' : '61163ffc-4c7c-4847-9237-9b7e79b031f6', first_name: role === 'hr' ? 'Aprnna' : 'Demo', email });
      }
    } catch (err) {
      console.error(err);
      onLogin(role, { id: role === 'hr' ? '6a967947-ce10-4889-a8c0-117be0c295f3' : '61163ffc-4c7c-4847-9237-9b7e79b031f6', first_name: role === 'hr' ? 'Aprnna' : 'Demo', email });
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO[role].email);
    setPassword(DEMO[role].password);
    setError('');
  };

  return (
    <div className="login-shell">
      {/* Background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-mark">HR</div>
          <div>
            <h1 className="login-app-name">HRPortal</h1>
            <p className="login-app-sub">by Aprnna</p>
          </div>
        </div>

        {!role ? (
          /* Role selection */
          <>
            <div className="login-heading">
              <h2>Welcome back 👋</h2>
              <p>Select your role to continue</p>
            </div>
            <div className="role-cards">
              <button className="role-card" onClick={() => setRole('employee')}>
                <div className="role-icon role-emp">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="role-text">
                  <span className="role-title">Employee</span>
                  <span className="role-desc">Mark attendance & manage resume</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="role-arrow">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              <button className="role-card" onClick={() => setRole('hr')}>
                <div className="role-icon role-hr">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                    <line x1="12" y1="12" x2="12" y2="16"/>
                    <line x1="10" y1="14" x2="14" y2="14"/>
                  </svg>
                </div>
                <div className="role-text">
                  <span className="role-title">HR Manager</span>
                  <span className="role-desc">Review attendance & resumes</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="role-arrow">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </>
        ) : (
          /* Login form */
          <>
            <button className="back-btn" onClick={() => { setRole(null); setEmail(''); setPassword(''); setError(''); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>

            <div className="login-heading">
              <h2>{role === 'hr' ? '👩‍💼 HR Manager Login' : '👤 Employee Login'}</h2>
              <p>Enter your credentials to access the portal</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Email Address</label>
                <input
                  className="input"
                  type="email"
                  placeholder={DEMO[role].email}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : null}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="demo-hint">
              <span>Demo credentials →</span>
              <button className="demo-fill-btn" onClick={fillDemo}>Auto-fill</button>
              <code>{DEMO[role].email} / {DEMO[role].password}</code>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
