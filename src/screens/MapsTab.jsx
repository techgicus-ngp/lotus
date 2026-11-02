// import { useEffect, useMemo, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { loadAllowedMaps } from '../services/mapService';
// import { CenterSpinner, EmptyState, SearchBar } from '../components/Common';
// import { toDate, formatDate } from '../utils/format';
// import { IconMap, IconRefresh, IconOpenNew } from '../icons';

// export function useAllowedMaps() {
//   const [maps, setMaps] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const load = async () => {
//     setLoading(true);
//     try { setMaps(await loadAllowedMaps()); } catch (e) { console.error('Error loading maps:', e); }
//     setLoading(false);
//   };
//   useEffect(() => { load(); }, []);
//   return { maps, loading, reload: load };
// }

// function MapCard({ map, onOpen }) {
//   const plots = map.plots ?? [];
//   const count = (t) => plots.filter((p) => p.type === t).length;
//   const created = toDate(map.createdDate);
//   return (
//     <div className="card map-card" onClick={onOpen} role="button" tabIndex={0}>
//       <div className="map-card-head">
//         <div className="map-card-icon"><IconMap size={24} /></div>
//         <div className="grow">
//           <div className="card-title">{map.name ?? 'Unnamed Map'}</div>
//           <div className="muted small">Created {created ? formatDate(created) : '—'}</div>
//         </div>
//       </div>
//       <div className="chip-row">
//         <span className="stat-chip">{count('plot')} Plots</span>
//         <span className="stat-chip">{count('road')} Roads</span>
//         <span className="stat-chip">{count('open_space')} Spaces</span>
//       </div>
//       <button className="btn btn-primary btn-block" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
//         <IconOpenNew size={16} /> Open Map
//       </button>
//     </div>
//   );
// }

// export default function MapsTab({ maps, loading, reload }) {
//   const navigate = useNavigate();
//   const [q, setQ] = useState('');
//   const filtered = useMemo(
//     () => maps.filter((m) => (m.name ?? '').toLowerCase().includes(q.toLowerCase())),
//     [maps, q],
//   );

//   if (loading) return <CenterSpinner />;
//   return (
//     <div className="tab-body">
//       <SearchBar value={q} onChange={setQ} placeholder="Search maps..." />
//       <div className="list-head">
//         <span>{filtered.length} Map{filtered.length !== 1 ? 's' : ''} Available</span>
//         <button className="link-btn" onClick={reload}><IconRefresh size={16} /> Refresh</button>
//       </div>
//       {filtered.length === 0 ? (
//         <EmptyState
//           icon={<IconMap size={40} />}
//           title={q ? 'No maps found' : 'No maps available'}
//           subtitle={q ? 'Try a different search term' : 'Maps will appear here once created'}
//         />
//       ) : (
//         <div className="grid">
//           {filtered.map((m) => <MapCard key={m.id} map={m} onOpen={() => navigate(`/map/${m.id}`)} />)}
//         </div>
//       )}
//     </div>
//   );
// }



import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadAllowedMaps } from '../services/mapService';
import { CenterSpinner, EmptyState, SearchBar } from '../components/Common';
import { toDate, formatDate } from '../utils/format';
import { IconMap, IconRefresh, IconOpenNew } from '../icons';

const FILTERS = [
  { id: 'all', label: 'All Layouts' },
  { id: 'large', label: 'Most Plots' },
  { id: 'small', label: 'Compact' },
];

export function useAllowedMaps() {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      setMaps(await loadAllowedMaps());
    } catch (e) {
      console.error('Error loading maps:', e);
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  return { maps, loading, reload: load };
}

