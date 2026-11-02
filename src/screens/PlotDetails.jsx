// import {
//   AC, is12mRoadPlot, isLightColor, rlColor, rlLabel, rlStatusOf, statusColor,
// } from '../utils/plotHelpers';
// import { capitalizeType } from '../utils/format';
// import {
//   IconCategory, IconClose, IconCompass, IconLandscape, IconMap, IconNotes, IconOpenFull,
//   IconReceipt, IconRuler, IconVerified, IconCancel, IconPending,
// } from '../icons';

// const rlIcon = (p) => ({ approved: IconVerified, rejected: IconCancel, pending: IconPending })[rlStatusOf(p)];

// function StatusBadge({ status }) {
//   const c = statusColor(status);
//   return (
//     <span className="status-badge" style={{ background: `${c}26`, color: isLightColor(c) ? AC.textPrimary : c }}>
//       {status || 'Unknown'}
//     </span>
//   );
// }

// /** Bottom card shown when a plot / open space is tapped on the map. */
// export default function PlotDetailsCard({ plot, canQuote, onClose, onQuote, onFull }) {
//   const isPlot = plot.type === 'plot';
//   const sqft = plot.area * 10.764;
//   const RL = rlIcon(plot);
//   const is12m = is12mRoadPlot(plot);

//   return (
//     <div className="details-card">
//       <div className="sheet-grab" />
//       <div className="details-head">
//         <div className="details-icon" style={{ background: isPlot ? `${statusColor(plot.status)}1f` : '#E3F2FD' }}>
//           {isPlot ? <IconMap size={22} /> : <IconLandscape size={22} />}
//         </div>
//         <div className="grow">
//           <div className="details-title">{isPlot ? `Plot ${plot.plotNo}` : plot.title}</div>
//           <div className="chip-row">
//             {isPlot && plot.status && <StatusBadge status={plot.status} />}
//             {isPlot && (
//               <span className="status-badge" style={{ background: `${is12m ? AC.hi12m : AC.hi9m}22`, color: is12m ? AC.hi12m : AC.hi9m }}>
//                 {is12m ? '12m Road' : '9m Road'}
//               </span>
//             )}
//           </div>
//         </div>
//         <button className="icon-btn" onClick={onClose} aria-label="Close"><IconClose size={18} /></button>
//       </div>
//       <hr />

//       {isPlot ? (
//         <>
//           <div className="info-tiles">
//             <div className="info-tile" style={{ '--c': '#009688' }}>
//               <IconRuler size={18} /><span className="muted small">Area</span>
//               <b>{plot.area.toFixed(1)} sq.m</b><span className="muted small">{sqft.toFixed(1)} sq.ft</span>
//             </div>
//             <div className="info-tile" style={{ '--c': '#FF9800' }}>
//               <IconCompass size={18} /><span className="muted small">Facing</span><b>{plot.facing || '—'}</b>
//             </div>
//             <div className="info-tile" style={{ '--c': rlColor(plot) }}>
//               <RL size={18} /><span className="muted small">RL Status</span><b>{rlLabel(plot)}</b>
//             </div>
//           </div>
//           {plot.notes && <div className="info-row"><IconNotes size={16} /> <span className="muted">Note</span> {plot.notes}</div>}
//         </>
//       ) : (
//         <>
//           <div className="info-row"><IconCategory size={16} /> <span className="muted">Type</span> {plot.type.replaceAll('_', ' ').toUpperCase()}</div>
//           {plot.area > 0 && <div className="info-row"><IconRuler size={16} /> <span className="muted">Area</span> {plot.area.toFixed(1)} sq.m · {sqft.toFixed(1)} sq.ft</div>}
//         </>
//       )}

