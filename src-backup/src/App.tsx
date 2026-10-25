
import { useState } from 'react';
import './App.css';
import './TruthGraph.css';

type Patient = {
  id: number;
  name: string;
  initials: string;
  age: number;
  condition: string;
  status: 'Active' | 'Monitoring' | 'Recovered';
  risk: 'Low' | 'Medium' | 'High';
  lastVisit: string;
};

const initialPatients: Patient[] = [
  { id: 1, name: 'Olivia Bennett', initials: 'OB', age: 42, condition: 'Type 2 Diabetes', status: 'Active', risk: 'Medium', lastVisit: 'Oct 22, 2026' },
  { id: 2, name: 'Ethan Carter', initials: 'EC', age: 58, condition: 'Hypertension', status: 'Monitoring', risk: 'High', lastVisit: 'Oct 21, 2026' },
  { id: 3, name: 'Sophia Mitchell', initials: 'SM', age: 35, condition: 'Asthma', status: 'Active', risk: 'Low', lastVisit: 'Oct 20, 2026' },
  { id: 4, name: 'Noah Williams', initials: 'NW', age: 67, condition: 'Cardiac follow-up', status: 'Active', risk: 'High', lastVisit: 'Oct 19, 2026' },
  { id: 5, name: 'Ava Thompson', initials: 'AT', age: 29, condition: 'Migraine', status: 'Recovered', risk: 'Low', lastVisit: 'Oct 17, 2026' },
];

