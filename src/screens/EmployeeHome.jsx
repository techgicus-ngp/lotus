// import { useState } from 'react';
// import { useSession } from '../context/SessionContext';
// import { PageHeader } from '../components/Common';
// import MapsTab, { useAllowedMaps } from './MapsTab';
// import QuotationsTab, { useEmployeeQuotations } from './QuotationsTab';
// import SiteVisitTab from './SiteVisitTab';
// import { formatCurrency } from '../utils/format';
// import { IconCamera, IconDoc, IconMap } from '../icons';

// const TABS = [
//   ['maps', 'Layout Maps', IconMap],
//   ['quotations', 'Quotations', IconDoc],
//   ['visits', 'Site Visit', IconCamera],
// ];

// export default function EmployeeHome() {
//   const { user, signOut } = useSession();
//   const [tab, setTab] = useState('maps');
//   const mapsState = useAllowedMaps();
//   const qState = useEmployeeQuotations(user.uid);
//   const list = qState.list ?? [];
//   const total = list.reduce((s, q) => s + q.finalTotalAmount, 0);

//   return (
//     <div className="page">
//       <PageHeader eyebrow="ASSOCIATE PORTAL" title="My Workspace" subtitle={`Hello, ${user.name}`} onLogout={signOut}>
//         <div className="stat-pills">
//           <div className="stat-pill"><IconDoc size={16} /><b>{list.length}</b><span>Quotations</span></div>
//           <div className="stat-pill"><b>{formatCurrency(total)}</b><span>Total Value</span></div>
//           <div className="stat-pill"><IconMap size={16} /><b>{mapsState.maps.length}</b><span>Maps</span></div>
//         </div>
//         <nav className="tabs">
//           {TABS.map(([id, label, Icon]) => (
//             <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
//               <Icon size={18} />{label}
//             </button>
//           ))}
//         </nav>
//       </PageHeader>
//       {tab === 'maps' && <MapsTab {...mapsState} />}
//       {tab === 'quotations' && <QuotationsTab state={qState} />}
//       {tab === 'visits' && <SiteVisitTab user={user} maps={mapsState.maps} />}
//     </div>
//   );
// }





import { useMemo, useState } from 'react';
import { useSession } from '../context/SessionContext';
import MapsTab, { useAllowedMaps } from './MapsTab';
import QuotationsTab, { useEmployeeQuotations } from './QuotationsTab';
import SiteVisitTab from './SiteVisitTab';
import { formatCurrency } from '../utils/format';
import { IconCamera, IconDoc, IconMap } from '../icons';

const BANNER_SRC = '/banner.png';

const TABS = [
  ['maps', 'Layout Maps', IconMap],
  ['quotations', 'Quotations', IconDoc],
  ['visits', 'Site Visit', IconCamera],
];

export default function EmployeeHome() {
  const { user, signOut } = useSession();
  const [tab, setTab] = useState('maps');
  const [bannerError, setBannerError] = useState(false);

  const mapsState = useAllowedMaps();
  const qState = useEmployeeQuotations(user.uid);
  const list = qState.list ?? [];
  const total = list.reduce((s, q) => s + q.finalTotalAmount, 0);

  const initials = useMemo(() => {
    if (!user?.name) return 'LI';
    return user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [user?.name]);

  const tabCounts = {
    maps: mapsState.maps?.length ?? 0,
    quotations: list.length,
    visits: null,
  };

  return (
    <div className="page li-portal-page">
      {/* ================= UNIFIED FULL-BLEED BANNER & COMMAND HERO ================= */}
      <header className="li-hero-shell">
        {/* Top Floating Glass Bar */}
        <div className="li-topbar-overlay">
          <div className="li-brand-pill">
           
            <span className="li-brand-name">LOTUS INFRA</span>
            
            
          </div>

          <div className="li-user-actions">
            <div className="li-user-chip">
              <div className="li-user-avatar" aria-hidden="true">
                {initials}
              </div>
              <div className="li-user-meta">
                <span className="li-user-label">Associate</span>
                <strong className="li-user-name">{user.name}</strong>
              </div>
            </div>

            <button
              type="button"
              className="li-logout-btn"
              onClick={signOut}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="li-logout-text">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Full-Width Unobstructed Banner Showcase */}
        <div className="li-banner-stage">
          {!bannerError ? (
            <img
              src={BANNER_SRC}
              alt="Lotus Infra"
              className="li-banner-img"
              onError={() => setBannerError(true)}
            />
          ) : (
            <div className="li-banner-fallback">
              <div className="li-fallback-inner">
                <span className="li-fallback-eyebrow">ASSOCIATE PORTAL</span>
                <h2>LOTUS INFRA</h2>
              </div>
            </div>
          )}
          {/* Seamless cream/gold blend into the command deck */}
          <div className="li-banner-blend" />
        </div>

        {/* Connected Executive Command Deck */}
        <div className="li-command-deck">
          <div className="li-deck-inner">
            <div className="li-deck-top">
              {/* Welcome Identity Block */}
              <div className="li-welcome-block">
                <span className="li-eyebrow">ASSOCIATE PORTAL</span>
                <h1 className="li-welcome-title">Hello, {user.name}</h1>
                <p className="li-welcome-sub">
                  Access interactive layout maps, generate client quotations, and log site visits.
                </p>
              </div>

              {/* Connected KPI Stat Cards */}
              <div className="li-stats-grid">
                <div className="li-stat-card tone-gold">
                  <div className="li-stat-icon">
                    <IconDoc size={20} />
                  </div>
                  <div className="li-stat-body">
                    <span className="li-stat-label">Quotations</span>
                    <strong className="li-stat-value">{list.length}</strong>
                    <span className="li-stat-sub">Generated proposals</span>
                  </div>
                </div>

                <div className="li-stat-card tone-maroon">
                  <div className="li-stat-icon">
                    <span className="li-currency-glyph">₹</span>
                  </div>
                  <div className="li-stat-body">
                    <span className="li-stat-label">Total Value</span>
                    <strong
                      className="li-stat-value"
                      title={formatCurrency(total)}
                    >
                      {formatCurrency(total)}
                    </strong>
                    <span className="li-stat-sub">Pipeline volume</span>
                  </div>
                </div>

                <div className="li-stat-card tone-blue">
                  <div className="li-stat-icon">
                    <IconMap size={20} />
                  </div>
                  <div className="li-stat-body">
                    <span className="li-stat-label">Layout Maps</span>
                    <strong className="li-stat-value">
                      {mapsState.maps.length}
                    </strong>
                    <span className="li-stat-sub">Active site layouts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Segmented Navigation Bar */}
            <nav className="li-tabs-nav" aria-label="Workspace navigation">
              {TABS.map(([id, label, Icon]) => {
                const active = tab === id;
                const count = tabCounts[id];

                return (
                  <button
                    type="button"
                    key={id}
                    className={`li-tab-btn ${active ? 'active' : ''}`}
                    onClick={() => setTab(id)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                    {count !== null && count !== undefined && (
                      <span className="li-tab-badge">{count}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* ================= WORKSPACE CONTENT ================= */}
      <main className="li-workspace-main">
        {tab === 'maps' && <MapsTab {...mapsState} />}
        {tab === 'quotations' && <QuotationsTab state={qState} />}
        {tab === 'visits' && <SiteVisitTab user={user} maps={mapsState.maps} />}
      </main>
    </div>
  );
}