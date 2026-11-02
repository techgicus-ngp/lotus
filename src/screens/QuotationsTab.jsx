import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { watchEmployeeQuotations } from '../services/quotationService';
import { CenterSpinner, EmptyState, SearchBar } from '../components/Common';
import { formatCurrency, formatDateShort, formatNumber } from '../utils/format';
import { IconDoc, IconPrint } from '../icons';

export function useEmployeeQuotations(uid) {
  const [state, setState] = useState({ list: null, error: null });
  useEffect(() => watchEmployeeQuotations(
    uid,
    (list) => setState({ list, error: null }),
    (error) => { console.error('Quotation stream error:', error); setState({ list: [], error }); },
  ), [uid]);
  return state;
}

export default function QuotationsTab({ state }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  if (state.list === null) return <CenterSpinner />;
  if (state.error) {
    return <EmptyState icon={<IconDoc size={40} />} title="Failed to load quotations" subtitle={String(state.error.message ?? state.error)} />;
  }
  const s = q.toLowerCase();
  const list = state.list.filter((x) =>
    !s || x.customerName.toLowerCase().includes(s) || x.plotNumber.toLowerCase().includes(s) || x.projectName.toLowerCase().includes(s));

  return (
    <div className="tab-body">
      <SearchBar value={q} onChange={setQ} placeholder="Search by customer, plot or project..." />
      <div className="list-head"><span>QUOTATIONS</span><span className="muted small">Tap to view details</span></div>
      {list.length === 0 ? (
        <EmptyState icon={<IconDoc size={40} />} title={q ? 'No quotations found' : 'No quotations yet'}
          subtitle={q ? 'Try a different search term' : 'Open a map, pick a plot and tap “Create Quotation”'} />
      ) : (
        <div className="stack">
          {list.map((x) => (
            <div key={x.id} className="card q-card" onClick={() => navigate(`/quotations/${x.id}`)} role="button" tabIndex={0}>
              <div className="q-card-top">
                <div className="grow">
                  <div className="card-title">{x.customerName}</div>
                  <div className="muted small">{x.projectName} · Plot {x.plotNumber}</div>
                </div>
                <div className="right">
                  <div className="q-amount">{formatCurrency(x.finalTotalAmount)}</div>
                  <div className="muted small">{formatDateShort(x.quotationDate)}</div>
                </div>
              </div>
              <div className="chip-row">
                <span className="stat-chip">{formatNumber(x.plotSize)} sq ft</span>
                <span className="stat-chip">{formatCurrency(x.ratePerSqFt)}/sq ft</span>
                <button
                  className="btn btn-outline btn-sm push-right"
                  onClick={(e) => { e.stopPropagation(); navigate(`/quotations/${x.id}`); }}
                ><IconPrint size={14} /> View PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
