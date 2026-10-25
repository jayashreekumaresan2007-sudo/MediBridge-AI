import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import './App.css';
import './TruthGraph.css';
import { supabase } from './lib/supabase';
import Login from './Login';

type Patient = {
  id: number;
  name: string;
  age: number;
  condition: string;
  status: 'Active' | 'Monitoring' | 'Recovered';
  risk: 'Low' | 'Medium' | 'High';
  lastVisit: string;
};

type ReviewStatus = 'Needs review' | 'Verified' | 'Dismissed';

type Issue = {
  id: number;
  title: string;
  summary: string;
  sources: string[];
  explanation: string;
  severity: 'High' | 'Medium';
  status: ReviewStatus;
};

const initialPatients: Patient[] = [
  { id: 1, name: 'Olivia Bennett', age: 42, condition: 'Type 2 Diabetes', status: 'Active', risk: 'Medium', lastVisit: 'Oct 22, 2026' },
  { id: 2, name: 'Ethan Carter', age: 58, condition: 'Hypertension', status: 'Monitoring', risk: 'High', lastVisit: 'Oct 21, 2026' },
  { id: 3, name: 'Sophia Mitchell', age: 35, condition: 'Asthma', status: 'Active', risk: 'Low', lastVisit: 'Oct 20, 2026' },
  { id: 4, name: 'Noah Williams', age: 67, condition: 'Cardiac follow-up', status: 'Active', risk: 'High', lastVisit: 'Oct 19, 2026' },
  { id: 5, name: 'Ava Thompson', age: 29, condition: 'Migraine', status: 'Recovered', risk: 'Low', lastVisit: 'Oct 17, 2026' },
];

const navigation = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Patients', icon: '♙' },
  { label: 'Appointments', icon: '▣' },
  { label: 'Documents', icon: '▤' },
  { label: 'AI Insights', icon: '✳' },
  { label: 'TruthGraph', icon: '◎' },
];

const initialIssues: Issue[] = [
  {
    id: 1,
    title: 'Date mismatch',
    summary: 'Two demo records show different dates for the same recorded event.',
    sources: ['Discharge summary · Oct 18, 2026', 'Follow-up note · Oct 20, 2026'],
    explanation: 'The sample documents contain different dates. The demo data cannot establish which date is correct; a reviewer should check the original record.',
    severity: 'High',
    status: 'Needs review',
  },
  {
    id: 2,
    title: 'Unconfirmed detail',
    summary: 'A note references a result that is not present in the attached demo record set.',
    sources: ['Follow-up note · Oct 20, 2026'],
    explanation: 'The referenced result was not found in this sample. That does not prove the result is missing from a complete patient record.',
    severity: 'Medium',
    status: 'Needs review',
  },
];

