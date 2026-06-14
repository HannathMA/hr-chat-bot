import './ProjectTimeline.css';

const PROJECTS = [
  {
    id: 1,
    code: 'PRJ-2026-001',
    name: 'HR Portal Development',
    client: 'Internal',
    status: 'active',
    role: 'Lead Developer',
    start: '2026-01-15',
    end: '2026-07-30',
    pct: 65,
    tech: ['React', 'FastAPI', 'PostgreSQL', 'Docker'],
    team: 8,
    budget: '₹12,00,000',
  },
  {
    id: 2,
    code: 'PRJ-2025-009',
    name: 'Analytics Dashboard v2',
    client: 'FinTech Corp',
    status: 'completed',
    role: 'Developer',
    start: '2025-06-01',
    end: '2025-12-31',
    pct: 100,
    tech: ['Vue.js', 'Python', 'Redis'],
    team: 5,
    budget: '₹8,50,000',
  },
  {
    id: 3,
    code: 'PRJ-2026-004',
    name: 'AI Recruitment Bot',
    client: 'TalentHub Inc',
    status: 'planning',
    role: 'Analyst',
    start: '2026-07-01',
    end: '2026-12-31',
    pct: 0,
    tech: ['LangChain', 'FastAPI', 'React'],
    team: 4,
    budget: '₹6,00,000',
  },
];

const statusMeta = {
  active:    { label: 'Active',    cls: 'badge-green' },
  completed: { label: 'Completed', cls: 'badge-cyan'  },
  planning:  { label: 'Planning',  cls: 'badge-amber' },
  on_hold:   { label: 'On Hold',   cls: 'badge-rose'  },
};

function dateLabel(d) {
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' });
}

export default function ProjectTimeline() {
  return (
    <div className="card project-card">
      <div className="card-header">
        <div className="card-icon icon-cyan">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
        </div>
        <div>
          <h2 className="card-title">Project Timeline</h2>
          <p className="card-subtitle">{PROJECTS.filter(p => p.status === 'active').length} active · {PROJECTS.length} total</p>
        </div>
      </div>

      <div className="projects-list">
        {PROJECTS.map((proj, i) => {
          const meta = statusMeta[proj.status] || statusMeta.on_hold;
          return (
            <div key={proj.id} className={`project-item ${i < PROJECTS.length - 1 ? 'has-line' : ''}`}>
              {/* Timeline dot */}
              <div className={`timeline-dot dot-${proj.status}`} />

              <div className="project-body">
                <div className="project-top">
                  <div>
                    <div className="project-name">{proj.name}</div>
                    <div className="project-meta">
                      <span className="project-code">{proj.code}</span>
                      <span className="sep">·</span>
                      <span>{proj.client}</span>
                      <span className="sep">·</span>
                      <span>{proj.role}</span>
                    </div>
                  </div>
                  <span className={`badge ${meta.cls}`}>{meta.label}</span>
                </div>

                {/* Progress bar */}
                <div className="progress-row">
                  <div className="progress-bg">
                    <div className={`progress-fill fill-${proj.status}`} style={{ width: `${proj.pct}%` }} />
                  </div>
                  <span className="progress-pct">{proj.pct}%</span>
                </div>

                {/* Dates & info */}
                <div className="project-footer">
                  <div className="project-dates">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {dateLabel(proj.start)} → {dateLabel(proj.end)}
                  </div>
                  <div className="project-chips">
                    {proj.tech.slice(0, 3).map(t => (
                      <span key={t} className="tech-chip">{t}</span>
                    ))}
                    {proj.tech.length > 3 && <span className="tech-chip">+{proj.tech.length - 3}</span>}
                  </div>
                  <div className="project-team">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    {proj.team}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