function MapCard({ map, index = 0, onOpen }) {
  const plots = map.plots ?? [];
  const count = (t) => plots.filter((p) => p.type === t).length;
  const created = toDate(map.createdDate);

  const plotCount = count('plot');
  const roadCount = count('road');
  const spaceCount = count('open_space');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      className="card map-card li-map-card"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open ${map.name ?? 'Unnamed Map'}`}
    >
      <div className="li-mc-top">
        {/* Card Header */}
        <div className="li-mc-head">
          <div className="li-mc-title-group">
            <span className="li-mc-eyebrow">SITE LAYOUT</span>
            <h3 className="li-mc-title">{map.name ?? 'Unnamed Map'}</h3>
            <span className="li-mc-date">
              Created {created ? formatDate(created) : '—'}
            </span>
          </div>
          <div className="li-mc-icon" aria-hidden="true">
            <IconMap size={22} />
          </div>
        </div>

        {/* 3-Column Architectural Breakdown */}
        <div className="li-mc-metrics">
          <div className="li-mc-metric tone-gold">
            <strong className="li-mc-metric-val">{plotCount}</strong>
            <span className="li-mc-metric-lbl">Plots</span>
          </div>
          <div className="li-mc-metric tone-slate">
            <strong className="li-mc-metric-val">{roadCount}</strong>
            <span className="li-mc-metric-lbl">Roads</span>
          </div>
          <div className="li-mc-metric tone-emerald">
            <strong className="li-mc-metric-val">{spaceCount}</strong>
            <span className="li-mc-metric-lbl">Spaces</span>
          </div>
        </div>
      </div>

      {/* Footer Chips & Action Button */}
      <div className="li-mc-bottom">
        <div className="li-mc-chips">
          <span className="li-mc-chip gold">{plotCount} Plots</span>
          <span className="li-mc-chip neutral">{roadCount} Roads</span>
          <span className="li-mc-chip green">{spaceCount} Spaces</span>
        </div>

        <button
          type="button"
          className="btn btn-block li-mc-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <span>Open Layout Map</span>
          <IconOpenNew size={16} />
        </button>
      </div>
    </article>
  );
}

export default function MapsTab({ maps, loading, reload }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = maps.filter((m) =>
      (m.name ?? '').toLowerCase().includes(q.toLowerCase()),
    );
    const plotCount = (m) =>
      (m.plots ?? []).filter((p) => p.type === 'plot').length;

    if (filter === 'large') {
      list = [...list].sort((a, b) => plotCount(b) - plotCount(a));
    } else if (filter === 'small') {
      list = [...list].sort((a, b) => plotCount(a) - plotCount(b));
    }
    return list;
  }, [maps, q, filter]);

  if (loading) return <CenterSpinner />;

  return (
    <div className="tab-body li-maps-tab">
      {/* Search & Filter Toolbar */}
      <div className="li-maps-toolbar">
        <div className="li-maps-search-row">
          <div className="li-maps-search-wrap">
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Search site layouts by name..."
            />
          </div>

          <button
            type="button"
            className="li-refresh-btn"
            onClick={reload}
            title="Refresh maps"
          >
            <IconRefresh size={16} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="li-maps-subbar">
          <div className="li-filter-group" role="group" aria-label="Sort maps">
            {FILTERS.map((f) => (
              <button
                type="button"
                key={f.id}
                className={`li-filter-pill ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="li-maps-count">
            <span className="li-maps-count-dot" />
            <strong>{filtered.length}</strong> Map
            {filtered.length !== 1 ? 's' : ''} Available
          </div>
        </div>
      </div>

      {/* Empty State or Responsive Card Grid */}
      {filtered.length === 0 ? (
        <div className="li-empty-box">
          <EmptyState
            icon={<IconMap size={42} />}
            title={q ? 'No matching layouts found' : 'No maps available'}
            subtitle={
              q
                ? 'Try searching with a different project or layout name'
                : 'Active site layouts will appear here once published'
            }
          />
        </div>
      ) : (
        <div className="grid li-maps-grid">
          {filtered.map((m, idx) => (
            <MapCard
              key={m.id}
              map={m}
              index={idx}
              onOpen={() => navigate(`/map/${m.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}