function Dashboard() {
  useEffect(() => {
    let cancelled = false;

    async function testSupabaseConnection() {
      const { error } = await supabase
        .from('patients')
        .select('id')
        .limit(1);

      if (cancelled) return;

      if (!error) {
        console.info(
          'Supabase connection successful; patients query allowed.'
        );
      } else if (
        error.code === '42501' ||
        /permission|row-level security|policy/i.test(error.message)
      ) {
        console.info(
          'Supabase is reachable, but the patients table is protected by RLS. Configure secure access policies before enabling patient operations.'
        );
      } else {
        console.error(
          'Supabase connection test failed:',
          error.message
        );
      }
    }

    testSupabaseConnection();

    return () => {
      cancelled = true;
    };
  }, []);

  const [page, setPage] = useState('Dashboard');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [condition, setCondition] = useState('');
  const [toast, setToast] = useState('');

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  }

  // Load records allowed by the signed-in user's RLS policies.
  useEffect(() => {
    let cancelled = false;
    async function loadPatients() {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, age, condition, status, risk, last_visit')
        .order('id', { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error('Failed to load patients:', error);
        notify(`Could not load patients: ${error.message}`);
        return;
      }
      setPatients((data ?? []).map((patient) => ({
        id: Number(patient.id),
        name: patient.name,
        age: Number(patient.age),
        condition: patient.condition,
        status: patient.status as Patient['status'],
        risk: patient.risk as Patient['risk'],
        lastVisit: patient.last_visit ?? '—',
      })));
    }
    void loadPatients();
    return () => { cancelled = true; };
  }, []);

  async function addPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanCondition = condition.trim();
    const numericAge = Number(age);

    if (!cleanName || !cleanCondition || !age || !Number.isFinite(numericAge) || numericAge < 0 || numericAge > 120) {
      notify('Please enter valid patient details.');
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Unable to get authenticated user:', authError);
      notify('Session expired. Please log in again.');
      return;
    }

    console.log('AUTH USER ID:', user.id);

    const { data, error } = await supabase
      .from('patients')
      .insert({
        user_id: user.id,
        name: cleanName,
        age: numericAge,
        condition: cleanCondition,
        status: 'Active',
        risk: 'Low',
        last_visit: new Date().toISOString().slice(0, 10),
      })
      .select('id, name, age, condition, status, risk, last_visit')
      .single();

    if (error) {
      console.error('PATIENT INSERT ERROR:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId: user.id,
      });
      notify(`Could not save patient: ${error.message}`);
      return;
    }

    const newPatient: Patient = {
      id: Number(data.id), name: data.name, age: Number(data.age),
      condition: data.condition,
      status: data.status as Patient['status'],
      risk: data.risk as Patient['risk'], lastVisit: data.last_visit ?? '—',
    };
    setPatients((current) => [newPatient, ...current]);
    setName(''); setAge(''); setCondition(''); setShowForm(false);
    notify('Patient saved successfully!');
  }

  async function deletePatient(id: number) {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete patient:', error);
      notify(`Could not delete patient: ${error.message}`);
      return;
    }
    setPatients((current) => current.filter((patient) => patient.id !== id));
    notify('Patient deleted successfully.');
  }

  const activeCount = patients.filter(
    (p) => p.status === 'Active'
  ).length;

  const highRiskCount = patients.filter(
    (p) => p.risk === 'High'
  ).length;

  const visiblePatients = patients.filter((p) =>
    `${p.name} ${p.condition} ${p.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => setPage('Dashboard')}
          aria-label="MediBridge AI home"
        >
          <span className="brand-mark">✚</span>
          <span className="brand-copy">
            <strong>
              MediBridge <em>AI</em>
            </strong>
            <small>CARE INTELLIGENCE</small>
          </span>
        </button>

        <p className="nav-caption">WORKSPACE</p>

        <nav className="nav-list">
          {navigation.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${
                page === item.label ? 'active' : ''
              }`}
              onClick={() => setPage(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === 'AI Insights' && (
                <span className="new-pill">NEW</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-promo">
          <span className="promo-icon">✳</span>
          <strong>Your care, connected.</strong>
          <p>One clear view of every patient's journey.</p>
        </div>

        <div className="user-profile">
          <span className="user-avatar">ML</span>
          <span>
            <strong>Dr. Morgan Lee</strong>
            <small>Care administrator</small>
          </span>
          <span className="profile-dots">···</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <b>/</b>
            <strong>{page}</strong>
          </div>

          <div className="topbar-right">
            <span className="environment">
              <i /> Demo environment
            </span>
            <button
              className="icon-button"
              onClick={() => notify('You are all caught up.')}
              aria-label="Notifications"
            >
              ♧
            </button>
            <span className="user-avatar top-avatar">ML</span>
          </div>
        </header>

        <div className="page-content">
          {page === 'Dashboard' && (
            <>
              <section className="dashboard-hero">
                <div className="hero-copy">
                  <div className="eyebrow">
                    <i /> MEDIBRIDGE / OVERVIEW
                  </div>
                  <h1>
                    Good morning, Dr. Lee{' '}
                    <span className="sparkle">✳</span>
                  </h1>
                  <p className="hero-subtitle">
                    A clearer picture of care, all in one place.
                  </p>
                  <div className="hero-actions">
                    <button
                      className="primary-button"
                      onClick={() => {
                        setPage('Patients');
                        setShowForm(true);
                      }}
                    >
                      ＋ Add new patient
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => setPage('TruthGraph')}
                    >
                      Explore TruthGraph ↗
                    </button>
                  </div>
                  <div className="hero-trust">
                    <span>✓</span> Connected care workspace <b>·</b>{' '}
                    Human-reviewed insights
                  </div>
                </div>

                <div className="hero-image-wrap">
                  <img
                    src="/doctor.hero.jpg"
                    alt="Doctor in a modern clinical office"
                    className="hero-doctor"
                  />
                  <div className="hero-image-caption">
                    <span className="caption-check">✓</span>
                    <span>
                      <strong>Care that connects</strong>
                      <small>People · Records · Evidence</small>
                    </span>
                  </div>
                  <span className="hero-orb orb-one" />
                  <span className="hero-orb orb-two" />
                </div>
              </section>

              <section className="section-heading">
                <div>
                  <span className="eyebrow">NETWORK OVERVIEW</span>
                  <h2>Your care network</h2>
                </div>
                <span className="updated-label">
                  <i /> Demo data · Updated just now
                </span>
              </section>

              <section className="metric-grid">
                <Metric
                  title="Total patients"
                  value={String(patients.length)}
                  note="Sample records"
                  icon="♙"
                  tone="teal"
                />
                <Metric
                  title="Active patients"
                  value={String(activeCount)}
                  note="Across your network"
                  icon="♡"
                  tone="blue"
                />
                <Metric
                  title="Appointments today"
                  value="08"
                  note="Demo schedule"
                  icon="▦"
                  tone="violet"
                />
                <Metric
                  title="High-risk patients"
                  value={String(highRiskCount)}
                  note="Requires review"
                  icon="⌁"
                  tone="amber"
                />
              </section>

              <section className="dashboard-columns">
                <div className="panel">
                  <PanelHeading
                    title="Recent patients"
                    subtitle="Your latest patient activity"
                    action="View all patients ↗"
                    onAction={() => setPage('Patients')}
                  />
                  <PatientTable
                    patients={patients.slice(0, 4)}
                    onDelete={deletePatient}
                    compact
                  />
                </div>

                <div className="panel">
                  <PanelHeading
                    title="Today's schedule"
                    subtitle="A quick look at upcoming visits"
                    action="Full schedule ↗"
                    onAction={() => setPage('Appointments')}
                  />
                  <ScheduleList />
                </div>
              </section>

              <section className="insight-banner">
                <div className="insight-mark">✳</div>
                <div>
                  <span className="eyebrow">
                    MEDIBRIDGE INTELLIGENCE
                  </span>
                  <h2>Make evidence easier to follow.</h2>
                  <p>
                    Explore source-linked demo records and keep review
                    decisions transparent.
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => setPage('TruthGraph')}
                >
                  Open TruthGraph ↗
                </button>
              </section>
            </>
          )}

          {page === 'Patients' && (
            <>
              <PageHeading
                eyebrow="CARE NETWORK / DIRECTORY"
                title="Patient directory"
                subtitle="Manage sample patient profiles and review their current status."
                action={
                  <button
                    className="primary-button"
                    onClick={() => setShowForm(true)}
                  >
                    ＋ Add new patient
                  </button>
                }
              />

              <div className="panel directory-panel">
                <div className="directory-toolbar">
                  <div>
                    <h2>
                      All patients{' '}
                      <span className="count-pill">
                        {patients.length}
                      </span>
                    </h2>
                    <p>Synthetic demo records only</p>
                  </div>
                  <input
                    className="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="⌕  Search patients..."
                  />
                </div>
                <PatientTable
                  patients={visiblePatients}
                  onDelete={deletePatient}
                />
              </div>
            </>
          )}

          {page === 'Appointments' && (
            <>
              <PageHeading
                eyebrow="CARE NETWORK / SCHEDULING"
                title="Appointments"
                subtitle="A simple view of the sample schedule."
              />
              <div className="panel schedule-page">
                <PanelHeading
                  title="Today's schedule"
                  subtitle="Illustrative demo appointments"
                />
                <ScheduleList />
              </div>
              <div className="notice-banner">
                These appointments are sample entries and are not connected
                to a live scheduling system.
              </div>
            </>
          )}

          {page === 'Documents' && (
            <>
              <PageHeading
                eyebrow="CARE NETWORK / DOCUMENTS"
                title="Medical documents"
                subtitle="A demo space for organizing clinical documentation."
              />
              <div className="document-grid">
                <DocumentCard
                  icon="▤"
                  title="Clinical notes"
                  detail="12 sample documents"
                />
                <DocumentCard
                  icon="▧"
                  title="Lab reports"
                  detail="08 sample documents"
                />
                <DocumentCard
                  icon="▥"
                  title="Care plans"
                  detail="05 sample documents"
                />
              </div>
              <div className="notice-banner">
                Demo collection only — no real medical files are uploaded
                or stored.
              </div>
            </>
          )}

          {page === 'AI Insights' && (
            <>
              <PageHeading
                eyebrow="MEDIBRIDGE INTELLIGENCE"
                title="AI care insights"
                subtitle="A transparent preview of a future clinical intelligence workspace."
              />
              <section className="ai-hero panel">
                <div className="ai-orb">✳</div>
                <span className="eyebrow">DEMO INSIGHT</span>
                <h2>Your care network at a glance</h2>
                <p>
                  There are <strong>{patients.length} sample patient records</strong>,
                  including <strong>{highRiskCount} marked high risk</strong>.
                  This summary is generated from local demo data only.
                </p>
                <div className="ai-stat-row">
                  <span>
                    <b>{patients.length}</b>
                    <small>Patient records</small>
                  </span>
                  <span>
                    <b>{highRiskCount}</b>
                    <small>High-risk labels</small>
                  </span>
                  <span>
                    <b>Human review</b>
                    <small>Always in control</small>
                  </span>
                </div>
                <div className="notice-banner">
                  No AI model is connected. This page does not provide
                  diagnosis or treatment advice.
                </div>
              </section>
            </>
          )}

          {page === 'TruthGraph' && <TruthGraph />}
        </div>

        <footer className="app-footer">
          <span>© 2026 MediBridge AI</span>
          <span>
            <i /> Prototype · Synthetic data only
          </span>
        </footer>
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-modal-title"
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">CARE NETWORK</span>
                <h2 id="patient-modal-title">Add new patient</h2>
                <p>Create a synthetic demo record.</p>
              </div>
              <button
                className="close-button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={addPatient}>
              <label>
                Patient full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                />
              </label>

              <div className="form-row">
                <label>
                  Age
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age"
                    required
                  />
                </label>
                <label>
                  Primary condition
                  <input
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="e.g. Asthma"
                    required
                  />
                </label>
              </div>

              <div className="notice-banner">
                Do not enter real patient information.
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save patient
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Metric({
  title,
  value,
  note,
  icon,
  tone,
}: {
  title: string;
  value: string;
  note: string;
  icon: string;
  tone: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <span className={`metric-icon ${tone}`}>{icon}</span>
      </div>
      <strong className="metric-value">{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function PanelHeading({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action && (
        <button className="text-action" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <section className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </section>
  );
}

function PatientTable({
  patients,
  onDelete,
  compact = false,
}: {
  patients: Patient[];
  onDelete: (id: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={`table-wrap ${compact ? 'compact-table' : ''}`}>
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Age</th>
            <th>Condition</th>
            <th>Status</th>
            <th>Risk</th>
            <th>Last visit</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="patient-cell">
                  <span className="patient-avatar">
                    {p.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>MB-{String(p.id).slice(-4)}</small>
                  </span>
                </div>
              </td>
              <td>{p.age}</td>
              <td>{p.condition}</td>
              <td>
                <span className={`status-pill ${p.status.toLowerCase()}`}>
                  {p.status}
                </span>
              </td>
              <td>
                <span className={`risk-label ${p.risk.toLowerCase()}`}>
                  <i />
                  {p.risk}
                </span>
              </td>
              <td className="date-cell">{p.lastVisit}</td>
              <td>
                <button
                  className="row-delete"
                  title="Delete demo record"
                  onClick={() => onDelete(p.id)}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {patients.length === 0 && (
        <div className="empty-state">No matching patient records.</div>
      )}
    </div>
  );
}

function ScheduleList() {
  const appointments = [
    ['09:00 AM', 'Olivia Bennett', 'Routine follow-up', 'teal'],
    ['10:30 AM', 'Ethan Carter', 'Blood pressure review', 'violet'],
    ['11:15 AM', 'Sophia Mitchell', 'Consultation', 'blue'],
    ['01:00 PM', 'Noah Williams', 'Cardiac follow-up', 'amber'],
  ];

  return (
    <div className="schedule-list">
      {appointments.map(([time, name, detail, tone]) => (
        <div className="schedule-item" key={time}>
          <span className="schedule-time">{time}</span>
          <i className={`schedule-line ${tone}`} />
          <span className="schedule-copy">
            <strong>{name}</strong>
            <small>{detail}</small>
          </span>
          <span className="schedule-arrow">↗</span>
        </div>
      ))}
    </div>
  );
}

function DocumentCard({
  icon,
  title,
  detail,
}: {
  icon: string;
  title: string;
  detail: string;
}) {
  return (
    <article className="document-card panel">
      <span className="document-icon">{icon}</span>
      <h2>{title}</h2>
      <p>{detail}</p>
      <span className="document-status">Demo collection</span>
      <span className="document-arrow">↗</span>
    </article>
  );
}

function TruthGraph() {
  const [issues, setIssues] = useState(initialIssues);
  const [selectedId, setSelectedId] = useState(1);
  const [filter, setFilter] = useState<'All' | ReviewStatus>('All');
  const [history, setHistory] = useState<string[]>([
    'TruthGraph demo initialized · Oct 25, 2026',
  ]);

  const selected =
    issues.find((issue) => issue.id === selectedId) ?? issues[0];

  const filtered = issues.filter(
    (issue) => filter === 'All' || issue.status === filter
  );

  const needsReview = issues.filter(
    (issue) => issue.status === 'Needs review'
  ).length;

  const verified = issues.filter(
    (issue) => issue.status === 'Verified'
  ).length;

  function updateStatus(status: ReviewStatus) {
    if (!selected) return;

    setIssues((current) =>
      current.map((issue) =>
        issue.id === selected.id ? { ...issue, status } : issue
      )
    );

    setHistory((current) => [
      `${selected.title} marked “${status}” · ${new Date().toLocaleTimeString()}`,
      ...current,
    ]);
  }

  return (
    <div className="tg-page">
      <section className="page-heading tg-page-heading">
        <div>
          <span className="eyebrow">
            MEDIBRIDGE INTELLIGENCE / EVIDENCE ENGINE
          </span>
          <h1>
            TruthGraph <span>Intelligence</span>
          </h1>
          <p>
            Trace a claim to its source. Spot inconsistencies. Keep human
            verification in control.
          </p>
        </div>
        <span className="tg-heading-mark">✳</span>
      </section>

      <div className="tg-demo-banner">
        <span>ⓘ</span>
        <div>
          <strong>Interactive demo · synthetic records only</strong>
          <small>
            Illustrative examples, not real patient data or clinical findings.
          </small>
        </div>
      </div>

      <section className="tg-stat-grid">
        <article className="tg-stat">
          <span>Evidence issues</span>
          <strong>{String(issues.length).padStart(2, '0')}</strong>
          <small>In this sample set</small>
        </article>
        <article className="tg-stat">
          <span>Need review</span>
          <strong>{String(needsReview).padStart(2, '0')}</strong>
          <small>Awaiting human review</small>
        </article>
        <article className="tg-stat">
          <span>Verified</span>
          <strong>{String(verified).padStart(2, '0')}</strong>
          <small>Reviewer-marked only</small>
        </article>
      </section>

      <section className="tg-layout">
        <article className="panel tg-graph-panel">
          <PanelHeading
            title="Evidence graph"
            subtitle="Select any node to inspect its linked evidence."
          />
          <div className="tg-graph-canvas">
            <svg
              className="tg-edges"
              viewBox="0 0 600 340"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M300 170 L125 65" />
              <path d="M300 170 L475 65" />
              <path d="M300 170 L125 270" />
              <path d="M300 170 L475 270" />
              <path d="M125 65 L475 65" className="dashed" />
            </svg>

            <button
              className={`tg-node tg-node-a ${
                selectedId === 1 ? 'selected' : ''
              }`}
              onClick={() => setSelectedId(1)}
            >
              <span>DOC 01 · SOURCE</span>
              <strong>Discharge summary</strong>
              <small>Oct 18, 2026</small>
            </button>

            <button
              className={`tg-node tg-node-b ${
                selectedId === 1 ? 'selected' : ''
              }`}
              onClick={() => setSelectedId(1)}
            >
              <span>DOC 02 · SOURCE</span>
              <strong>Follow-up note</strong>
              <small>Oct 20, 2026</small>
            </button>

            <button
              className={`tg-node tg-node-center ${
                selectedId === 1 ? 'selected' : ''
              }`}
              onClick={() => setSelectedId(1)}
            >
              <span>CLAIM</span>
              <strong>Event date</strong>
              <small>2 source references</small>
            </button>

            <button
              className={`tg-node tg-node-c ${
                selectedId === 2 ? 'selected' : ''
              }`}
              onClick={() => setSelectedId(2)}
            >
              <span>REVIEW ISSUE</span>
              <strong>Result reference</strong>
              <small>Not found in sample</small>
            </button>

            <button
              className={`tg-node tg-node-d ${
                selectedId === 2 ? 'selected' : ''
              }`}
              onClick={() => setSelectedId(2)}
            >
              <span>DOC 02 · SOURCE</span>
              <strong>Follow-up note</strong>
              <small>Source text</small>
            </button>

            <div className="tg-legend">
              <span><i className="legend-claim" /> Claim</span>
              <span><i className="legend-source" /> Source</span>
              <span><i className="legend-issue" /> Review issue</span>
            </div>
          </div>

          <div className="tg-graph-footer">
            <span><i /> Source-linked sample</span>
            <span>5 nodes · 4 links</span>
          </div>
        </article>

        <article className="panel tg-inspector">
          <div className="tg-inspector-top">
            <div>
              <span className="eyebrow">EVIDENCE INSPECTOR</span>
              <h2>Review details</h2>
            </div>
            <span className={`severity ${selected.severity.toLowerCase()}`}>
              {selected.severity} priority
            </span>
          </div>

          <div className="tg-issue-intro">
            <span className="tg-alert-icon">!</span>
            <div>
              <h3>{selected.title}</h3>
              <p>{selected.summary}</p>
            </div>
          </div>

          <div className="tg-inspector-section">
            <span className="eyebrow">LINKED SOURCES</span>
            {selected.sources.map((source, index) => (
              <div className="tg-source-row" key={source}>
                <span className="source-number">
                  0{index + 1}
                </span>
                <span>
                  <strong>{source}</strong>
                  <small>Click-to-inspect source reference · demo</small>
                </span>
                <b>↗</b>
              </div>
            ))}
          </div>

          <div className="tg-explanation">
            <strong>Why this was flagged</strong>
            <p>{selected.explanation}</p>
          </div>

          <div className="tg-status-line">
            <span>Review status</span>
            <strong
              className={`status-text ${
                selected.status.toLowerCase().replace(' ', '-')
              }`}
            >
              {selected.status}
            </strong>
          </div>

          <div className="tg-review-actions">
            <button
              className="verify-button"
              onClick={() => updateStatus('Verified')}
            >
              ✓ Mark verified
            </button>
            <button
              className="review-button"
              onClick={() => updateStatus('Needs review')}
            >
              ↻ Needs review
            </button>
            <button
              className="dismiss-button"
              onClick={() => updateStatus('Dismissed')}
            >
              Dismiss
            </button>
          </div>

          <small className="tg-human-note">
            A status change records a demo review action; it does not
            validate medical truth.
          </small>
        </article>
      </section>

      <section className="panel tg-queue">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">REVIEW QUEUE</span>
            <h2>Evidence issues</h2>
            <p>Choose an issue to inspect its linked sources.</p>
          </div>

          <select
            className="tg-filter"
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as 'All' | ReviewStatus)
            }
          >
            <option>All</option>
            <option>Needs review</option>
            <option>Verified</option>
            <option>Dismissed</option>
          </select>
        </div>

        <div className="tg-issue-list">
          {filtered.map((issue) => (
            <button
              className={`tg-issue-row ${
                selectedId === issue.id ? 'active' : ''
              }`}
              key={issue.id}
              onClick={() => setSelectedId(issue.id)}
            >
              <i className={`issue-dot ${issue.severity.toLowerCase()}`} />
              <span className="tg-issue-copy">
                <strong>{issue.title}</strong>
                <small>{issue.summary}</small>
              </span>
              <span
                className={`queue-status ${
                  issue.status.toLowerCase().replace(' ', '-')
                }`}
              >
                {issue.status}
              </span>
              <span className="tg-arrow">→</span>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="empty-state">No issues in this status.</div>
          )}
        </div>
      </section>

      <section className="panel tg-audit">
        <PanelHeading
          title="Change replay"
          subtitle="Recent actions in this browser session."
        />
        <div className="audit-list">
          {history.map((entry, index) => (
            <div className="audit-entry" key={`${entry}-${index}`}>
              <i />
              {entry}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error('Unable to load session:', error.message);
      }

      setSession(data.session);
      setLoading(false);
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout failed:', error.message);
    }
  }

  if (loading) {
    return (
      <div className="login-screen">
        Loading MediBridge AI...
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <>
      <Dashboard />

      <button
        type="button"
        onClick={handleLogout}
        style={{
          position: 'fixed',
          top: '18px',
          right: '24px',
          zIndex: 9999,
          padding: '10px 16px',
          border: '1px solid #dce6e9',
          borderRadius: '10px',
          background: '#ffffff',
          color: '#17313d',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Sign out ↗
      </button>
    </>
  );
}

export default App;