//       <div className="details-actions">
//         {isPlot && canQuote && (
//           <button className="btn btn-purple btn-block" onClick={onQuote}><IconReceipt size={16} /> Create Quotation</button>
//         )}
//         {isPlot && (
//           <a className="btn btn-outline btn-block" target="_blank" rel="noreferrer"
//             href={`https://maps.google.com/?q=${plot.center.lat},${plot.center.lng}`}>
//             <IconMap size={16} /> Open in Google Maps
//           </a>
//         )}
//         <div className="inline-row">
//           <button className="btn btn-outline grow" onClick={onClose}><IconClose size={16} /> Dismiss</button>
//           <button className="btn btn-primary grow2" onClick={onFull}><IconOpenFull size={16} /> View Full Details</button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /** Full plot detail bottom sheet. */
// export function PlotViewSheet({ plot, onClose }) {
//   const rl = rlStatusOf(plot);
//   const RL = rlIcon(plot);
//   const is12m = is12mRoadPlot(plot);
//   const c = statusColor(plot.status);
//   const rlText = {
//     approved: 'This plot has received RL approval.',
//     rejected: 'RL approval for this plot was rejected.',
//     pending: 'RL approval for this plot is pending.',
//   }[rl];

//   const Card = ({ icon: I, title, value, color }) => (
//     <div className="detail-card" style={{ '--c': color }}><I size={18} /><span className="muted small">{title}</span><b>{value}</b></div>
//   );

//   return (
//     <div className="plot-sheet">
//       <div className="sheet-grab" />
//       <div className="inline-row between">
//         <div>
//           <div className="muted small">{capitalizeType(plot.type)}</div>
//           <div className="plot-sheet-title">{plot.type === 'plot' ? `Plot ${plot.plotNo || plot.srNo || '—'}` : plot.title}</div>
//         </div>
//         <div className="stack tight right">
//           <StatusBadge status={plot.status} />
//           <span className="status-badge" style={{ background: `${rlColor(plot)}22`, color: rlColor(plot) }}>RL {rlLabel(plot)}</span>
//         </div>
//       </div>

//       <div className="rl-card" style={{ borderColor: rlColor(plot), background: `${rlColor(plot)}12` }}>
//         <RL size={26} color={rlColor(plot)} />
//         <div><b>RL Approval</b><div className="muted small">{rlText}</div></div>
//       </div>

//       <div className="two-col">
//         <Card icon={IconRuler} title="Area (sq.m)" value={`${plot.area.toFixed(0)} m²`} color={AC.primary} />
//         <Card icon={IconRuler} title="Area (sq.ft)" value={`${(plot.area * 10.7639).toFixed(0)} ft`} color={AC.primary} />
//         <Card icon={IconCompass} title="Facing" value={plot.facing || '—'} color="#EA580C" />
//         <Card icon={IconRuler} title="Road Width" value={is12m ? '12m' : '9m'} color={is12m ? AC.hi12m : AC.hi9m} />
//       </div>
//       <button className="btn btn-primary btn-block btn-lg" onClick={onClose}>Close</button>
//     </div>
//   );
// }



// Plot inspector sheet — dark-glass card.
// Desktop: floating card (bottom-right). Mobile (≤ 640px): compact bar (plot no. + status + arrow);
// tap the bar or the arrow to expand, tap the arrow again to collapse.
// Colours (status / RL / road width) come from utils/plotHelpers (same palette as the map).
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, X, Compass, Maximize2, MapPin, ChevronDown, ChevronUp, StickyNote, ShieldCheck, Route,
} from "lucide-react";
import { isGuest } from "../models/user";
import { capitalizeType } from "../utils/format";
import { AC, is12mRoadPlot, isLightColor, rlColor, rlLabel, statusColor } from "../utils/plotHelpers";

const CANVAS = "rgba(255, 255, 255, 0.96)";
const HAIR = "rgba(26, 26, 46, 0.12)";
const ACCENT = "#4F46E5";
const GRAD = "linear-gradient(135deg, #4F46E5, #7C3AED)";
const SOFT = "rgba(79, 70, 229, 0.07)";
const INK = "#1A1A2E";
const MUTED = "#6B7280";
const SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Consolas, monospace";