const navItems = [
  { label: 'Dashboard', icon: '◫' },
  { label: 'Patients', icon: '♙' },
  { label: 'Appointments', icon: '▦' },
  { label: 'Documents', icon: '▤' },
  { label: 'AI Insights', icon: '✳' },
  { label: 'TruthGraph', icon: '◎' },
];

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [patients, setPatients] = useState(initialPatients);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientCondition, setPatientCondition] = useState('');
  const [notice, setNotice] = useState('');

  const filteredPatients = patients.filter((patient) =>
    `${patient.name} ${patient.condition}`.toLowerCase().includes(search.toLowerCase())
  );

  function addPatient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patientName.trim() || !patientAge || !patientCondition.trim()) return;

    const name = patientName.trim();
    const newPatient: Patient = {
      id: Date.now(),
      name,
      initials: name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      age: Number(patientAge),
      condition: patientCondition.trim(),
      status: 'Active',
      risk: 'Low',
      lastVisit: 'Oct 24, 2026',
    };

    setPatients((current) => [newPatient, ...current]);
    setPatientName('');
    setPatientAge('');
    setPatientCondition('');
    setShowForm(false);
    setNotice('Patient added successfully.');
    window.setTimeout(() => setNotice(''), 3000);
  }

  function deletePatient(id: number) {
    setPatients((current) => current.filter((patient) => patient.id !== id));
  }

  const activeCount = patients.filter((patient) => patient.status === 'Active').length;
  const highRiskCount = patients.filter((patient) => patient.risk === 'High').length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✚</div>
          <div><strong>MediBridge<span> AI</span></strong><small>CARE INTELLIGENCE</small></div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="navigation">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activePage === item.label ? 'selected' : ''}`}
              onClick={() => setActivePage(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.label === 'AI Insights' && <span className="new-tag">NEW</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✳</div>
            <strong>Your care, connected.</strong>
            <p>One clear view of every patient's journey.</p>
          </div>
          <div className="profile">
            <div className="avatar doctor-avatar">DR</div>
            <div className="profile-copy"><strong>Dr. Morgan Lee</strong><small>Care administrator</small></div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">Workspace <span>/</span> <strong>{activePage}</strong></div>
          <div className="top-actions">
            <span className="secure-label"><span className="secure-dot" /> Demo environment</span>
            <button className="icon-button" aria-label="Notifications" onClick={() => setNotice('You are all caught up.')}>♧<i /></button>
            <div className="avatar doctor-avatar">ML</div>
          </div>
        </header>

        <div className="page-content">
          {activePage === 'Dashboard' && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-line" /> SATURDAY, OCTOBER 24, 2026</div>
                  <h1>Good morning, Dr. Lee <span className="wave">✳</span></h1>
                  <p className="subheading">Here's what's happening across your care network today.</p>
                </div>
                <button className="primary-button" onClick={() => { setActivePage('Patients'); setShowForm(true); }}>＋ Add new patient</button>
              </section>

              <section className="metrics-grid">
                <Metric title="Total patients" value={String(patients.length)} change="+12% this month" icon="♙" tone="mint" />
                <Metric title="Active patients" value={String(activeCount)} change="Across your network" icon="♡" tone="blue" />
                <Metric title="Appointments today" value="08" change="3 need confirmation" icon="▦" tone="purple" />
                <Metric title="High-risk patients" value={String(highRiskCount)} change="Requires attention" icon="⌁" tone="orange" />
              </section>

              <section className="dashboard-grid">
                <div className="panel patients-panel">
                  <div className="panel-heading">
                    <div><h2>Recent patients</h2><p>Your latest patient activity</p></div>
                    <button className="text-button" onClick={() => setActivePage('Patients')}>View all patients ↗</button>
                  </div>
                  <PatientTable patients={patients.slice(0, 4)} onDelete={deletePatient} />
                </div>
                <div className="panel schedule-panel">
                  <div className="panel-heading"><div><h2>Today's schedule</h2><p>Saturday, October 24</p></div><span className="calendar-icon">▦</span></div>
                  <div className="schedule-list">
                    <Schedule time="09:00 AM" name="Olivia Bennett" detail="Routine follow-up" color="teal" />
                    <Schedule time="10:30 AM" name="Ethan Carter" detail="Blood pressure review" color="violet" />
                    <Schedule time="11:15 AM" name="Sophia Mitchell" detail="Consultation" color="blue" />
                    <Schedule time="01:00 PM" name="Noah Williams" detail="Cardiac follow-up" color="orange" />
                  </div>
                  <button className="schedule-link" onClick={() => setActivePage('Appointments')}>View full schedule →</button>
                </div>
              </section>

              <section className="panel insights-panel">
                <div className="insight-symbol">✳</div>
                <div className="insight-copy"><span className="insight-label">MEDIBRIDGE INTELLIGENCE</span><h2>Your care network at a glance</h2><p>This demo dashboard uses sample data. Connect a verified backend before storing real patient records.</p></div>
                <button className="secondary-button" onClick={() => setActivePage('AI Insights')}>Explore insights ↗</button>
              </section>
            </>
          )}

          {activePage === 'Patients' && (
            <>
              <section className="welcome-row">
                <div><div className="eyebrow">CARE NETWORK / DIRECTORY</div><h1>Patient directory</h1><p className="subheading">Manage patient profiles and track care status.</p></div>
                <button className="primary-button" onClick={() => setShowForm(true)}>＋ Add new patient</button>
              </section>
              <div className="panel directory-panel">
                <div className="directory-toolbar"><div><h2>All patients <span className="count-pill">{patients.length}</span></h2><p>Sample patient records for demonstration</p></div><input className="search-input" placeholder="⌕  Search patients..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
                <PatientTable patients={filteredPatients} onDelete={deletePatient} />
              </div>
            </>
          )}

          {activePage === 'Appointments' && (
            <>
              <section className="welcome-row"><div><div className="eyebrow">CARE NETWORK / SCHEDULING</div><h1>Appointments</h1><p className="subheading">A sample overview of today's care schedule.</p></div></section>
              <div className="panel schedule-full"><div className="panel-heading"><div><h2>Saturday, October 24</h2><p>All times are illustrative demo appointments</p></div></div><div className="schedule-list"><Schedule time="09:00 AM" name="Olivia Bennett" detail="Routine follow-up" color="teal" /><Schedule time="10:30 AM" name="Ethan Carter" detail="Blood pressure review" color="violet" /><Schedule time="11:15 AM" name="Sophia Mitchell" detail="Consultation" color="blue" /><Schedule time="01:00 PM" name="Noah Williams" detail="Cardiac follow-up" color="orange" /></div></div>
            </>
          )}

          {activePage === 'Documents' && (
            <>
              <section className="welcome-row"><div><div className="eyebrow">CARE NETWORK / FILES</div><h1>Medical documents</h1><p className="subheading">A demo space for organizing care documentation.</p></div></section>
              <div className="document-grid"><DocumentCard icon="▤" title="Clinical notes" detail="12 sample documents" /><DocumentCard icon="▧" title="Lab reports" detail="08 sample documents" /><DocumentCard icon="▥" title="Care plans" detail="05 sample documents" /></div>
              <div className="notice-banner">Demo only — no real medical files are uploaded or stored.</div>
            </>
          )}

          {activePage === 'AI Insights' && (
            <>
              <section className="welcome-row"><div><div className="eyebrow">MEDIBRIDGE INTELLIGENCE</div><h1>AI care insights</h1><p className="subheading">A transparent prototype for future clinical summarization.</p></div></section>
              <div className="panel ai-panel"><div className="ai-orb">✳</div><span className="insight-label">DEMO INSIGHT</span><h2>Care coordination overview</h2><p>You currently have {patients.length} sample patient records, including {highRiskCount} marked high risk. Review these sample records with a qualified care professional before making any clinical decisions.</p><div className="notice-banner">AI summaries are not connected to a model and must not be used for diagnosis or treatment.</div></div>
            </>
          )}

          {activePage === 'TruthGraph' && <TruthGraph />}
        </div>

        <footer className="footer"><span>© 2026 MediBridge AI</span><span><span className="secure-dot" /> Prototype · Synthetic data only</span></footer>
      </main>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-heading"><div><span className="eyebrow">CARE NETWORK</span><h2 id="modal-title">Add new patient</h2><p>Enter a synthetic demo record below.</p></div><button className="close-button" onClick={() => setShowForm(false)} aria-label="Close">×</button></div>
            <form onSubmit={addPatient}>
              <label>Patient full name<input autoFocus value={patientName} onChange={(event) => setPatientName(event.target.value)} placeholder="e.g. Alex Morgan" required /></label>
              <div className="form-row"><label>Age<input type="number" min="0" max="120" value={patientAge} onChange={(event) => setPatientAge(event.target.value)} placeholder="Age" required /></label><label>Primary condition<input value={patientCondition} onChange={(event) => setPatientCondition(event.target.value)} placeholder="e.g. Asthma" required /></label></div>
              <div className="notice-banner">Synthetic demo data only. Do not enter real patient information.</div>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-button">Save patient</button></div>
            </form>
          </section>
        </div>
      )}
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

type ReviewStatus = 'Needs review' | 'Verified' | 'Dismissed';
type EvidenceIssue = { id: number; title: string; summary: string; severity: 'High' | 'Medium'; sources: string[]; explanation: string; status: ReviewStatus };

function TruthGraph() {
  const [issues, setIssues] = useState<EvidenceIssue[]>([
    { id: 1, title: 'Date mismatch', summary: 'Two demo records show different dates for the same recorded event.', severity: 'High', sources: ['Discharge summary · Oct 18, 2026', 'Follow-up note · Oct 20, 2026'], explanation: 'The documents contain different dates. The available demo data does not establish which date is correct; a reviewer must check the original record.', status: 'Needs review' },
    { id: 2, title: 'Unconfirmed detail', summary: 'A follow-up note references a result that is not present in the attached demo record set.', severity: 'Medium', sources: ['Follow-up note · Oct 20, 2026'], explanation: 'The referenced result was not found in this small demo set. This does not prove the result is missing from the full patient record.', status: 'Needs review' },
  ]);
  const [selectedId, setSelectedId] = useState(1);
  const [history, setHistory] = useState<string[]>(['TruthGraph demo initialized · Oct 24, 2026']);
  const [filter, setFilter] = useState<'All' | ReviewStatus>('All');
  const selected = issues.find((issue) => issue.id === selectedId) ?? issues[0];
  const openCount = issues.filter((issue) => issue.status === 'Needs review').length;
  const filtered = issues.filter((issue) => filter === 'All' || issue.status === filter);

  function updateStatus(status: ReviewStatus) {
    if (!selected) return;
    setIssues((current) => current.map((issue) => issue.id === selected.id ? { ...issue, status } : issue));
    setHistory((current) => [`${selected.title} marked “${status}” · ${new Date().toLocaleString()}`, ...current]);
  }

  return (
    <div className="tg-page">
      <section className="tg-hero">
        <div>
          <div className="tg-kicker"><span className="tg-pulse" /> MEDIBRIDGE INTELLIGENCE / EVIDENCE ENGINE</div>
          <h1>TruthGraph <span>Intelligence</span></h1>
          <p>Trace a claim to its source. Spot inconsistencies. Keep human verification in control.</p>
        </div>
        <div className="tg-hero-mark" aria-hidden="true"><span>✳</span><i /><i /><i /><i /></div>
      </section>

      <div className="tg-demo-banner"><span>ⓘ</span><div><strong>Interactive demo · synthetic records only</strong><small>These are illustrative examples, not real patient data or clinical findings.</small></div></div>

      <section className="tg-stats">
        <div className="tg-stat"><span>Evidence issues</span><strong>{issues.length.toString().padStart(2, '0')}</strong><small>In this sample set</small></div>
        <div className="tg-stat"><span>Need review</span><strong>{openCount.toString().padStart(2, '0')}</strong><small>Awaiting human review</small></div>
        <div className="tg-stat"><span>Verified</span><strong>{issues.filter((issue) => issue.status === 'Verified').length.toString().padStart(2, '0')}</strong><small>Reviewer-marked only</small></div>
      </section>

      <section className="tg-workspace">
        <div className="tg-panel tg-graph-panel">
          <div className="tg-panel-heading"><div><span className="tg-overline">SOURCE MAP</span><h2>Evidence graph</h2><p>Select a node to inspect its evidence.</p></div><span className="tg-live-label"><i /> DEMO GRAPH</span></div>
          <div className="tg-graph-canvas">
            <svg className="tg-edges" viewBox="0 0 600 320" preserveAspectRatio="none" aria-hidden="true">
              <path d="M300 150 L150 65 M300 150 L450 65 M300 150 L150 250 M300 150 L450 250" />
              <path d="M150 65 L450 65" className="tg-edge-dashed" />
            </svg>
            <button className={`tg-node tg-node-core ${selectedId === 1 ? 'active' : ''}`} onClick={() => setSelectedId(1)}><span>FACT</span><strong>Event date</strong><small>2 source claims</small></button>
            <button className={`tg-node tg-node-source tg-node-a ${selectedId === 1 ? 'active' : ''}`} onClick={() => setSelectedId(1)}><span>DOC 01</span><strong>Discharge summary</strong><small>Oct 18, 2026</small></button>
            <button className={`tg-node tg-node-source tg-node-b ${selectedId === 1 ? 'active' : ''}`} onClick={() => setSelectedId(1)}><span>DOC 02</span><strong>Follow-up note</strong><small>Oct 20, 2026</small></button>
            <button className={`tg-node tg-node-issue tg-node-c ${selectedId === 2 ? 'active' : ''}`} onClick={() => setSelectedId(2)}><span>CHECK</span><strong>Result reference</strong><small>Not located in demo set</small></button>
            <button className={`tg-node tg-node-source tg-node-d ${selectedId === 2 ? 'active' : ''}`} onClick={() => setSelectedId(2)}><span>DOC 02</span><strong>Follow-up note</strong><small>Source text</small></button>
            <div className="tg-graph-legend"><span><i className="tg-legend-fact" /> Fact</span><span><i className="tg-legend-source" /> Source</span><span><i className="tg-legend-issue" /> Review issue</span></div>
          </div>
          <div className="tg-graph-footer"><span><i /> Source-linked sample</span><span>5 nodes · 4 links</span></div>
        </div>

        <div className="tg-panel tg-detail-panel">
          <div className="tg-panel-heading"><div><span className="tg-overline">EVIDENCE INSPECTOR</span><h2>Review details</h2></div><span className={`tg-severity ${selected?.severity === 'High' ? 'high' : 'medium'}`}>{selected?.severity} priority</span></div>
          {selected && <>
            <div className="tg-issue-title"><span className="tg-warning-icon">!</span><div><h3>{selected.title}</h3><p>{selected.summary}</p></div></div>
            <div className="tg-evidence-block"><span className="tg-overline">LINKED SOURCES</span>{selected.sources.map((source, index) => <div className="tg-source-row" key={source}><span className="tg-source-number">0{index + 1}</span><div><strong>{source}</strong><small>Click-to-inspect source reference · demo</small></div><span>↗</span></div>)}</div>
            <div className="tg-explanation"><strong>Why this was flagged</strong><p>{selected.explanation}</p></div>
            <div className="tg-current-status"><span>Review status</span><strong className={`tg-status-${selected.status.toLowerCase().replace(' ', '-')}`}>{selected.status}</strong></div>
            <div className="tg-review-actions"><button onClick={() => updateStatus('Verified')} className="tg-btn tg-btn-verify">✓ Mark verified</button><button onClick={() => updateStatus('Needs review')} className="tg-btn tg-btn-review">↻ Needs review</button><button onClick={() => updateStatus('Dismissed')} className="tg-btn tg-btn-dismiss">Dismiss</button></div>
            <p className="tg-human-note">A status change records a demo review action; it does not validate medical truth.</p>
          </>}
        </div>
      </section>

      <section className="tg-panel tg-issues-panel">
        <div className="tg-panel-heading"><div><span className="tg-overline">REVIEW QUEUE</span><h2>Evidence issues</h2><p>Filter and open an issue to inspect its source links.</p></div><select className="tg-filter" value={filter} onChange={(event) => setFilter(event.target.value as 'All' | ReviewStatus)}><option>All</option><option>Needs review</option><option>Verified</option><option>Dismissed</option></select></div>
        <div className="tg-issue-list">{filtered.map((issue) => <button key={issue.id} className={`tg-issue-row ${selectedId === issue.id ? 'selected' : ''}`} onClick={() => setSelectedId(issue.id)}><span className={`tg-issue-dot ${issue.severity.toLowerCase()}`} /><span className="tg-issue-main"><strong>{issue.title}</strong><small>{issue.summary}</small></span><span className={`tg-mini-status ${issue.status.toLowerCase().replace(' ', '-')}`}>{issue.status}</span><span className="tg-row-chevron">→</span></button>)}{filtered.length === 0 && <div className="tg-empty">No issues in this status.</div>}</div>
      </section>

      <section className="tg-panel tg-history-panel"><div className="tg-panel-heading"><div><span className="tg-overline">AUDIT TRAIL</span><h2>Change replay</h2><p>Recent actions in this browser session.</p></div><span className="tg-history-count">{history.length} events</span></div><div className="tg-history-list">{history.map((entry, index) => <div className="tg-history-item" key={`${entry}-${index}`}><span className="tg-history-dot" /><span>{entry}</span></div>)}</div></section>
    </div>
  );
}

function Metric({ title, value, change, icon, tone }: { title: string; value: string; change: string; icon: string; tone: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{title}</span><span className={`metric-icon ${tone}`}>{icon}</span></div><div className="metric-value">{value}</div><div className="metric-change">{change}</div></div>;
}

function PatientTable({ patients, onDelete }: { patients: Patient[]; onDelete: (id: number) => void }) {
  return <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Age</th><th>Primary condition</th><th>Status</th><th>Risk</th><th>Last visit</th><th>Action</th></tr></thead><tbody>{patients.map((patient) => <tr key={patient.id}><td><div className="patient-cell"><div className="avatar patient-avatar">{patient.initials}</div><div><strong>{patient.name}</strong><small>MB-{String(patient.id).slice(-4)}</small></div></div></td><td>{patient.age}</td><td>{patient.condition}</td><td><span className={`status-pill ${patient.status.toLowerCase()}`}>{patient.status}</span></td><td><span className={`risk-label ${patient.risk.toLowerCase()}`}><span />{patient.risk}</span></td><td className="date-cell">{patient.lastVisit}</td><td><button className="row-action" title="Delete demo record" onClick={() => onDelete(patient.id)}>×</button></td></tr>)}</tbody></table>{patients.length === 0 && <div className="empty-state">No matching patients found.</div>}</div>;
}

function Schedule({ time, name, detail, color }: { time: string; name: string; detail: string; color: string }) {
  return <div className="schedule-item"><span className="schedule-time">{time}</span><span className={`schedule-line ${color}`} /><div className="schedule-person"><strong>{name}</strong><small>{detail}</small></div><span className="schedule-arrow">↗</span></div>;
}

function DocumentCard({ icon, title, detail }: { icon: string; title: string; detail: string }) {
  return <div className="panel document-card"><div className="document-icon">{icon}</div><h2>{title}</h2><p>{detail}</p><span className="document-status">Demo collection</span></div>;
}

export default App;
