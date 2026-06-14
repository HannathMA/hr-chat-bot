import { useState } from 'react';
import './SkillsForm.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CATEGORIES = ['Frontend', 'Backend', 'DevOps', 'Data', 'Design', 'Management', 'Other'];
const PROFICIENCIES = [
  { value: 'beginner',     label: 'Beginner',     pct: 25  },
  { value: 'intermediate', label: 'Intermediate', pct: 50  },
  { value: 'advanced',     label: 'Advanced',     pct: 75  },
  { value: 'expert',       label: 'Expert',       pct: 100 },
];

const SEED_SKILLS = [
  { id: 1, name: 'React',      category: 'Frontend', proficiency: 'advanced',     years: 3.5, certified: true  },
  { id: 2, name: 'Python',     category: 'Backend',  proficiency: 'expert',       years: 5,   certified: false },
  { id: 3, name: 'PostgreSQL', category: 'Backend',  proficiency: 'intermediate', years: 2,   certified: false },
  { id: 4, name: 'Docker',     category: 'DevOps',   proficiency: 'intermediate', years: 1.5, certified: true  },
];

const profColor = { beginner: 'rose', intermediate: 'amber', advanced: 'cyan', expert: 'green' };

export default function SkillsForm() {
  const [skills, setSkills]         = useState(SEED_SKILLS);
  const [form, setForm]             = useState({ name: '', category: 'Frontend', proficiency: 'intermediate', years: '', certified: false });
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [filter, setFilter]         = useState('All');
  const [activeTab, setActiveTab]   = useState('skills'); // 'skills' | 'add'

  const filtered = filter === 'All' ? skills : skills.filter(s => s.category === filter);
  const allCats  = ['All', ...new Set(skills.map(s => s.category))];

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } catch { /* demo mode */ }
    const newSkill = { ...form, id: Date.now(), years: parseFloat(form.years) || 0 };
    setSkills(prev => [...prev, newSkill]);
    setForm({ name: '', category: 'Frontend', proficiency: 'intermediate', years: '', certified: false });
    setSaving(false);
    setSaved(true);
    setActiveTab('skills');
    setTimeout(() => setSaved(false), 3000);
  };

  const removeSkill = (id) => setSkills(prev => prev.filter(s => s.id !== id));

  return (
    <div className="card skills-card">
      <div className="card-header">
        <div className="card-icon icon-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div>
          <h2 className="card-title">Skills</h2>
          <p className="card-subtitle">{skills.length} skills on record</p>
        </div>
        {saved && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>✓ Saved</span>}
      </div>

      {/* Tabs */}
      <div className="skills-tabs">
        <button className={`skill-tab ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>My Skills</button>
        <button className={`skill-tab ${activeTab === 'add'    ? 'active' : ''}`} onClick={() => setActiveTab('add')}>+ Add Skill</button>
      </div>

      {activeTab === 'skills' ? (
        <>
          {/* Category filter */}
          <div className="category-filter">
            {allCats.map(c => (
              <button key={c} className={`filter-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
            ))}
          </div>
          <div className="skills-list">
            {filtered.map(sk => {
              const prof = PROFICIENCIES.find(p => p.value === sk.proficiency);
              return (
                <div key={sk.id} className="skill-item">
                  <div className="skill-info">
                    <div className="skill-name-row">
                      <span className="skill-name">{sk.name}</span>
                      {sk.certified && <span className="cert-badge">★ Certified</span>}
                      <span className={`badge badge-${profColor[sk.proficiency]}`} style={{ marginLeft: 4, fontSize: '0.68rem' }}>{prof?.label}</span>
                    </div>
                    <div className="skill-meta">{sk.category} · {sk.years}y experience</div>
                    <div className="skill-bar-bg">
                      <div className="skill-bar-fill" style={{ width: `${prof?.pct}%`, background: `var(--${profColor[sk.proficiency]})` }} />
                    </div>
                  </div>
                  <button className="remove-btn" onClick={() => removeSkill(sk.id)} title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="add-skill-form">
          <div className="form-row">
            <div className="form-group">
              <label className="label">Skill Name</label>
              <input className="input" placeholder="e.g. TypeScript" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Years Exp.</label>
              <input className="input" type="number" min="0" max="30" step="0.5" placeholder="2.5"
                value={form.years} onChange={e => setForm(f => ({ ...f, years: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Category</label>
              <select className="input select" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Proficiency</label>
              <select className="input select" value={form.proficiency}
                onChange={e => setForm(f => ({ ...f, proficiency: e.target.value }))}>
                {PROFICIENCIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <label className="cert-checkbox">
            <input type="checkbox" checked={form.certified}
              onChange={e => setForm(f => ({ ...f, certified: e.target.checked }))} />
            <span>I hold a certification for this skill</span>
          </label>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleAdd} disabled={!form.name.trim() || saving}>
            {saving ? <span className="spinner" /> : '+ Add Skill'}
          </button>
        </div>
      )}
    </div>
  );
}