/** true while the viewport is at most `max` px wide */
function useIsMobile(max = 640) {
  const query = `(max-width: ${max}px)`;
  const [match, setMatch] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

const Tile = ({ icon: Icon, title, value, sub, color }) => (
  <div
    style={{
      flex: 1,
      minWidth: 105,
      background: color ? `${color}14` : SOFT,
      border: `1px solid ${color ? `${color}55` : HAIR}`,
      borderRadius: 12,
      padding: "12px 13px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}
  >
    <div
      style={{
        display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 600,
        letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED,
      }}
    >
      {Icon && <Icon size={12} color={color || ACCENT} />}
      {title}
    </div>
    <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: color || INK }}>{value}</div>
    {sub && <div style={{ fontFamily: MONO, fontSize: 11.5, color: MUTED }}>{sub}</div>}
  </div>
);

/**
 * @param plot       selected plot (status "" hides status/RL — used by the public share view)
 * @param hideStatus true on the public share view
 */
export default function PlotViewSheet({ plot, mapId, mapName, user, hideStatus = false, onClose }) {
  const nav = useNavigate();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  // a newly selected plot always opens compact again on mobile
  useEffect(() => {
    setExpanded(false);
  }, [plot.srNo, plot.plotNo, plot.title]);

  const compact = isMobile && !expanded;
  const isPlot = plot.type === "plot";
  const c = statusColor(plot.status);
  const is12m = is12mRoadPlot(plot);
  const roadColor = is12m ? AC.hi12m : AC.hi9m;
  const canQuote = isPlot && user && !isGuest(user); // guests (incl. public view) never see it
  const sqft = plot.areaSqFt || plot.area * 10.7639;

  return (
    <div
      role="dialog"
      aria-label="Plot details"
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed", right: 16, bottom: 16, zIndex: 30, width: 390,
        maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 48px)",
        display: "flex", flexDirection: "column", background: CANVAS,
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${HAIR}`, borderRadius: 16, boxShadow: "0 24px 60px rgba(31, 41, 55, 0.22)",
        color: INK, fontFamily: SANS, overflow: "hidden",
        animation: "pvsSlideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`
        @keyframes pvsSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          div[aria-label="Plot details"] {
            left: 10px !important; right: 10px !important; bottom: 10px !important;
            width: auto !important; max-width: none !important;
          }
        }
      `}</style>

      {/* Header — on mobile the whole compact bar is tappable to expand */}
      <div
        onClick={compact ? () => setExpanded(true) : undefined}
        style={{
          display: "flex", justifyContent: "space-between",
          alignItems: compact ? "center" : "flex-start", gap: 10,
          padding: compact ? "12px 14px" : "16px 18px 14px",
          borderBottom: compact ? "none" : `1px solid ${HAIR}`,
          cursor: compact ? "pointer" : "default",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
              textTransform: "uppercase", color: ACCENT, marginBottom: compact ? 2 : 4,
            }}
          >
            {capitalizeType(plot.type)}
          </div>
          <h3
            style={{
              margin: 0, fontSize: compact ? 17 : 20, fontWeight: 800, letterSpacing: "-0.02em",
              color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            {isPlot ? `Plot ${plot.plotNo}` : plot.title}
          </h3>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {!hideStatus && isPlot && plot.status && (
            <span
              style={{
                fontFamily: MONO, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.04em", color: isLightColor(c) ? INK : c, border: `1px solid ${c}`, background: `${c}33`,
                padding: "5px 10px", borderRadius: 999,
              }}
            >
              {plot.status}
            </span>
          )}

          {/* Expand / collapse arrow (mobile only) */}
          {isMobile && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              aria-label={expanded ? "Collapse details" : "Expand details"}
              aria-expanded={expanded}
              style={{
                width: 32, height: 32, borderRadius: 8, background: "rgba(79, 70, 229, 0.10)",
                border: "1px solid rgba(79, 70, 229, 0.30)", color: ACCENT, display: "grid",
                placeItems: "center", cursor: "pointer",
              }}
            >
              {expanded ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
            </button>
          )}

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: 8, background: SOFT,
              border: `1px solid ${HAIR}`, color: MUTED, display: "grid", placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!compact && (
        <>
          {/* Body */}
          <div style={{ padding: "16px 18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Key metric tiles */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Tile icon={Maximize2} title="Area" value={`${plot.area.toFixed(0)} sq.m`} sub={`${sqft.toFixed(0)} sq.ft`} />
              <Tile title="Dimensions" value={plot.dimensions || "Standard"} />
              <Tile icon={Compass} title="Facing" value={plot.facing || "—"} />
              {isPlot && (
                <Tile icon={Route} title="Road" value={is12m ? "12 m" : "9 m"} color={roadColor} />
              )}
              {isPlot && !hideStatus && (
                <Tile icon={ShieldCheck} title="RL Status" value={rlLabel(plot)} color={rlColor(plot)} />
              )}
            </div>

            {/* Center coordinates (opens Google Maps) */}
            <a
              href={`https://maps.google.com/?q=${plot.center.lat},${plot.center.lng}`}
              target="_blank"
              rel="noreferrer"
              title="Open in Google Maps"
              style={{
                background: SOFT, border: `1px solid ${HAIR}`, borderRadius: 11,
                padding: "11px 13px", fontSize: 12.5, display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 10, color: INK, textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin size={15} color={ACCENT} />
                <span style={{ color: MUTED, fontWeight: 600 }}>Center Coordinates</span>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11.5 }}>
                {plot.center.lat.toFixed(6)}, {plot.center.lng.toFixed(6)}
              </span>
            </a>

            {/* Notes */}
            {plot.notes && (
              <div
                style={{
                  background: "rgba(79, 70, 229, 0.07)", border: "1px solid rgba(79, 70, 229, 0.30)",
                  padding: "12px 14px", borderRadius: 11, fontSize: 13, color: INK,
                }}
              >
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em", color: ACCENT, marginBottom: 4,
                  }}
                >
                  <StickyNote size={13} /> Notes
                </div>
                {plot.notes}
              </div>
            )}

            {/* Collapsible corner coordinates */}
            <details
              style={{
                background: SOFT, border: `1px solid ${HAIR}`,
                borderRadius: 11, padding: "10px 13px",
              }}
            >
              <summary
                style={{
                  cursor: "pointer", fontWeight: 600, fontSize: 12.5, color: MUTED, display: "flex",
                  alignItems: "center", justifyContent: "space-between", listStyle: "none",
                }}
              >
                <span>Corner Points ({plot.corners.length})</span>
                <ChevronDown size={14} />
              </summary>
              <div
                style={{
                  marginTop: 10, paddingTop: 8, borderTop: `1px solid ${HAIR}`, display: "grid",
                  gap: 5, maxHeight: 130, overflowY: "auto",
                }}
              >
                {plot.corners.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: MONO, fontSize: 11.5, color: MUTED, display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ color: ACCENT }}>#{i + 1}</span>
                    <span>Lat: {p.lat.toFixed(6)} · Lng: {p.lng.toFixed(6)}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>

          {/* Footer actions */}
          <div style={{ display: "flex", gap: 10, padding: "12px 18px 16px", borderTop: `1px solid ${HAIR}` }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, font: `500 13px/1 ${MONO}`, color: INK, background: "transparent",
                border: `1px solid ${HAIR}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer",
              }}
            >
              Close
            </button>

            {canQuote && (
              <button
                type="button"
                onClick={() => nav("/quotations/new", { state: { plot, mapId, mapName } })}
                style={{
                  flex: 1.8, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  gap: 8, font: `600 13px/1 ${MONO}`, color: "#FFFFFF", background: GRAD,
                  border: `1px solid ${ACCENT}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                }}
              >
                <FileText size={15} /> Generate Quotation
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}