// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { GoogleMap, OverlayViewF, PolygonF, useJsApiLoader } from '@react-google-maps/api';
// import { useSession } from '../context/SessionContext';
// import { getMap, watchMap } from '../services/mapService';
// import { plotFromDoc } from '../models/plot';
// import { isGuest } from '../models/user';
// import { useToast } from '../components/Toast';
// import { CenterSpinner, Modal } from '../components/Common';
// import PlotDetailsCard, { PlotViewSheet } from './PlotDetails';
// import {
//   AC, STATUS_LEGEND, boundsOf, defaultBorderColor, detectRoadWidth, fallbackKindName, is12mRoadPlot,
//   isAmenityPlot, isOpenSpaceType, isTokenStatus, kindDrawOrder, labelInkFor, normalizeStatus,
//   plotFillColor, roadLabelText, statusColor,
// } from '../utils/plotHelpers';
// import { IconBack, IconClose, IconFilter, IconFit, IconInfo, IconSearch } from '../icons';

// const LIBRARIES = [];
// const FACINGS = ['All', 'North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
// const DEFAULT_CENTER = { lat: 21.1458, lng: 79.0882 };

// export default function MapViewerScreen() {
//   const { mapId } = useParams();
//   const navigate = useNavigate();
//   const { user } = useSession();
//   const toast = useToast();
//   const mapRef = useRef(null);
//   const fitted = useRef(false);

//   const { isLoaded, loadError } = useJsApiLoader({
//     googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
//     libraries: LIBRARIES,
//   });

//   const [mapDoc, setMapDoc] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [zoom, setZoom] = useState(17);

//   // selection / search / filters
//   const [selected, setSelected] = useState(null);
//   const [sheetPlot, setSheetPlot] = useState(null);
//   const [searchType, setSearchType] = useState('plot');
//   const [query, setQuery] = useState('');
//   const [highlighted, setHighlighted] = useState(null);
//   const [filter, setFilter] = useState('all');
//   const [category, setCategory] = useState(null);
//   const [panelOpen, setPanelOpen] = useState(false);
//   const [areaOpen, setAreaOpen] = useState(false);
//   const [advOpen, setAdvOpen] = useState(false);
//   const [adv, setAdv] = useState({ min: '', max: '', unit: 'sqm', facing: 'All', status: 'All', road: 'All', rl: 'All' });
//   const [advSet, setAdvSet] = useState(new Set());
//   const [roadHi, setRoadHi] = useState({ type: null, set: new Set() });
//   const [bookedHi, setBookedHi] = useState(false);

//   // ── data ────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     let off = () => {};
//     (async () => {
//       try { setMapDoc(await getMap(mapId)); } catch (e) { console.error(e); }
//       setLoading(false);
//       off = watchMap(mapId, setMapDoc); // live updates (e.g. someone books a plot)
//     })();
//     return () => off();
//   }, [mapId]);

//   const plots = useMemo(() => (mapDoc?.plots ?? []).map((p) => plotFromDoc(p)), [mapDoc]);
//   const drawOrder = useMemo(() => [...plots].sort((a, b) => kindDrawOrder(a.type) - kindDrawOrder(b.type)), [plots]);
//   const boundary = useMemo(
//     () => (mapDoc?.layoutBoundary ?? []).map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) })), [mapDoc]);
//   const mapName = mapDoc?.name ?? 'Unnamed Map';
//   const categories = useMemo(
//     () => [...new Set(plots.filter((p) => p.type === 'plot').map((p) => normalizeStatus(p.status)))], [plots]);
//   const plotCount = plots.filter((p) => p.type === 'plot').length;

//   const fitTo = useCallback((list, pad = 50) => {
//     const b = boundsOf(list);
//     if (b && mapRef.current) mapRef.current.fitBounds(b, pad);
//   }, []);

//   const onLoad = useCallback((m) => { mapRef.current = m; }, []);
//   useEffect(() => {
//     if (isLoaded && mapRef.current && plots.length && !fitted.current) {
//       fitted.current = true;
//       setTimeout(() => fitTo(plots), 300);
//     }
//   }, [isLoaded, plots, fitTo]);

//   // ── appearance ──────────────────────────────────────────────────────────
//   function fillFor(p) {
//     let fill = plotFillColor(p, mapId);
//     let opacity = 1;
//     if (bookedHi && p.type === 'plot') opacity = isTokenStatus(p.status) ? 1 : 0.18;
//     else if (roadHi.set.size && p.type === 'plot') {
//       if (roadHi.set.has(p.srNo)) { fill = roadHi.type === '12m' ? AC.hi12m : AC.hi9m; opacity = 0.95; } else opacity = 0.18;
//     } else if (advSet.size && p.type === 'plot' && !advSet.has(p.srNo)) opacity = 0.2;

//     if (filter !== 'all') {
//       if (filter === 'plot' && p.type !== 'plot') opacity = 0.3;
//       if (filter === 'road' && p.type !== 'road') opacity = 0.3;
//       if (filter === 'open_space' && !isOpenSpaceType(p)) opacity = 0.3;
//       if (filter === 'amenity' && !isAmenityPlot(p)) opacity = 0.3;
//       if (filter === 'category' && p.type === 'plot' && normalizeStatus(p.status) !== category) opacity = 0.3;
//     }
//     return { fill, opacity };
//   }

//   function borderFor(p) {
//     let color = defaultBorderColor(p);
//     let weight = p.type === 'road' ? 0 : 2;
//     if (bookedHi && p.type === 'plot' && isTokenStatus(p.status)) { color = AC.token; weight = 5; }
//     if (roadHi.set.has(p.srNo)) { color = roadHi.type === '12m' ? AC.hi12m : AC.hi9m; weight = 5; }
//     if (advSet.has(p.srNo)) { color = '#18FFFF'; weight = 4; }
//     if (highlighted && highlighted.srNo === p.srNo && highlighted.plotNo === p.plotNo) { color = AC.selected; weight = 5; }
//     if (selected && selected.srNo === p.srNo && selected.plotNo === p.plotNo) { color = AC.selected; weight = 5; }
//     return { color, weight };
//   }

//   // ── interactions ────────────────────────────────────────────────────────
//   function clearHighlights() { setRoadHi({ type: null, set: new Set() }); setBookedHi(false); }

//   function onPlotClick(p) {
//     if (p.type === 'road') return onRoadClick(p);
//     setPanelOpen(false);
//     setSelected(p);
//     fitTo([p], 80);
//   }

//   function onRoadClick(road) {
//     setSelected(null);
//     const width = detectRoadWidth(road);
//     if (roadHi.type === width && roadHi.set.size) return setRoadHi({ type: null, set: new Set() });
//     const set = new Set(
//       plots.filter((p) => p.type === 'plot' && (width === '12m' ? is12mRoadPlot(p) : !is12mRoadPlot(p))).map((p) => p.srNo));
//     setBookedHi(false);
//     setRoadHi({ type: width, set });
//   }

//   function applyFilter(f, cat = null) {
//     setHighlighted(null); setQuery(''); setRoadHi({ type: null, set: new Set() });
//     setFilter(f); setCategory(cat);
//     if (f === 'category' && cat && isTokenStatus(cat)) {
//       const booked = plots.filter((p) => p.type === 'plot' && isTokenStatus(p.status));
//       if (booked.length) { setBookedHi(true); fitTo(booked, 60); }
//       return;
//     }
//     setBookedHi(false);
//     if (f === 'all') fitTo(plots);
//   }

//   function runSearch(text, type = searchType) {
//     setQuery(text);
//     if (!text) return setHighlighted(null);
//     const q = text.toLowerCase();
//     const hits = plots.filter((p) => {
//       if (type === 'plot') return p.type === 'plot' && (p.plotNo.toLowerCase().includes(q) || p.srNo.toLowerCase().includes(q));
//       if (type === 'road') return p.type === 'road' && p.title.toLowerCase().includes(q);
//       if (type === 'open_space') return p.type === 'open_space' && p.title.toLowerCase().includes(q);
//       return (p.type === 'amenity' || p.type === 'amenity_space') && p.title.toLowerCase().includes(q);
//     }).sort((a, b) => {
//       const na = parseInt(a.plotNo, 10) || 0, nb = parseInt(b.plotNo, 10) || 0;
//       return na || nb ? na - nb : a.plotNo.localeCompare(b.plotNo);
//     });
//     if (hits[0]) { setHighlighted(hits[0]); fitTo([hits[0]], 50); } else setHighlighted(null);
//   }

//   function applyAdvanced() {
//     let min = parseFloat(adv.min), max = parseFloat(adv.max);
//     if (adv.unit === 'sqft') { if (!Number.isNaN(min)) min /= 10.764; if (!Number.isNaN(max)) max /= 10.764; }
//     const hasArea = !Number.isNaN(min) || !Number.isNaN(max);
//     if (!hasArea && adv.facing === 'All' && adv.status === 'All' && adv.road === 'All' && adv.rl === 'All') {
//       return setAdvSet(new Set());
//     }
//     const matched = plots.filter((p) => {
//       if (p.type !== 'plot') return false;
//       if (!Number.isNaN(min) && p.area < min) return false;
//       if (!Number.isNaN(max) && p.area > max) return false;
//       if (adv.facing !== 'All' && !p.facing.toLowerCase().includes(adv.facing.toLowerCase())) return false;
//       if (adv.status !== 'All' && normalizeStatus(p.status) !== adv.status) return false;
//       if (adv.road === '12m' && !is12mRoadPlot(p)) return false;
//       if (adv.road === '9m' && is12mRoadPlot(p)) return false;
//       const approved = p.contactPhone.trim().toLowerCase() === 'approved';
//       if (adv.rl === 'Approved' && !approved) return false;
//       if (adv.rl === 'Not Approved' && approved) return false;
//       return true;
//     });
//     setBookedHi(adv.status !== 'All' && isTokenStatus(adv.status));
//     setAdvSet(new Set(matched.map((p) => p.srNo)));
//     if (matched.length) fitTo(matched, 60);
//     else toast('No plots match these filters');
//   }
//   function clearAdvanced() {
//     setAdv({ min: '', max: '', unit: 'sqm', facing: 'All', status: 'All', road: 'All', rl: 'All' });
//     setAdvSet(new Set()); setBookedHi(false);
//   }

//   function createQuotation(p) {
//     if (!user || isGuest(user)) return toast('Please log in to create a quotation', { error: true });
//     navigate('/quotations/new', { state: { plot: p, mapName } });
//   }

//   // ── labels ──────────────────────────────────────────────────────────────
//   const labels = useMemo(() => {
//     if (zoom < 17) return [];
//     const px = Math.max(8, Math.min(16, (zoom - 15) * 2.4));
//     return drawOrder.map((p) => {
//       const pos = p.labelPosition ?? p.center;
//       if (p.type === 'plot') return p.plotNo && { key: `${p.srNo}-${p.plotNo}`, pos, text: p.plotNo, ink: '#000', size: px };
//       if (zoom < 18) return null;
//       if (p.type === 'road') return { key: `r-${p.srNo}-${p.title}`, pos, text: roadLabelText(p), ink: AC.roadLabelInk, size: px * 0.8 };
//       return { key: `o-${p.srNo}-${p.title}`, pos, text: p.title || fallbackKindName(p), ink: labelInkFor(p), size: px * 0.8 };
//     }).filter(Boolean);
//   }, [drawOrder, zoom]);

//   const mapContainer = { width: '100%', height: '100%' };
//   const mapOptions = useMemo(() => ({
//     mapTypeId: 'hybrid', disableDefaultUI: true, zoomControl: true, rotateControl: true, gestureHandling: 'greedy',
//   }), []);

//   if (loading) return <CenterSpinner />;
//   if (!mapDoc) return <div className="center-fill"><p>Map not found.</p><button className="btn btn-primary" onClick={() => navigate('/')}>Back</button></div>;
//   if (loadError) return <div className="center-fill"><p>Google Maps failed to load. Check VITE_GOOGLE_MAPS_API_KEY.</p></div>;

//   const areaDetails = {
//     'Total Area': mapDoc.totalArea ?? '0', 'Total Plots': mapDoc.totalPlots ?? '0',
//     'Total Roads': mapDoc.totalRoads ?? '0', 'Open Spaces': mapDoc.totalOpenSpaces ?? '0',
//   };

//   return (
//     <div className="map-page">
//       {/* top bar */}
//       <div className="map-topbar">
//         <button className="icon-btn-glass dark" onClick={() => navigate(-1)} aria-label="Back"><IconBack size={20} /></button>
//         <div className="grow">
//           <div className="map-title">{mapName}</div>
//           <div className="map-sub">
//             {bookedHi ? 'Highlighting Token plots' : roadHi.type ? `Showing ${roadHi.type} road plots` : `${plotCount} plots`}
//           </div>
//         </div>
//         <button className="icon-btn-glass dark" title="Fit all" onClick={() => fitTo(plots)}><IconFit size={20} /></button>
//         <button className="icon-btn-glass dark" title="Area details" onClick={() => setAreaOpen(true)}><IconInfo size={20} /></button>
//         <button className="icon-btn-glass dark" title="Search & filters" onClick={() => { setSelected(null); setPanelOpen((v) => !v); }}>
//           <IconFilter size={20} />
//         </button>
//       </div>

//       {/* map */}
//       <div className="map-canvas">
//         {!isLoaded ? <CenterSpinner /> : (
//           <GoogleMap
//             mapContainerStyle={mapContainer}
//             center={DEFAULT_CENTER}
//             zoom={17}
//             options={mapOptions}
//             onLoad={onLoad}
//             onZoomChanged={() => mapRef.current && setZoom(mapRef.current.getZoom())}
//             onClick={() => setSelected(null)}
//           >
//             {boundary.length > 2 && (
//               <PolygonF path={boundary} options={{ fillColor: AC.canvas, fillOpacity: 1, strokeOpacity: 0, clickable: false, zIndex: 0 }} />
//             )}
//             {drawOrder.map((p, i) => {
//               if (p.corners.length < 3) return null;
//               const { fill, opacity } = fillFor(p);
//               const b = borderFor(p);
//               return (
//                 <PolygonF
//                   key={`${p.srNo}-${p.plotNo}-${i}`}
//                   path={p.corners}
//                   onClick={() => onPlotClick(p)}
//                   options={{
//                     fillColor: fill, fillOpacity: opacity, strokeColor: b.color,
//                     strokeWeight: b.weight, strokeOpacity: b.weight ? Math.max(opacity, 0.5) : 0, zIndex: 1 + kindDrawOrder(p.type),
//                   }}
//                 />
//               );
//             })}
//             {labels.map((l) => (
//               <OverlayViewF key={l.key} position={l.pos} mapPaneName="overlayLayer">
//                 <div className="plot-label" style={{ color: l.ink, fontSize: l.size }}>{l.text}</div>
//               </OverlayViewF>
//             ))}
//           </GoogleMap>
//         )}

//         {(bookedHi || roadHi.type) && (
//           <button className="map-banner" onClick={clearHighlights}>
//             {bookedHi ? 'Highlighting Token plots' : `Showing ${roadHi.type} road plots`} · tap to clear <IconClose size={14} />
//           </button>
//         )}

//         <div className="legend">
//           <div className="legend-title">LEGEND</div>
//           {STATUS_LEGEND.map(([c, label]) => (
//             <div className="legend-row" key={label}><span className="legend-dot" style={{ background: c }} />{label}</div>
//           ))}
//         </div>

//         {selected && (
//           <PlotDetailsCard
//             plot={selected}
//             canQuote={!!user && !isGuest(user)}
//             onClose={() => setSelected(null)}
//             onQuote={() => createQuotation(selected)}
//             onFull={() => { setSheetPlot(selected); setSelected(null); }}
//           />
//         )}
//       </div>

//       {/* search + filter panel */}
//       {panelOpen && (
//         <aside className="map-panel">
//           <div className="panel-handle" />
//           <div className="inline-row">
//             <select className="input narrow" value={searchType} onChange={(e) => { setSearchType(e.target.value); setQuery(''); setHighlighted(null); }}>
//               <option value="plot">Plot</option><option value="road">Road</option>
//               <option value="open_space">Open Space</option><option value="amenity">Amenity</option>
//             </select>
//             <div className="searchbar grow">
//               <IconSearch size={18} color="#888" />
//               <input placeholder="Search..." value={query} onChange={(e) => runSearch(e.target.value)} />
//               {query && <button className="searchbar-clear" onClick={() => runSearch('')}><IconClose size={14} /></button>}
//             </div>
//           </div>
//           {highlighted && (
//             <button className="search-result" onClick={() => { setSelected(highlighted); setPanelOpen(false); }}>
//               <b>{highlighted.type === 'plot' ? `Plot ${highlighted.plotNo}` : highlighted.title}</b>
//               {highlighted.type === 'plot' && (
//                 <span style={{ color: statusColor(highlighted.status) }}> · {normalizeStatus(highlighted.status)}</span>
//               )}
//             </button>
//           )}

//           <div className="chip-row wrap">
//             {[['All', 'all'], ['Plots', 'plot'], ['Open', 'open_space'], ['Amenity', 'amenity']].map(([l, f]) => (
//               <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => applyFilter(f)}>{l}</button>
//             ))}
//             {categories.map((c) => (
//               <button key={c} className={`chip ${filter === 'category' && category === c ? 'on' : ''}`}
//                 style={filter === 'category' && category === c ? { background: statusColor(c), borderColor: statusColor(c) } : undefined}
//                 onClick={() => applyFilter('category', c)}>{c}</button>
//             ))}
//           </div>

//           <button className="link-btn" onClick={() => setAdvOpen((v) => !v)}>
//             <IconFilter size={16} /> Advanced Filters {advSet.size ? `(${advSet.size})` : ''}
//           </button>
//           {advOpen && (
//             <div className="adv-panel">
//               <div className="adv-title">Area Range</div>
//               <div className="chip-row">
//                 {['sqm', 'sqft'].map((u) => (
//                   <button key={u} className={`chip ${adv.unit === u ? 'on' : ''}`} onClick={() => setAdv({ ...adv, unit: u })}>{u === 'sqm' ? 'sq.m' : 'sq.ft'}</button>
//                 ))}
//               </div>
//               <div className="inline-row">
//                 <input className="input" inputMode="decimal" placeholder={`Min ${adv.unit === 'sqft' ? 'sq.ft' : 'sq.m'}`} value={adv.min} onChange={(e) => setAdv({ ...adv, min: e.target.value })} />
//                 <input className="input" inputMode="decimal" placeholder={`Max ${adv.unit === 'sqft' ? 'sq.ft' : 'sq.m'}`} value={adv.max} onChange={(e) => setAdv({ ...adv, max: e.target.value })} />
//               </div>
//               <PillGroup title="Road Width" options={['All', '12m', '9m']} value={adv.road} onChange={(v) => setAdv({ ...adv, road: v })} />
//               <PillGroup title="Facing" options={FACINGS} value={adv.facing} onChange={(v) => setAdv({ ...adv, facing: v })} />
//               <PillGroup title="Status" options={['All', ...categories]} value={adv.status} onChange={(v) => setAdv({ ...adv, status: v })} />
//               <PillGroup title="RL Approved" options={['All', 'Approved', 'Not Approved']} value={adv.rl} onChange={(v) => setAdv({ ...adv, rl: v })} />
//               <div className="inline-row">
//                 <button className="btn btn-outline grow" onClick={clearAdvanced}>Clear</button>
//                 <button className="btn btn-primary grow" onClick={applyAdvanced}>Apply Filters</button>
//               </div>
//             </div>
//           )}
//         </aside>
//       )}

//       {/* dialogs */}
//       <Modal open={areaOpen} onClose={() => setAreaOpen(false)} sheet={false}>
//         <h3 className="dlg-title">Area Details</h3>
//         {Object.entries(areaDetails).map(([k, v]) => <div className="detail-row" key={k}><span>{k}</span><b>{String(v)}</b></div>)}
//         <hr />
//         <div className="muted small">Plots by Status:</div>
//         {categories.map((c) => (
//           <div className="detail-row" key={c}><span>{c}</span>
//             <b>{plots.filter((p) => p.type === 'plot' && normalizeStatus(p.status) === c).length}</b></div>
//         ))}
//         <div className="dlg-actions"><button className="btn btn-text" onClick={() => setAreaOpen(false)}>Close</button></div>
//       </Modal>

//       <Modal open={!!sheetPlot} onClose={() => setSheetPlot(null)}>
//         {sheetPlot && <PlotViewSheet plot={sheetPlot} onClose={() => setSheetPlot(null)} />}
//       </Modal>
//     </div>
//   );
// }

// function PillGroup({ title, options, value, onChange }) {
//   return (
//     <>
//       <div className="adv-title">{title}</div>
//       <div className="chip-row wrap">
//         {options.map((o) => (
//           <button key={o} className={`chip ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{o}</button>
//         ))}
//       </div>
//     </>
//   );
// }







// Layout map viewer — SVG masterplan drawn on a Google Maps OverlayView.
// Architecture: local-metre projection, uniform plot numbers, aligned road labels, CAD dimension
// overlay for the selected plot, animated camera, dark-glass HUD.
// Colours (plot fills, borders, roads, open spaces, selected, highlights) come from utils/plotHelpers.
// import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { createPortal } from "react-dom";
// import { useNavigate, useParams } from "react-router-dom";
// import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
// import { ArrowLeft, Info, SlidersHorizontal, Search, X, Maximize2, Share2, Copy, MessageCircle } from "lucide-react";
// import { useSession } from "../context/SessionContext";
// import { getMap, watchMap } from "../services/mapService";
// import { plotFromDoc } from "../models/plot";
// import { CenterSpinner } from "../components/Common";
// import { useToast } from "../components/Toast";
// import PlotViewSheet from "./PlotDetails";
// import SelectedDimensionOverlay from "../components/SelectedDimensionOverlay";
// import {
//   SQFT, getBounds, createLocalProjection, ptsToPath, computeFeatureMetrics, placeRoadLabels,
// } from "../utils/planGeometry";
// import {
//   AC, STATUS_LEGEND, defaultBorderColor, detectRoadWidth, is12mRoadPlot, isAmenityPlot,
//   isLightColor, isOpenSpaceType, isTokenStatus, labelInkFor, normalizeStatus, plotFillColor,
//   statusColor,
// } from "../utils/plotHelpers";

// /* ── HUD theme — same indigo/violet brand + white card look as the rest of the app.
//    Plot/map colours live in AC (utils/plotHelpers). ── */
// const CANVAS = "rgba(255, 255, 255, 0.94)";
// const PANEL = "rgba(255, 255, 255, 0.92)";
// const HAIR = "rgba(26, 26, 46, 0.12)";

// const ACCENT = "#4F46E5";
// const GRAD = "linear-gradient(135deg, #4F46E5, #7C3AED)";
// const SOFT = "rgba(79, 70, 229, 0.07)"; // subtle tinted fill for inputs / idle buttons
// const MUTED = "#6B7280";
// const INK = "#1A1A2E";
// const BOUNDARY_STROKE = "#C7D2FE"; // layout outline drawn on the dark map canvas
// const SELECTED_STROKE = "#E9C6F2";
// const SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
// const MONO = "'JetBrains Mono', 'SF Mono', Consolas, monospace";
// const UNIFORM_PLOT_FONT_SIZE = 1.95; // metres — same size for every plot number

// /* ── Camera & animation ── */
// const FLY_MS = 780;
// const ZOOM_STEP = 0.75;
// const ZOOM_STEP_MS = 220;
// const FLY_MIN_Z = 18.5;
// const FLY_MAX_Z = 22.2;
// const LAYOUT_ZOOM_BOOST = 0.6;
// const LAYOUT_MIN_ZOOM = 18.2;
// const MAP_MAX_Z = 24;
// const easeOut = (t) => 1 - (1 - t) ** 3;
// const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// const FACINGS = ["All", "North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"];
// const LIBRARIES = [];
// const PUBLIC_USER = { uid: "public", name: "Visitor", role: "guest" };
// const plotKey = (p) => p.srNo || p.plotNo || p.title;
// const DEFAULT_ADV = { min: "", max: "", facing: "All", status: "All", road: "All", rl: "All", unit: "m²" };

// /* ── Masterplan SVG ─────────────────────────────────────────────────────── */
// const MasterplanSvgContent = memo(function MasterplanSvgContent({
//   layout, highlightKey, styleFor, opacityFor, onPlotClick,
// }) {
//   const selectedFeature = useMemo(
//     () => (highlightKey ? layout.features.find((f) => f.key === highlightKey) : null),
//     [layout, highlightKey],
//   );

//   return (
//     <g>
//       {/* Layout boundary base */}
//       {layout.boundaryD && (
//         <path
//           d={layout.boundaryD}
//           fill={AC.canvas}
//           fillOpacity="1"
//           stroke={BOUNDARY_STROKE}
//           strokeWidth="0.45"
//           strokeDasharray="1.8 1.2"
//           style={{ pointerEvents: "none" }}
//         />
//       )}

//       {/* Polygons: roads → open spaces → plots */}
//       <g>
//         {layout.sorted.map((f) => {
//           const isSel = highlightKey === f.key;
//           const isRoad = f.raw.type === "road";
//           const st = styleFor(f.raw);
//           const baseAlpha = isRoad ? 1 : highlightKey && !isSel ? 0.52 : 0.96;
//           const alpha = opacityFor(f.raw, baseAlpha);
//           return (
//             <path
//               key={f.rk}
//               className="plan-plot-shape"
//               d={f.d}
//               fill={isSel ? AC.selected : st.fill}
//               fillRule="evenodd"
//               fillOpacity={isSel ? 0.96 : alpha}
//               stroke={isSel ? SELECTED_STROKE : st.stroke}
//               strokeWidth={isSel ? 0.55 : st.sw}
//               strokeOpacity={isRoad ? 0 : alpha < 0.4 ? 0.35 : 0.95}
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onPlotClick(f.raw);
//               }}
//             />
//           );
//         })}
//       </g>

//       {/* Plot numbers */}
//       <g style={{ pointerEvents: "none" }}>
//         {layout.plotFeatures.map((f) => {
//           if (f.key === highlightKey || !f.label) return null;
//           const st = styleFor(f.raw);
//           const alpha = opacityFor(f.raw, highlightKey ? 0.55 : 1);

          
//           return (
//             <text
//               key={`num-${f.rk}`}
//               x={f.cx}
//               y={f.cy}
//               textAnchor="middle"
//               dy="0.35em"
//               fontFamily={SANS}
//               fontSize={f.fontSize}
//               fontWeight="700"
//               fill={st.ink}
//               fillOpacity={alpha < 0.4 ? 0.28 : alpha}
//             >
//               {f.label}
//             </text>
//           );
//         })}
//       </g>

//       {/* Road & open-space labels (rotated along the feature) */}
//       <g style={{ pointerEvents: "none" }}>
//         {layout.zoneFeatures.map((f) => {
//           if (!f.label) return null;
//           const isRoad = f.raw.type === "road";
//           const rl = isRoad ? f.roadLabel : null;
//           if (isRoad && !rl) return null;
//           const size = rl ? rl.size : Math.min(Math.max(f.ir * 0.32, 1.15), 3.2);
//           if (size < 1.0) return null;
//           const lx = rl ? rl.x : f.cx;
//           const ly = rl ? rl.y : f.cy;
//           const lang = rl ? rl.angle : f.angle;
//           const alpha = opacityFor(f.raw, highlightKey ? 0.5 : 1);
//           return (
//             <g
//               key={`lbl-${f.rk}`}
//               paintOrder="stroke"
//               stroke="rgba(15, 18, 24, 0.75)"
//               strokeWidth={size * 0.14}
//               transform={`rotate(${lang.toFixed(1)} ${lx.toFixed(2)} ${ly.toFixed(2)})`}
//               opacity={alpha < 0.4 ? 0.25 : alpha}
//             >
//               <text
//                 x={lx}
//                 y={isRoad ? ly : ly - size * 0.35}
//                 textAnchor="middle"
//                 dy="0.35em"
//                 fontFamily={SANS}
//                 fontSize={size}
//                 letterSpacing={isRoad ? "0.04em" : "0.06em"}
//                 fill={isRoad ? AC.roadLabelInk : labelInkFor(f.raw)}
//                 fontWeight="700"
//               >
//                 {f.label}
//               </text>
//               {!isRoad && f.raw.area > 120 && (
//                 <text
//                   x={lx}
//                   y={ly + size * 0.75}
//                   textAnchor="middle"
//                   dy="0.35em"
//                   fontFamily={MONO}
//                   fontSize={size * 0.64}
//                   fill={labelInkFor(f.raw)}
//                   fontWeight="600"
//                 >
//                   {Math.round(f.raw.area).toLocaleString("en-IN")} m²
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </g>

//       {/* Raised selected plot + engineering dimensions */}
//       {selectedFeature && (
//         <g style={{ pointerEvents: "none" }}>
//           <path d={selectedFeature.d} fill={AC.selected} fillOpacity="0.94" stroke={SELECTED_STROKE} strokeWidth="0.65" />
//           <SelectedDimensionOverlay feature={selectedFeature} />
//         </g>
//       )}
//     </g>
//   );
// });

// /* ── Small dark-glass building blocks ───────────────────────────────────── */
// const sectionLabel = {
//   fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED,
// };

// function PillGroup({ title, options, value, onChange }) {
//   return (
//     <div style={{ display: "grid", gap: 9 }}>
//       <div style={sectionLabel}>{title}</div>
//       <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
//         {options.map((o) => {
//           const on = value === o;
//           return (
//             <button
//               key={o}
//               type="button"
//               onClick={() => onChange(o)}
//               style={{
//                 font: `500 12px/1 ${MONO}`, color: on ? "#FFFFFF" : INK,
//                 background: on ? ACCENT : SOFT,
//                 border: `1px solid ${on ? ACCENT : HAIR}`, borderRadius: 999,
//                 padding: "8px 12px", cursor: "pointer",
//               }}
//             >
//               {o}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function GlassModal({ title, onClose, children, actions }) {
//   return (
//     <div
//       onClick={onClose}
//       style={{
//         position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.55)",
//         display: "grid", placeItems: "center", padding: 16,
//       }}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         style={{
//           width: 380, maxWidth: "100%", background: CANVAS, backdropFilter: "blur(18px)",
//           WebkitBackdropFilter: "blur(18px)", border: `1px solid ${HAIR}`, borderRadius: 16,
//           boxShadow: "0 24px 60px rgba(0,0,0,.6)", color: INK, fontFamily: SANS, padding: 18,
//         }}
//       >
//         <div style={{ ...sectionLabel, color: ACCENT, fontSize: 13, marginBottom: 12 }}>{title}</div>
//         {children}
//         {actions && <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>{actions}</div>}
//       </div>
//     </div>
//   );
// }

// const glassBtn = (primary) => ({
//   font: `600 13px/1 ${MONO}`, color: primary ? "#FFFFFF" : INK,
//   background: primary ? GRAD : "transparent", border: `1px solid ${primary ? ACCENT : HAIR}`,
//   borderRadius: 10, padding: "11px 16px", cursor: "pointer", display: "inline-flex",
//   alignItems: "center", gap: 8, textDecoration: "none",
// });

// const kvRow = { display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, borderBottom: `1px solid ${HAIR}` };

// /* ── Main screen ────────────────────────────────────────────────────────── */
// export default function MapViewerScreen({ publicView = false }) {
//   const { mapId } = useParams();
//   const { user } = useSession();
//   const viewer = publicView ? PUBLIC_USER : user;
//   // Status toggle: ON = plots coloured by sale status; OFF = neutral plots, no status UI.
//   // (Public share view is always OFF.) The choice is remembered on this device.
//   const [showStatus, setShowStatus] = useState(() => {
//     if (publicView) return false;
//     try { return localStorage.getItem("mv_show_status") !== "0"; } catch { return true; }
//   });
//   const hideStatus = publicView || !showStatus;
//   const nav = useNavigate();
//   const toast = useToast();

//   const mapRef = useRef(null);
//   const flyRafRef = useRef(0);
//   const initialFitDoneRef = useRef(false);
//   const overlayPortalRef = useRef(null);
//   const compassNeedleRef = useRef(null);
//   const lastPlotsJson = useRef("");
//   const [, setOverlayReady] = useState(0);
//   const [mapReady, setMapReady] = useState(false);

//   const { isLoaded, loadError } = useJsApiLoader({
//     googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
//     libraries: LIBRARIES,
//   });

//   const [mapDoc, setMapDoc] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [typeFilter, setTypeFilter] = useState("all");
//   const [category, setCategory] = useState(null);
//   const [query, setQuery] = useState("");
//   const [highlight, setHighlight] = useState(null);
//   const [selected, setSelected] = useState(null);
//   const [showAdv, setShowAdv] = useState(false);
//   const [adv, setAdv] = useState(DEFAULT_ADV);
//   const [advMatch, setAdvMatch] = useState(new Set());
//   const [roadHi, setRoadHi] = useState({ type: null, keys: new Set() });
//   const [showArea, setShowArea] = useState(false);
//   const [showShare, setShowShare] = useState(false);

//   /* ── data: initial load, then live updates (e.g. someone books a plot) ── */
//   useEffect(() => {
//     initialFitDoneRef.current = false;
//     lastPlotsJson.current = "";
//     let off = () => {};
//     let cancelled = false;
//     const apply = (m) => {
//       const json = JSON.stringify(m.plots ?? []);
//       if (json === lastPlotsJson.current) return; // nothing changed → keep layout memo
//       lastPlotsJson.current = json;
//       setMapDoc(m);
//     };
//     getMap(mapId)
//       .then((m) => {
//         if (cancelled) return;
//         if (m) {
//           apply(m);
//           off = watchMap(mapId, apply);
//         }
//       })
//       .catch((e) => console.error("Error loading map data:", e))
//       .finally(() => !cancelled && setLoading(false));
//     return () => { cancelled = true; off(); };
//   }, [mapId]);

//   useEffect(() => () => cancelAnimationFrame(flyRafRef.current), []);

//   const plots = useMemo(
//     () =>
//       (mapDoc?.plots ?? []).map((raw) => {
//         const p = plotFromDoc(raw);
//         // public share view never reveals sale status
//         return hideStatus && p.type === "plot" ? { ...p, status: "Available" } : p;
//       }),
//     [mapDoc, hideStatus],
//   );
//   const boundary = useMemo(
//     () => (mapDoc?.layoutBoundary ?? []).map((p) => ({ lat: +p.lat, lng: +p.lng })),
//     [mapDoc],
//   );

//   /* ── Share ── */
//   const shareUrl = `${window.location.origin}/share/${mapId}`;
//   const shareText = `${mapDoc?.name || "Layout"} — view the layout and plots`;
//   const copyLink = async () => {
//     try {
//       await navigator.clipboard.writeText(shareUrl);
//     } catch {
//       const t = document.createElement("textarea");
//       t.value = shareUrl;
//       document.body.appendChild(t);
//       t.select();
//       document.execCommand("copy");
//       t.remove();
//     }
//     toast("Link copied");
//   };
//   const nativeShare = () => navigator.share({ title: shareText, text: shareText, url: shareUrl }).catch(() => {});
//   const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;

//   /* ── derived lists ── */
//   const statuses = useMemo(
//     () => (hideStatus ? [] : [...new Set(plots.filter((p) => p.type === "plot").map((p) => normalizeStatus(p.status)))]),
//     [plots, hideStatus],
//   );
//   const count = useCallback((t) => plots.filter((p) => p.type === t).length, [plots]);
//   const countStatus = useCallback(
//     (s) => plots.filter((p) => p.type === "plot" && normalizeStatus(p.status) === s).length,
//     [plots],
//   );

//   /* ── Build the local-metre layout for the SVG overlay ── */
//   const layout = useMemo(() => {
//     const allPts = plots.length ? plots.flatMap((p) => p.corners || []) : boundary;
//     if (!allPts.length) return null;
//     const b = getBounds(allPts);
//     if (!b) return null;

//     const proj = createLocalProjection((b.north + b.south) / 2, (b.east + b.west) / 2);
//     let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
//     const track = ([x, y]) => {
//       if (x < minX) minX = x;
//       if (x > maxX) maxX = x;
//       if (y < minY) minY = y;
//       if (y > maxY) maxY = y;
//     };

//     const boundaryPts = boundary.map((c) => {
//       const pt = proj.toMeters(c.lat, c.lng);
//       track(pt);
//       return pt;
//     });

//     const features = plots.map((p, idx) => {
//       const pts = (p.corners || []).map((c) => {
//         const pt = proj.toMeters(c.lat, c.lng);
//         track(pt);
//         return pt;
//       });
//       const { cx, cy, ir, angle } = computeFeatureMetrics(pts);
//       const label = p.type === "plot" ? String(p.plotNo || "") : String(p.title || "");
//       return {
//         key: plotKey(p) || `f-${idx}`,
//         rk: `${plotKey(p) || "f"}~${idx}`,
//         raw: p, pts, d: ptsToPath(pts), cx, cy, ir, angle, label,
//         fontSize: UNIFORM_PLOT_FONT_SIZE,
//       };
//     });


    
//     const roadLabels = placeRoadLabels(


      
//       features.map((f, i) => ({ key: i, pts: f.pts, label: f.label, type: f.raw.type })).filter((f) => f.type === "road"),
//       features.filter((f) => f.raw.type === "plot").map((f) => ({ pts: f.pts })),
//     );
//     features.forEach((f, i) => { f.roadLabel = roadLabels.get(i) || null; });

//     const orderScore = (t) => (t === "road" ? 0 : t === "plot" ? 2 : 1);
//     const sorted = [...features].sort((a, b2) => orderScore(a.raw.type) - orderScore(b2.raw.type));

//     const pad = 16;
//     const x0 = minX - pad, y0 = minY - pad, x1 = maxX + pad, y1 = maxY + pad;
//     return {
//       proj, x0, y0, x1, y1, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0),
//       northWestLL: proj.toLatLng(x0, y0), southEastLL: proj.toLatLng(x1, y1),
//       boundaryD: boundaryPts.length > 2 ? ptsToPath(boundaryPts) : "",
//       features, sorted,
//       plotFeatures: features.filter((f) => f.raw.type === "plot"),
//       zoneFeatures: features.filter((f) => f.raw.type !== "plot"),
//     };
//   }, [plots, boundary]);

//   /* ── Camera ── */
//   const animateCameraTo = useCallback((aimCenter, aimZoom, durationMs = FLY_MS) => {
//     const m = mapRef.current;
//     if (!m || !aimCenter) return;
//     cancelAnimationFrame(flyRafRef.current);
//     const c0 = m.getCenter();
//     if (!c0) {
//       m.setCenter(aimCenter);
//       if (aimZoom != null) m.setZoom(aimZoom);
//       return;
//     }
//     const startLat = c0.lat(), startLng = c0.lng();
//     const startZoom = m.getZoom() || 18;
//     const targetZoom = aimZoom != null ? aimZoom : startZoom;
//     m.setOptions({ isFractionalZoomEnabled: true, maxZoom: MAP_MAX_Z });

//     const t0 = performance.now();
//     const step = (now) => {
//       const k = Math.min(1, (now - t0) / durationMs);
//       const e = easeOut(k);
//       const center = {
//         lat: startLat + (aimCenter.lat - startLat) * e,
//         lng: startLng + (aimCenter.lng - startLng) * e,
//       };
//       const zoom = startZoom + (targetZoom - startZoom) * e;
//       if (typeof m.moveCamera === "function") m.moveCamera({ center, zoom });
//       else { m.setCenter(center); m.setZoom(zoom); }
//       if (k < 1) flyRafRef.current = requestAnimationFrame(step);
//       else overlayPortalRef.current?.overlay?.draw?.();
//     };
//     flyRafRef.current = requestAnimationFrame(step);
//   }, []);

//   const fitAll = useCallback(() => {
//     const m = mapRef.current;
//     if (!m) return;
//     cancelAnimationFrame(flyRafRef.current);

//     const plotPts = plots.filter((p) => p.type === "plot").flatMap((p) => p.corners || []);
//     const pts = plotPts.length ? plotPts : plots.length ? plots.flatMap((p) => p.corners || []) : boundary;
//     const b = getBounds(pts);
//     if (!b) return;

//     const vw = window.innerWidth, vh = window.innerHeight;
//     const pad =
//       vw < 600 ? { top: 82, right: 6, bottom: 48, left: 6 }
//       : vw < 1024 ? { top: 88, right: 10, bottom: 42, left: 10 }
//       : { top: 92, right: 12, bottom: 32, left: 12 };

//     const layoutCenter = { lat: (b.north + b.south) / 2, lng: (b.east + b.west) / 2 };
//     const R = 6378137;
//     const cosLat = Math.cos((layoutCenter.lat * Math.PI) / 180);
//     const spanLatM = ((b.north - b.south) * Math.PI * R) / 180;
//     const spanLngM = ((b.east - b.west) * Math.PI * R * cosLat) / 180;
//     const availW = Math.max(vw - pad.left - pad.right, 120);
//     const availH = Math.max(vh - pad.top - pad.bottom, 120);
//     const world = 156543.03392 * cosLat;
//     const mpp = Math.max(spanLngM / availW, spanLatM / availH, 0.01);
//     const fitZoom = Math.log2(world / mpp);
//     const zoom = clamp(Math.max(fitZoom + LAYOUT_ZOOM_BOOST, LAYOUT_MIN_ZOOM), 15, MAP_MAX_Z);

//     const shiftPx = (pad.top - pad.bottom) / 2;
//     const dLat = (shiftPx * (world / 2 ** zoom)) / 111320;
//     const target = { lat: layoutCenter.lat + dLat, lng: layoutCenter.lng };

//     m.setOptions({ isFractionalZoomEnabled: true, maxZoom: MAP_MAX_Z });
//     if (typeof m.moveCamera === "function") m.moveCamera({ center: target, zoom });
//     else { m.setCenter(target); m.setZoom(zoom); }
//     overlayPortalRef.current?.overlay?.draw?.();
//   }, [plots, boundary]);

//   const fitPlots = useCallback((list) => {
//     const b = getBounds(list.flatMap((p) => p.corners || []));
//     if (b) {
//       mapRef.current?.fitBounds(
//         { south: b.south, north: b.north, west: b.west, east: b.east },
//         { top: 130, right: 24, bottom: 64, left: 24 },
//       );
//     }
//   }, []);

//   const flyToPlot = useCallback((plot, durationMs = FLY_MS, forceZoom = null) => {
//     const m = mapRef.current;
//     if (!m || !plot) return;
//     const b = getBounds(plot.corners || []);
//     const center = plot.center || (b && { lat: (b.north + b.south) / 2, lng: (b.east + b.west) / 2 });
//     if (!center) return;

//     let targetZoom = forceZoom;
//     if (targetZoom == null) {
//       const R = 6378137;
//       const cosLat = Math.cos((center.lat * Math.PI) / 180);
//       const spanLatM = b ? ((b.north - b.south) * Math.PI * R) / 180 : Math.sqrt(plot.area || 150);
//       const spanLngM = b ? ((b.east - b.west) * Math.PI * R * cosLat) / 180 : Math.sqrt(plot.area || 150);
//       const vw = window.innerWidth, vh = window.innerHeight;
//       const boost = vw < 640 ? 1.85 : vw < 1024 ? 1.6 : 1.45;
//       const gutterM = 6;
//       const needW = (spanLngM + gutterM * 2) * 1.05;
//       const needH = (spanLatM + gutterM * 2) * 1.05;
//       const availW = Math.max(vw - (vw > 640 ? 410 : 40), 180);
//       const availH = Math.max(vh - (vw <= 640 ? 300 : 150), 180);
//       const world = 156543.03392 * cosLat;
//       const mpp = Math.max(needW / availW, needH / availH) / boost;
//       targetZoom = clamp(Math.log2(world / mpp), FLY_MIN_Z, FLY_MAX_Z);
//     }

//     // shift the aim point so the plot sits clear of the inspector sheet
//     let aim = center;
//     const proj = m.getProjection?.();
//     if (proj && window.google?.maps) {
//       const vw = window.innerWidth;
//       const scale = 2 ** targetZoom;
//       const shiftPxX = vw > 640 ? 150 : 0;
//       const shiftPxY = vw <= 640 ? 95 : -15;
//       const pt = proj.fromLatLngToPoint(new window.google.maps.LatLng(center.lat, center.lng));
//       if (pt) {
//         const shifted = proj.fromPointToLatLng(
//           new window.google.maps.Point(pt.x + shiftPxX / scale, pt.y + shiftPxY / scale),
//         );
//         if (shifted) aim = { lat: shifted.lat(), lng: shifted.lng() };
//       }
//     }
//     animateCameraTo(aim, targetZoom, durationMs);
//   }, [animateCameraTo]);

//   const nudgeZoom = useCallback((delta) => {
//     const m = mapRef.current;
//     if (!m) return;
//     const z1 = clamp((m.getZoom() || 19) + delta, 15, MAP_MAX_Z);
//     if (selected) flyToPlot(selected, ZOOM_STEP_MS, z1);
//     else animateCameraTo({ lat: m.getCenter().lat(), lng: m.getCenter().lng() }, z1, ZOOM_STEP_MS);
//   }, [selected, flyToPlot, animateCameraTo]);

//   /* Google Maps OverlayView that hosts the SVG sheet */
//   const attachOverlay = useCallback((mapInstance) => {
//     if (!window.google?.maps || !layout) return;
//     if (overlayPortalRef.current?.overlay) overlayPortalRef.current.overlay.setMap(null);

//     const hostDiv = document.createElement("div");
//     hostDiv.style.position = "absolute";
//     hostDiv.style.pointerEvents = "auto";
//     hostDiv.style.willChange = "transform, width, height, left, top";

//     class MasterplanOverlay extends window.google.maps.OverlayView {
//       onAdd() { this.getPanes().overlayMouseTarget.appendChild(hostDiv); }
//       draw() {
//         const proj = this.getProjection();
//         if (!proj) return;
//         const nw = proj.fromLatLngToDivPixel(new window.google.maps.LatLng(layout.northWestLL.lat, layout.northWestLL.lng));
//         const se = proj.fromLatLngToDivPixel(new window.google.maps.LatLng(layout.southEastLL.lat, layout.southEastLL.lng));
//         if (!nw || !se) return;
//         hostDiv.style.left = `${Math.min(nw.x, se.x)}px`;
//         hostDiv.style.top = `${Math.min(nw.y, se.y)}px`;
//         hostDiv.style.width = `${Math.max(1, Math.abs(se.x - nw.x))}px`;
//         hostDiv.style.height = `${Math.max(1, Math.abs(se.y - nw.y))}px`;
//       }
//       onRemove() { if (hostDiv.parentNode) hostDiv.parentNode.removeChild(hostDiv); }
//     }

//     const ov = new MasterplanOverlay();
//     ov.setMap(mapInstance);
//     overlayPortalRef.current = { overlay: ov, div: hostDiv };
//     setOverlayReady((n) => n + 1);
//   }, [layout]);

//   const onLoad = useCallback((m) => {
//     mapRef.current = m;
//     m.setOptions({ isFractionalZoomEnabled: true, maxZoom: MAP_MAX_Z });
//     attachOverlay(m);
//     setMapReady(true);
//   }, [attachOverlay]);

//   useEffect(() => {
//     if (isLoaded && mapReady && mapRef.current && layout) {
//       attachOverlay(mapRef.current);
//       if (!initialFitDoneRef.current) {
//         initialFitDoneRef.current = true;
//         fitAll(); // once per map, when both map and layout exist
//       }
//     }
//     return () => { overlayPortalRef.current?.overlay?.setMap(null); };
//   }, [isLoaded, mapReady, layout, attachOverlay, fitAll]);

//   const onIdle = useCallback(() => {
//     const m = mapRef.current;
//     if (m && compassNeedleRef.current) {
//       compassNeedleRef.current.style.transform = `rotate(${-(m.getHeading?.() || 0)}deg)`;
//     }
//   }, []);

//   const clearSelection = useCallback(() => { setHighlight(null); setSelected(null); }, []);

//   const toggleStatus = useCallback(() => {
//     const next = !showStatus;
//     setShowStatus(next);
//     try { localStorage.setItem("mv_show_status", next ? "1" : "0"); } catch { /* ignore */ }
//     clearSelection(); // the selected plot object carries the old status
//     if (!next) {
//       // drop any filter that depends on status
//       if (typeFilter === "category") { setTypeFilter("all"); setCategory(null); }
//       if (adv.status !== "All" || adv.rl !== "All") {
//         setAdv((a) => ({ ...a, status: "All", rl: "All" }));
//         setAdvMatch(new Set());
//       }
//     }
//   }, [showStatus, typeFilter, adv.status, adv.rl, clearSelection]);

//   const resetNorth = useCallback(() => {
//     const m = mapRef.current;
//     if (!m) return;
//     if (typeof m.moveCamera === "function") m.moveCamera({ heading: 0, tilt: 0 });
//     clearSelection();
//     setRoadHi({ type: null, keys: new Set() });
//     fitAll();
//   }, [fitAll, clearSelection]);

//   /* ── Appearance (palette from AC) ── */
//   const styleFor = useCallback((p) => {
//     const key = plotKey(p);
//     let fill = plotFillColor(p, mapId);
//     let stroke = defaultBorderColor(p);
//     let sw = p.type === "road" ? 0 : p.type === "plot" ? 0.22 : 0.25;
//     const ink = p.type === "plot" ? (isLightColor(fill) ? "#1A1208" : "#FFFFFF") : labelInkFor(p);

//     if (p.type === "plot") {
//       if (roadHi.keys.has(key)) {
//         fill = roadHi.type === "12m" ? AC.hi12m : AC.hi9m;
//         stroke = fill;
//         sw = 0.45;
//       } else if (typeFilter === "category" && normalizeStatus(p.status) === category) {
//         stroke = isTokenStatus(category) ? AC.token : "#FFFFFF";
//         sw = 0.5;
//       }
//       if (advMatch.has(key)) { stroke = "#18FFFF"; sw = 0.45; }
//     }
//     return { fill, stroke, sw, ink: p.type === "plot" && fill !== plotFillColor(p, mapId) ? "#FFFFFF" : ink };
//   }, [mapId, roadHi, typeFilter, category, advMatch]);

//   const opacityFor = useCallback((p, base) => {
//     let o = base;
//     if (advMatch.size && p.type === "plot" && !advMatch.has(plotKey(p))) o = 0.14;
//     if (roadHi.keys.size && p.type === "plot" && !roadHi.keys.has(plotKey(p))) o = 0.18;
//     if (typeFilter === "plot" && p.type !== "plot") o = 0.16;
//     if (typeFilter === "road" && p.type !== "road") o = 0.16;
//     if (typeFilter === "open_space" && !isOpenSpaceType(p)) o = 0.16;
//     if (typeFilter === "amenity" && !isAmenityPlot(p)) o = 0.16;
//     if (typeFilter === "category" && (p.type !== "plot" || normalizeStatus(p.status) !== category)) o = 0.16;
//     return o;
//   }, [advMatch, roadHi, typeFilter, category]);

//   /* ── Interactions ── */
//   const onPlotClick = useCallback((p) => {
//     if (p.type === "road") {
//       // tap a road → highlight every plot on that road width (12 m / 9 m); tap again to clear
//       clearSelection();
//       const width = detectRoadWidth(p);
//       setRoadHi((cur) => {
//         if (cur.type === width && cur.keys.size) return { type: null, keys: new Set() };
//         const keys = new Set(
//           plots.filter((x) => x.type === "plot" && (width === "12m" ? is12mRoadPlot(x) : !is12mRoadPlot(x))).map(plotKey),
//         );
//         return { type: width, keys };
//       });
//       return;
//     }
//     setHighlight(p);
//     setSelected(p);
//     flyToPlot(p, FLY_MS);
//   }, [plots, flyToPlot, clearSelection]);

//   const doSearch = () => {
//     const q = query.trim().toLowerCase();
//     if (!q) return clearSelection();
//     const hit = plots.find(
//       (p) => (p.plotNo || "").toLowerCase() === q || (p.srNo || "").toLowerCase() === q || (p.title || "").toLowerCase().includes(q),
//     );
//     if (!hit) return toast("No match found", { error: true });
//     setHighlight(hit);
//     setSelected(hit);
//     flyToPlot(hit, FLY_MS);
//   };

//   const pickType = (k) => {
//     setTypeFilter(k);
//     setCategory(null);
//     setRoadHi({ type: null, keys: new Set() });
//     if (k === "all") fitAll();
//   };
//   const pickCategory = (s) => {
//     setTypeFilter("category");
//     setCategory(s);
//     setRoadHi({ type: null, keys: new Set() });
//     const list = plots.filter((p) => p.type === "plot" && normalizeStatus(p.status) === s);
//     if (list.length) fitPlots(list);
//   };

//   const applyAdv = () => {
//     let minA = parseFloat(adv.min), maxA = parseFloat(adv.max);
//     if (!isNaN(minA) && !isNaN(maxA) && minA > maxA) [minA, maxA] = [maxA, minA];
//     const isFt = adv.unit === "ft²";
//     const hasArea = !isNaN(minA) || !isNaN(maxA);
//     if (!hasArea && adv.facing === "All" && adv.status === "All" && adv.road === "All" && adv.rl === "All") {
//       setAdvMatch(new Set());
//       setShowAdv(false);
//       return;
//     }
//     const matched = plots.filter((p) => {
//       if (p.type !== "plot") return false;
//       const val = isFt ? p.areaSqFt || p.area * SQFT : p.area;
//       if (!isNaN(minA) && val < minA) return false;
//       if (!isNaN(maxA) && val > maxA) return false;
//       if (adv.facing !== "All" && !(p.facing || "").toLowerCase().includes(adv.facing.toLowerCase())) return false;
//       if (adv.status !== "All" && normalizeStatus(p.status) !== adv.status) return false;
//       if (adv.road === "12m" && !is12mRoadPlot(p)) return false;
//       if (adv.road === "9m" && is12mRoadPlot(p)) return false;
//       const approved = (p.contactPhone || "").trim().toLowerCase() === "approved";
//       if (adv.rl === "Approved" && !approved) return false;
//       if (adv.rl === "Not Approved" && approved) return false;
//       return true;
//     });
//     setAdvMatch(new Set(matched.map(plotKey)));
//     setShowAdv(false);
//     if (matched.length) fitPlots(matched);
//     else toast("No plots match these filters");
//   };
//   const clearAdv = () => { setAdv(DEFAULT_ADV); setAdvMatch(new Set()); };

//   const highlightKey = highlight ? plotKey(highlight) : null;

//   if (loading) return <CenterSpinner />;
//   if (!mapDoc) {
//     return (
//       <div className="center-fill">
//         <p>Map not found.</p>
//         {!publicView && <button className="btn btn-primary" onClick={() => nav("/")}>Back</button>}
//       </div>
//     );
//   }
//   if (loadError) {
//     return (
//       <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "#0B0E13", color: "#E68A72", fontFamily: MONO, padding: 24, textAlign: "center" }}>
//         <div>
//           <h3 style={{ color: INK, marginBottom: 8 }}>Google Maps failed to load</h3>
//           <p style={{ color: MUTED, fontSize: 13 }}>Check VITE_GOOGLE_MAPS_API_KEY and disable any ad-blocker.</p>
//         </div>
//       </div>
//     );
//   }

//   const center = plots[0]?.center ?? boundary[0] ?? { lat: 21.1458, lng: 79.0882 };
//   const circleBtn = {
//     width: 44, height: 44, display: "grid", placeItems: "center", padding: 0, background: CANVAS,
//     border: `1px solid ${HAIR}`, borderRadius: 22, cursor: "pointer", boxShadow: "0 10px 28px rgba(31, 41, 55, 0.2)",
//   };
//   const zoomBtn = {
//     width: 42, height: 42, font: `500 18px/1 ${MONO}`, color: INK, background: CANVAS,
//     border: `1px solid ${HAIR}`, borderRadius: 12, cursor: "pointer", display: "grid",
//     placeItems: "center", boxShadow: "0 10px 28px rgba(31, 41, 55, 0.2)",
//   };
//   const inputStyle = {
//     font: `400 13px/1 ${MONO}`, color: INK, background: SOFT,
//     border: `1px solid ${HAIR}`, borderRadius: 9, padding: "10px", width: "100%",
//     boxSizing: "border-box", outline: "none",
//   };

//   return (
//     <div className="ref-map-page">
//       <style>{`
//         .ref-map-page { position: fixed; inset: 0; overflow: hidden; background: #0B0E13; font-family: ${SANS}; color: ${INK}; user-select: none; }
//         path.plan-plot-shape { cursor: pointer; transition: fill-opacity 120ms ease, stroke-width 120ms ease; }
//         path.plan-plot-shape:hover { fill-opacity: 0.78; }
//         .ref-hud-top { position: absolute; top: 14px; left: 14px; right: 14px; z-index: 10; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
//         .ref-topbar { pointer-events: auto; display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: ${CANVAS}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid ${HAIR}; border-radius: 14px; box-shadow: 0 18px 42px rgba(31, 41, 55, 0.2); flex-wrap: wrap; }
//         .ref-icon-btn { width: 38px; height: 38px; border-radius: 10px; background: ${SOFT}; border: 1px solid ${HAIR}; color: ${INK}; display: grid; place-items: center; cursor: pointer; transition: border-color 150ms ease, color 150ms ease; flex-shrink: 0; }
//         .ref-icon-btn:hover { border-color: ${ACCENT}; color: ${ACCENT}; }
//         .ref-icon-btn.active { background: ${GRAD}; border-color: ${ACCENT}; color: #FFFFFF; }
//         .ref-search { flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px; background: ${SOFT}; border: 1px solid ${HAIR}; border-radius: 10px; padding: 4px 6px 4px 12px; }
//         .ref-search:focus-within { border-color: ${ACCENT}; }
//         .ref-search input { flex: 1; background: transparent; border: none; outline: none; color: ${INK}; font: 400 13px/1 ${MONO}; padding: 6px 0; min-width: 0; }
//         .ref-search input::placeholder { color: ${MUTED}; }
//         .ref-find-btn { font: 600 12px/1 ${MONO}; background: ${GRAD}; color: #FFFFFF; border: none; border-radius: 7px; padding: 7px 12px; cursor: pointer; }
//         .ref-chips-row { pointer-events: auto; display: flex; align-items: center; gap: 7px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
//         .ref-chips-row::-webkit-scrollbar { display: none; }
//         .ref-pill { font: 500 12px/1 ${MONO}; color: ${INK}; background: ${PANEL}; border: 1px solid ${HAIR}; border-radius: 999px; padding: 8px 14px; cursor: pointer; white-space: nowrap; box-shadow: 0 8px 20px rgba(31, 41, 55, 0.2); transition: all 150ms ease; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; min-height: 32px; box-sizing: border-box; }
//         .ref-pill:hover { border-color: ${ACCENT}; }
//         .ref-switch { gap: 8px; }
//         .ref-switch-track { position: relative; width: 28px; height: 16px; border-radius: 999px; background: rgba(26, 26, 46, 0.22); transition: background 150ms ease; flex-shrink: 0; }
//         .ref-switch-knob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform 150ms ease; }
//         .ref-switch.on .ref-switch-track { background: rgba(255, 255, 255, 0.45); }
//         .ref-switch.on .ref-switch-knob { transform: translateX(12px); }
//         .ref-pill.on { color: #FFFFFF; background: ${GRAD}; border-color: ${ACCENT}; font-weight: 700; }
//         @media (max-width: 768px) {
//           .ref-hud-top { top: 8px; left: 8px; right: 8px; gap: 6px; }
//           .ref-topbar { padding: 8px 10px; gap: 8px; border-radius: 12px; }
//           .ref-icon-btn { width: 36px; height: 36px; }
//           .ref-topbar > div:nth-child(2) { display: none; }
//           .ref-search { padding: 0 10px; height: 36px; }
//           .ref-search input { font-size: 14px; }
//           .ref-find-btn { padding: 5px 10px; }
//           .mv-status-legend { left: 8px !important; right: 8px !important; bottom: 8px !important; max-width: none !important; width: calc(100vw - 16px) !important; flex-wrap: nowrap !important; overflow-x: auto !important; padding: 6px 10px !important; border-radius: 10px !important; gap: 6px 14px !important; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
//           .mv-status-legend::-webkit-scrollbar { display: none; }
//           .mv-status-item { flex-shrink: 0; gap: 5px !important; }
//           .mv-controls { top: 112px !important; right: 8px !important; transform: scale(0.9); transform-origin: top right; }
//         }
//       `}</style>

//       {/* ── Google Map base ── */}
//       {isLoaded && (
//         <GoogleMap
//           mapContainerStyle={{ position: "absolute", inset: 0 }}
//           center={center}
//           zoom={18.5}
//           onLoad={onLoad}
//           onIdle={onIdle}
//           options={{
//             mapTypeId: "hybrid", isFractionalZoomEnabled: true, streetViewControl: false,
//             fullscreenControl: false, mapTypeControl: false, rotateControl: false, zoomControl: false,
//             gestureHandling: "greedy", maxZoom: MAP_MAX_Z, backgroundColor: "#0B0E13",
//           }}
//           onClick={() => { if (selected || highlight) clearSelection(); }}
//         />
//       )}

//       {/* ── SVG masterplan portal ── */}
//       {overlayPortalRef.current?.div && layout &&
//         createPortal(
//           <svg
//             viewBox={`${layout.x0} ${layout.y0} ${layout.w} ${layout.h}`}
//             width="100%" height="100%" preserveAspectRatio="none"
//             style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}
//           >
//             <MasterplanSvgContent
//               layout={layout}
//               highlightKey={highlightKey}
//               styleFor={styleFor}
//               opacityFor={opacityFor}
//               onPlotClick={onPlotClick}
//             />
//           </svg>,
//           overlayPortalRef.current.div,
//         )}

//       {/* ── HUD: top bar + category pills ── */}
//       <div className="ref-hud-top">
//         <div className="ref-topbar">
//           {!publicView && (
//             <button className="ref-icon-btn" onClick={() => nav(-1)} title="Back"><ArrowLeft size={18} /></button>
//           )}
//           <div style={{ minWidth: 140 }}>
//             <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: ACCENT }}>MASTERPLAN</div>
//             <div style={{ fontSize: 15, fontWeight: 700, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 240 }}>
//               {mapDoc?.name || "Layout Map"}
//             </div>
//           </div>

//           <div className="ref-search">
//             <Search size={15} color={MUTED} />
//             <input
//               placeholder="Search plot no / sr no / title…"
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && doSearch()}
//             />
//             {query && (
//               <button
//                 onClick={() => { setQuery(""); clearSelection(); }}
//                 style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", display: "grid", placeItems: "center" }}
//               >
//                 <X size={14} />
//               </button>
//             )}
//             <button className="ref-find-btn" onClick={doSearch}>Find</button>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <button className={`ref-icon-btn ${showAdv || advMatch.size > 0 ? "active" : ""}`} title="Filters" onClick={() => setShowAdv(!showAdv)}>
//               <SlidersHorizontal size={17} />
//             </button>
//             <button className="ref-icon-btn" title="Fit Full Layout" onClick={() => { clearSelection(); fitAll(); }}>
//               <Maximize2 size={17} />
//             </button>
//             <button className="ref-icon-btn" title="Area Details" onClick={() => setShowArea(true)}>
//               <Info size={17} />
//             </button>
//             <button className="ref-icon-btn" title="Share layout" aria-label="Share layout" onClick={() => setShowShare(true)}>
//               <Share2 size={17} />
//             </button>
//           </div>
//         </div>

//         <div className="ref-chips-row">
//           {!publicView && (
//             <button
//               type="button"
//               role="switch"
//               aria-checked={showStatus}
//               title={showStatus ? "Hide sale status" : "Show sale status"}
//               className={`ref-pill ref-switch ${showStatus ? "on" : ""}`}
//               onClick={toggleStatus}
//             >
//               <span>Status</span>
//               <span className="ref-switch-track"><span className="ref-switch-knob" /></span>
//               <span>{showStatus ? "ON" : "OFF"}</span>
//             </button>
//           )}
//           {[
//             ["all", `All (${plots.length})`],
//             ["plot", `Plots (${count("plot")})`],
//             ["road", "Roads"],
//             ["open_space", "Open Spaces"],
//             ["amenity", "Amenities"],
//           ].map(([k, l]) => (
//             <button key={k} className={`ref-pill ${typeFilter === k ? "on" : ""}`} onClick={() => pickType(k)}>{l}</button>
//           ))}
//           {statuses.map((s) => (
//             <button key={s} className={`ref-pill ${typeFilter === "category" && category === s ? "on" : ""}`} onClick={() => pickCategory(s)}>
//               {s} ({countStatus(s)})
//             </button>
//           ))}
//           {roadHi.type && (
//             <button className="ref-pill on" style={{ background: roadHi.type === "12m" ? AC.hi12m : AC.hi9m, borderColor: "transparent", color: "#fff" }}
//               onClick={() => setRoadHi({ type: null, keys: new Set() })}>
//               {roadHi.type} road plots ({roadHi.keys.size}) ✕
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ── Filter panel ── */}
//       {showAdv && (
//         <div
//           role="dialog" aria-label="Filter plots" onPointerDown={(e) => e.stopPropagation()}
//           style={{
//             position: "absolute", top: 122, left: 14, zIndex: 12, width: 320, maxWidth: "calc(100vw - 28px)",
//             maxHeight: "calc(100vh - 150px)", display: "flex", flexDirection: "column", background: CANVAS,
//             backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid ${HAIR}`,
//             borderRadius: 14, boxShadow: "0 22px 54px rgba(31, 41, 55, 0.2)", overflow: "hidden",
//           }}
//         >
//           <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 11px", borderBottom: `1px solid ${HAIR}` }}>
//             <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT }}>Filters</div>
//             <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//               {advMatch.size > 0 && (
//                 <span style={{ fontFamily: MONO, fontSize: 11, color: INK, background: SOFT, padding: "4px 8px", borderRadius: 6 }}>
//                   {advMatch.size} matched
//                 </span>
//               )}
//               <button onClick={() => setShowAdv(false)} style={{ font: `400 18px/1 ${MONO}`, color: MUTED, background: "none", border: "none", cursor: "pointer" }}>&times;</button>
//             </div>
//           </header>

//           <div style={{ display: "grid", gap: 16, padding: 16, overflowY: "auto" }}>
//             <div style={{ display: "grid", gap: 9 }}>
//               <div style={sectionLabel}>Area Range ({adv.unit})</div>
//               <div style={{ display: "flex", gap: 7 }}>
//                 {["m²", "ft²"].map((u) => (
//                   <button key={u} type="button" onClick={() => setAdv({ ...adv, unit: u })}
//                     style={{
//                       font: `500 12px/1 ${MONO}`, color: adv.unit === u ? "#FFFFFF" : INK,
//                       background: adv.unit === u ? ACCENT : SOFT,
//                       border: `1px solid ${adv.unit === u ? ACCENT : HAIR}`, borderRadius: 999,
//                       padding: "7px 13px", cursor: "pointer",
//                     }}>
//                     {u}
//                   </button>
//                 ))}
//               </div>
//               <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
//                 <input type="number" placeholder="Min" value={adv.min} onChange={(e) => setAdv({ ...adv, min: e.target.value })} style={inputStyle} />
//                 <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>to</span>
//                 <input type="number" placeholder="Max" value={adv.max} onChange={(e) => setAdv({ ...adv, max: e.target.value })} style={inputStyle} />
//               </div>
//             </div>

//             <PillGroup title="Road Width" options={["All", "12m", "9m"]} value={adv.road} onChange={(v) => setAdv({ ...adv, road: v })} />
//             <PillGroup title="Facing" options={FACINGS} value={adv.facing} onChange={(v) => setAdv({ ...adv, facing: v })} />
//             {!hideStatus && (
//               <>
//                 <PillGroup title="Status" options={["All", ...statuses]} value={adv.status} onChange={(v) => setAdv({ ...adv, status: v })} />
//                 <PillGroup title="RL Approval" options={["All", "Approved", "Not Approved"]} value={adv.rl} onChange={(v) => setAdv({ ...adv, rl: v })} />
//               </>
//             )}
//           </div>

//           <footer style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 9, padding: 12, borderTop: `1px solid ${HAIR}` }}>
//             <button type="button" onClick={clearAdv} style={{ font: `500 13px/1 ${MONO}`, color: INK, background: "transparent", border: `1px solid ${HAIR}`, borderRadius: 10, padding: "11px 0", cursor: "pointer" }}>Clear</button>
//             <button type="button" onClick={applyAdv} style={{ font: `600 13px/1 ${MONO}`, color: "#FFFFFF", background: GRAD, border: `1px solid ${ACCENT}`, borderRadius: 10, padding: "11px 0", cursor: "pointer" }}>Apply</button>
//           </footer>
//         </div>
//       )}

//       {/* ── Compass + zoom controls ── */}
//       <div className="mv-controls" style={{ position: "absolute", zIndex: 8, right: 14, top: 122, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
//         <button type="button" title="Face north & fit layout" onClick={resetNorth} style={circleBtn}>
//           <svg width="26" height="26" viewBox="-13 -13 26 26">
//             <g ref={compassNeedleRef} style={{ transformOrigin: "50% 50%", willChange: "transform" }}>
//               <path d="M0 -9 L4.5 1.5 L0 -0.8 Z" fill={ACCENT} />
//               <path d="M0 -9 L-4.5 1.5 L0 -0.8 Z" fill={ACCENT} fillOpacity="0.55" />
//               <path d="M0 9 L4.5 -1.5 L0 0.8 Z" fill="#9CA3AF" />
//               <path d="M0 9 L-4.5 -1.5 L0 0.8 Z" fill="#9CA3AF" fillOpacity="0.55" />
//             </g>
//             <text x="0" y="-9.5" textAnchor="middle" fill={INK} fontFamily={MONO} fontSize="7" fontWeight="700">N</text>
//           </svg>
//         </button>
//         <button type="button" title="Zoom in" onClick={() => nudgeZoom(ZOOM_STEP)} style={zoomBtn}>+</button>
//         <button type="button" title="Zoom out" onClick={() => nudgeZoom(-ZOOM_STEP)} style={zoomBtn}>−</button>
//         {selected && (
//           <button type="button" title="Refit selected plot" onClick={() => flyToPlot(selected, 320)} style={{ ...zoomBtn, color: ACCENT }}>⌂</button>
//         )}
//       </div>

//       {/* ── Status legend (bottom-left) ── */}
//       {!hideStatus && (
//         <div
//           className="mv-status-legend"
//           style={{
//             position: "absolute", left: 14, bottom: 14, zIndex: 8, display: "flex", flexWrap: "wrap",
//             alignItems: "center", gap: "10px 14px", padding: "10px 14px", background: PANEL,
//             backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${HAIR}`,
//             borderRadius: 12, boxShadow: "0 10px 30px rgba(31, 41, 55, 0.2)", maxWidth: "calc(100vw - 220px)",
//           }}
//         >
//           {STATUS_LEGEND.map(([color, label]) => {
//             const cnt = countStatus(label);
//             return (
//               <div key={label} className="mv-status-item" style={{ display: "flex", alignItems: "center", gap: 7 }}>
//                 <span style={{ width: 12, height: 12, borderRadius: 3, background: color, border: `1px solid ${HAIR}`, boxSizing: "border-box" }} />
//                 <span style={{ font: `500 12px/1 ${MONO}`, color: INK, whiteSpace: "nowrap" }}>{label}</span>
//                 {cnt > 0 && (
//                   <span style={{ font: `500 11px/1 ${MONO}`, color: MUTED, background: SOFT, padding: "3px 6px", borderRadius: 5 }}>{cnt}</span>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* ── Selected plot inspector ── */}
//       {selected && (
//         <PlotViewSheet
//           plot={hideStatus ? { ...selected, status: "" } : selected}
//           mapId={mapId}
//           mapName={mapDoc?.name ?? ""}
//           user={viewer}
//           hideStatus={hideStatus}
//           onClose={clearSelection}
//         />
//       )}

//       {/* ── Area details ── */}
//       {showArea && (
//         <GlassModal
//           title="Area Details"
//           onClose={() => setShowArea(false)}
//           actions={<button style={glassBtn(true)} onClick={() => setShowArea(false)}>Close</button>}
//         >
//           {[
//             ["Total Area", mapDoc?.totalArea ?? "0"],
//             ["Total Plots", mapDoc?.totalPlots ?? count("plot")],
//             ["Total Roads", mapDoc?.totalRoads ?? count("road")],
//             ["Total Open Spaces", mapDoc?.totalOpenSpaces ?? count("open_space")],
//           ].map(([k, v]) => (
//             <div style={kvRow} key={k}><span style={{ color: MUTED }}>{k}</span><b>{String(v)}</b></div>
//           ))}
//           {!hideStatus && statuses.length > 0 && (
//             <>
//               <div style={{ ...sectionLabel, margin: "14px 0 4px" }}>Plots by status</div>
//               {statuses.map((s) => (
//                 <div style={kvRow} key={s}>
//                   <span style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED }}>
//                     <span style={{ width: 10, height: 10, borderRadius: 3, background: statusColor(s) }} />{s}
//                   </span>
//                   <b>{countStatus(s)}</b>
//                 </div>
//               ))}
//             </>
//           )}
//         </GlassModal>
//       )}

//       {/* ── Share ── */}
//       {showShare && (
//         <GlassModal
//           title="Share this layout"
//           onClose={() => setShowShare(false)}
//           actions={<button style={glassBtn(true)} onClick={() => setShowShare(false)}>Done</button>}
//         >
//           <p style={{ marginTop: 0, color: MUTED, fontSize: 13 }}>Anyone with this link can view the layout. No login needed.</p>
//           <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} style={{ ...inputStyle, userSelect: "text" }} />
//           <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
//             <button style={glassBtn(true)} onClick={copyLink}><Copy size={15} /> Copy link</button>
//             <a style={{ ...glassBtn(false), color: "#16A34A", borderColor: "rgba(22,163,74,.4)" }} href={whatsappUrl} target="_blank" rel="noreferrer">
//               <MessageCircle size={15} /> WhatsApp
//             </a>
//             {navigator.share && (
//               <button style={glassBtn(false)} onClick={nativeShare}><Share2 size={15} /> More…</button>
//             )}
//           </div>
//         </GlassModal>
//       )}
//     </div>
//   );
// }



// import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { createPortal } from "react-dom";
// import { useNavigate, useParams } from "react-router-dom";
// import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
// import { ArrowLeft, Info, SlidersHorizontal, Search, X, Maximize2, Share2, Copy, MessageCircle } from "lucide-react";
// import { useSession } from "../context/SessionContext";
// import { getMap, watchMap } from "../services/mapService";
// import { plotFromDoc } from "../models/plot";
// import { CenterSpinner } from "../components/Common";
// import { useToast } from "../components/Toast";
// import PlotViewSheet from "./PlotDetails";
// import SelectedDimensionOverlay from "../components/SelectedDimensionOverlay";
// import {
//   SQFT, getBounds, createLocalProjection, ptsToPath, computeFeatureMetrics, placeRoadLabels, fitPlotLabel,
// } from "../utils/planGeometry";
// import {
//   AC, STATUS_LEGEND, defaultBorderColor, detectRoadWidth, is12mRoadPlot, isAmenityPlot,
//   isLightColor, isOpenSpaceType, isTokenStatus, labelInkFor, normalizeStatus, plotFillColor,
//   statusColor,
// } from "../utils/plotHelpers";

// /* ── HUD theme — same indigo/violet brand + white card look as the rest of the app.
//    Plot/map colours live in AC (utils/plotHelpers). ── */
// const CANVAS = "rgba(255, 255, 255, 0.94)";
// const PANEL = "rgba(255, 255, 255, 0.92)";
// const HAIR = "rgba(26, 26, 46, 0.12)";

// const ACCENT = "#4F46E5";
// const GRAD = "linear-gradient(135deg, #4F46E5, #7C3AED)";
// const SOFT = "rgba(79, 70, 229, 0.07)"; // subtle tinted fill for inputs / idle buttons
// const MUTED = "#6B7280";
// const INK = "#1A1A2E";
// const BOUNDARY_STROKE = "#C7D2FE"; // layout outline drawn on the dark map canvas
// const SELECTED_STROKE = "#E9C6F2";
// const SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
// const MONO = "'JetBrains Mono', 'SF Mono', Consolas, monospace";
// const UNIFORM_PLOT_FONT_SIZE = 1.95; // metres — same size for every plot number

// /* ── Camera & animation ── */
// const FLY_MS = 780;
// const ZOOM_STEP = 0.75;
// const ZOOM_STEP_MS = 220;
// const FLY_MIN_Z = 18.5;
// const FLY_MAX_Z = 22.2;
// const LAYOUT_ZOOM_BOOST = 0.6;
// const LAYOUT_MIN_ZOOM = 18.2;
// const MAP_MAX_Z = 24;
// const easeOut = (t) => 1 - (1 - t) ** 3;
// const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// const FACINGS = ["All", "North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"];
// const LIBRARIES = [];
// const PUBLIC_USER = { uid: "public", name: "Visitor", role: "guest" };
// const plotKey = (p) => p.srNo || p.plotNo || p.title;
// const DEFAULT_ADV = { min: "", max: "", facing: "All", status: "All", road: "All", rl: "All", unit: "m²" };

// /* ── Masterplan SVG ─────────────────────────────────────────────────────── */
// const MasterplanSvgContent = memo(function MasterplanSvgContent({
//   layout, highlightKey, styleFor, opacityFor, onPlotClick,
// }) {
//   const selectedFeature = useMemo(
//     () => (highlightKey ? layout.features.find((f) => f.key === highlightKey) : null),
//     [layout, highlightKey],
//   );

//   return (
//     <g>
//       {/* Layout boundary base */}
//       {layout.boundaryD && (
//         <path
//           d={layout.boundaryD}
//           fill={AC.canvas}
//           fillOpacity="1"
//           stroke={BOUNDARY_STROKE}
//           strokeWidth="0.45"
//           strokeDasharray="1.8 1.2"
//           style={{ pointerEvents: "none" }}
//         />
//       )}

//       {/* Polygons: roads → open spaces → plots */}
//       <g>
//         {layout.sorted.map((f) => {
//           const isSel = highlightKey === f.key;
//           const isRoad = f.raw.type === "road";
//           const st = styleFor(f.raw);
//           const baseAlpha = isRoad ? 1 : highlightKey && !isSel ? 0.52 : 0.96;
//           const alpha = opacityFor(f.raw, baseAlpha);
//           return (
//             <path
//               key={f.rk}
//               className="plan-plot-shape"
//               d={f.d}
//               fill={isSel ? AC.selected : st.fill}
//               fillRule="evenodd"
//               fillOpacity={isSel ? 0.96 : alpha}
//               stroke={isSel ? SELECTED_STROKE : st.stroke}
//               strokeWidth={isSel ? 0.55 : st.sw}
//               strokeOpacity={isRoad ? 0 : alpha < 0.4 ? 0.35 : 0.95}
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onPlotClick(f.raw);
//               }}
//             />
//           );
//         })}
//       </g>

//       {/* Plot numbers */}
//       <g style={{ pointerEvents: "none" }}>
//         {layout.plotFeatures.map((f) => {
//           if (f.key === highlightKey || !f.label) return null;
//           const st = styleFor(f.raw);
//           const alpha = opacityFor(f.raw, highlightKey ? 0.55 : 1);
//           const nl = f.numLabel || { x: f.cx, y: f.cy, angle: 0, size: f.fontSize };
//           return (
//             <text
//               key={`num-${f.rk}`}
//               x={nl.x}
//               y={nl.y}
//               textAnchor="middle"
//               dy="0.35em"
//               fontFamily={SANS}
//               fontSize={nl.size}
//               fontWeight="700"
//               fill={st.ink}
//               fillOpacity={alpha < 0.4 ? 0.28 : alpha}
//               transform={nl.angle ? `rotate(${nl.angle.toFixed(1)} ${nl.x.toFixed(2)} ${nl.y.toFixed(2)})` : undefined}
//             >
//               {f.label}
//             </text>
//           );
//         })}
//       </g>

//       {/* Road & open-space labels (rotated along the feature) */}
//       <g style={{ pointerEvents: "none" }}>
//         {layout.zoneFeatures.map((f) => {
//           if (!f.label) return null;
//           const isRoad = f.raw.type === "road";
//           const rl = isRoad ? f.roadLabel : null;
//           if (isRoad && !rl) return null;
//           const size = rl ? rl.size : Math.min(Math.max(f.ir * 0.32, 1.15), 3.2);
//           if (size < 1.0) return null;
//           const lx = rl ? rl.x : f.cx;
//           const ly = rl ? rl.y : f.cy;
//           const lang = rl ? rl.angle : f.angle;
//           const alpha = opacityFor(f.raw, highlightKey ? 0.5 : 1);
//           return (
//             <g
//               key={`lbl-${f.rk}`}
//               paintOrder="stroke"
//               stroke="rgba(15, 18, 24, 0.75)"
//               strokeWidth={size * 0.14}
//               transform={`rotate(${lang.toFixed(1)} ${lx.toFixed(2)} ${ly.toFixed(2)})`}
//               opacity={alpha < 0.4 ? 0.25 : alpha}
//             >
//               <text
//                 x={lx}
//                 y={isRoad ? ly : ly - size * 0.35}
//                 textAnchor="middle"
//                 dy="0.35em"
//                 fontFamily={SANS}
//                 fontSize={size}
//                 letterSpacing={isRoad ? "0.04em" : "0.06em"}
//                 fill={isRoad ? AC.roadLabelInk : labelInkFor(f.raw)}
//                 fontWeight="700"
//               >
//                 {f.label}
//               </text>
//               {!isRoad && f.raw.area > 120 && (
//                 <text
//                   x={lx}
//                   y={ly + size * 0.75}
//                   textAnchor="middle"
//                   dy="0.35em"
//                   fontFamily={MONO}
//                   fontSize={size * 0.64}
//                   fill={labelInkFor(f.raw)}
//                   fontWeight="600"
//                 >
//                   {Math.round(f.raw.area).toLocaleString("en-IN")} m²
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </g>

//       {/* Raised selected plot + engineering dimensions */}
//       {selectedFeature && (
//         <g style={{ pointerEvents: "none" }}>
//           <path d={selectedFeature.d} fill={AC.selected} fillOpacity="0.94" stroke={SELECTED_STROKE} strokeWidth="0.65" />
//           <SelectedDimensionOverlay feature={selectedFeature} />
//         </g>
//       )}
//     </g>
//   );
// });

// /* ── Small dark-glass building blocks ───────────────────────────────────── */
// const sectionLabel = {
//   fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED,
// };

// function PillGroup({ title, options, value, onChange }) {
//   return (
//     <div style={{ display: "grid", gap: 9 }}>
//       <div style={sectionLabel}>{title}</div>
//       <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
//         {options.map((o) => {
//           const on = value === o;
//           return (
//             <button
//               key={o}
//               type="button"
//               onClick={() => onChange(o)}
//               style={{
//                 font: `500 12px/1 ${MONO}`, color: on ? "#FFFFFF" : INK,
//                 background: on ? ACCENT : SOFT,
//                 border: `1px solid ${on ? ACCENT : HAIR}`, borderRadius: 999,
//                 padding: "8px 12px", cursor: "pointer",
//               }}
//             >
//               {o}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function GlassModal({ title, onClose, children, actions }) {
//   return (
//     <div
//       onClick={onClose}
//       style={{
//         position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.55)",
//         display: "grid", placeItems: "center", padding: 16,
//       }}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         style={{
//           width: 380, maxWidth: "100%", background: CANVAS, backdropFilter: "blur(18px)",
//           WebkitBackdropFilter: "blur(18px)", border: `1px solid ${HAIR}`, borderRadius: 16,
//           boxShadow: "0 24px 60px rgba(0,0,0,.6)", color: INK, fontFamily: SANS, padding: 18,
//         }}
//       >
//         <div style={{ ...sectionLabel, color: ACCENT, fontSize: 13, marginBottom: 12 }}>{title}</div>
//         {children}
//         {actions && <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>{actions}</div>}
//       </div>
//     </div>
//   );
// }

// const glassBtn = (primary) => ({
//   font: `600 13px/1 ${MONO}`, color: primary ? "#FFFFFF" : INK,
//   background: primary ? GRAD : "transparent", border: `1px solid ${primary ? ACCENT : HAIR}`,
//   borderRadius: 10, padding: "11px 16px", cursor: "pointer", display: "inline-flex",
//   alignItems: "center", gap: 8, textDecoration: "none",
// });

// const kvRow = { display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, borderBottom: `1px solid ${HAIR}` };

// /* ── Main screen ────────────────────────────────────────────────────────── */
// export default function MapViewerScreen({ publicView = false }) {
//   const { mapId } = useParams();
//   const { user } = useSession();
//   const viewer = publicView ? PUBLIC_USER : user;
//   // Status toggle: ON = plots coloured by sale status; OFF = neutral plots, no status UI.
//   // (Public share view is always OFF.) The choice is remembered on this device.
//   const [showStatus, setShowStatus] = useState(() => {
//     if (publicView) return false;
//     try { return localStorage.getItem("mv_show_status") !== "0"; } catch { return true; }
//   });
//   const hideStatus = publicView || !showStatus;
//   const nav = useNavigate();
//   const toast = useToast();

//   const mapRef = useRef(null);
//   const flyRafRef = useRef(0);
//   const initialFitDoneRef = useRef(false);
//   const overlayPortalRef = useRef(null);
//   const compassNeedleRef = useRef(null);
//   const lastPlotsJson = useRef("");
//   const [, setOverlayReady] = useState(0);
//   const [mapReady, setMapReady] = useState(false);

//   const { isLoaded, loadError } = useJsApiLoader({
//     googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
//     libraries: LIBRARIES,
//   });

//   const [mapDoc, setMapDoc] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [typeFilter, setTypeFilter] = useState("all");
//   const [category, setCategory] = useState(null);
//   const [query, setQuery] = useState("");
//   const [highlight, setHighlight] = useState(null);
//   const [selected, setSelected] = useState(null);
//   const [showAdv, setShowAdv] = useState(false);
//   const [adv, setAdv] = useState(DEFAULT_ADV);
//   const [advMatch, setAdvMatch] = useState(new Set());
//   const [roadHi, setRoadHi] = useState({ type: null, keys: new Set() });
//   const [showArea, setShowArea] = useState(false);
//   const [showShare, setShowShare] = useState(false);

//   /* ── data: initial load, then live updates (e.g. someone books a plot) ── */
//   useEffect(() => {
//     initialFitDoneRef.current = false;
//     lastPlotsJson.current = "";
//     let off = () => {};
//     let cancelled = false;
//     const apply = (m) => {
//       const json = JSON.stringify(m.plots ?? []);
//       if (json === lastPlotsJson.current) return; // nothing changed → keep layout memo
//       lastPlotsJson.current = json;
//       setMapDoc(m);
//     };
//     getMap(mapId)
//       .then((m) => {
//         if (cancelled) return;
//         if (m) {
//           apply(m);
//           off = watchMap(mapId, apply);
//         }
//       })
//       .catch((e) => console.error("Error loading map data:", e))
//       .finally(() => !cancelled && setLoading(false));
//     return () => { cancelled = true; off(); };
//   }, [mapId]);

//   useEffect(() => () => cancelAnimationFrame(flyRafRef.current), []);

//   const plots = useMemo(
//     () =>
//       (mapDoc?.plots ?? []).map((raw) => {
//         const p = plotFromDoc(raw);
//         // public share view never reveals sale status
//         return hideStatus && p.type === "plot" ? { ...p, status: "Available" } : p;
//       }),
//     [mapDoc, hideStatus],
//   );
//   const boundary = useMemo(
//     () => (mapDoc?.layoutBoundary ?? []).map((p) => ({ lat: +p.lat, lng: +p.lng })),
//     [mapDoc],
//   );

//   /* ── Share ── */
//   const shareUrl = `${window.location.origin}/share/${mapId}`;
//   const shareText = `${mapDoc?.name || "Layout"} — view the layout and plots`;
//   const copyLink = async () => {
//     try {
//       await navigator.clipboard.writeText(shareUrl);
//     } catch {
//       const t = document.createElement("textarea");
//       t.value = shareUrl;
//       document.body.appendChild(t);
//       t.select();
//       document.execCommand("copy");
//       t.remove();
//     }
//     toast("Link copied");
//   };
//   const nativeShare = () => navigator.share({ title: shareText, text: shareText, url: shareUrl }).catch(() => {});
//   const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;

//   /* ── derived lists ── */
//   const statuses = useMemo(
//     () => (hideStatus ? [] : [...new Set(plots.filter((p) => p.type === "plot").map((p) => normalizeStatus(p.status)))]),
//     [plots, hideStatus],
//   );
//   const count = useCallback((t) => plots.filter((p) => p.type === t).length, [plots]);
//   const countStatus = useCallback(
//     (s) => plots.filter((p) => p.type === "plot" && normalizeStatus(p.status) === s).length,
//     [plots],
//   );

//   /* ── Build the local-metre layout for the SVG overlay ── */
//   const layout = useMemo(() => {
//     const allPts = plots.length ? plots.flatMap((p) => p.corners || []) : boundary;
//     if (!allPts.length) return null;
//     const b = getBounds(allPts);
//     if (!b) return null;

//     const proj = createLocalProjection((b.north + b.south) / 2, (b.east + b.west) / 2);
//     let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
//     const track = ([x, y]) => {
//       if (x < minX) minX = x;
//       if (x > maxX) maxX = x;
//       if (y < minY) minY = y;
//       if (y > maxY) maxY = y;
//     };

//     const boundaryPts = boundary.map((c) => {
//       const pt = proj.toMeters(c.lat, c.lng);
//       track(pt);
//       return pt;
//     });

//     const features = plots.map((p, idx) => {
//       const pts = (p.corners || []).map((c) => {
//         const pt = proj.toMeters(c.lat, c.lng);
//         track(pt);
//         return pt;
//       });
//       const { cx, cy, ir, angle } = computeFeatureMetrics(pts);
//       const label = p.type === "plot" ? String(p.plotNo || "") : String(p.title || "");
//       return {
//         key: plotKey(p) || `f-${idx}`,
//         rk: `${plotKey(p) || "f"}~${idx}`,
//         raw: p, pts, d: ptsToPath(pts), cx, cy, ir, angle, label,
//         fontSize: UNIFORM_PLOT_FONT_SIZE,
//         numLabel: p.type === "plot" ? fitPlotLabel(pts, label, cx, cy, UNIFORM_PLOT_FONT_SIZE, angle) : null,
//       };
//     });


    
//     const roadLabels = placeRoadLabels(


      
//       features.map((f, i) => ({ key: i, pts: f.pts, label: f.label, type: f.raw.type })).filter((f) => f.type === "road"),
//       features.filter((f) => f.raw.type === "plot").map((f) => ({ pts: f.pts })),
//     );
//     features.forEach((f, i) => { f.roadLabel = roadLabels.get(i) || null; });

//     const orderScore = (t) => (t === "road" ? 0 : t === "plot" ? 2 : 1);
//     const sorted = [...features].sort((a, b2) => orderScore(a.raw.type) - orderScore(b2.raw.type));

//     const pad = 16;
//     const x0 = minX - pad, y0 = minY - pad, x1 = maxX + pad, y1 = maxY + pad;
//     return {
//       proj, x0, y0, x1, y1, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0),
//       northWestLL: proj.toLatLng(x0, y0), southEastLL: proj.toLatLng(x1, y1),
//       boundaryD: boundaryPts.length > 2 ? ptsToPath(boundaryPts) : "",
//       features, sorted,
//       plotFeatures: features.filter((f) => f.raw.type === "plot"),
//       zoneFeatures: features.filter((f) => f.raw.type !== "plot"),
//     };
//   }, [plots, boundary]);

//   /* ── Camera ── */
//   const animateCameraTo = useCallback((aimCenter, aimZoom, durationMs = FLY_MS) => {
//     const m = mapRef.current;
//     if (!m || !aimCenter) return;
//     cancelAnimationFrame(flyRafRef.current);
//     const c0 = m.getCenter();
//     if (!c0) {
//       m.setCenter(aimCenter);
//       if (aimZoom != null) m.setZoom(aimZoom);
//       return;
//     }
//     const startLat = c0.lat(), startLng = c0.lng();
//     const startZoom = m.getZoom() || 18;
//     const targetZoom = aimZoom != null ? aimZoom : startZoom;
//     m.setOptions({ isFractionalZoomEnabled: true, maxZoom: MAP_MAX_Z });

//     const t0 = performance.now();
//     const step = (now) => {
//       const k = Math.min(1, (now - t0) / durationMs);
//       const e = easeOut(k);
//       const center = {
//         lat: startLat + (aimCenter.lat - startLat) * e,
//         lng: startLng + (aimCenter.lng - startLng) * e,
//       };
//       const zoom = startZoom + (targetZoom - startZoom) * e;
//       if (typeof m.moveCamera === "function") m.moveCamera({ center, zoom });
//       else { m.setCenter(center); m.setZoom(zoom); }
//       if (k < 1) flyRafRef.current = requestAnimationFrame(step);
//       else overlayPortalRef.current?.overlay?.draw?.();
//     };
//     flyRafRef.current = requestAnimationFrame(step);
//   }, []);

//   const fitAll = useCallback(() => {
//     const m = mapRef.current;
//     if (!m) return;
//     cancelAnimationFrame(flyRafRef.current);

//     const plotPts = plots.filter((p) => p.type === "plot").flatMap((p) => p.corners || []);
//     const pts = plotPts.length ? plotPts : plots.length ? plots.flatMap((p) => p.corners || []) : boundary;
//     const b = getBounds(pts);
//     if (!b) return;

//     const vw = window.innerWidth, vh = window.innerHeight;
//     const pad =
//       vw < 600 ? { top: 82, right: 6, bottom: 48, left: 6 }
//       : vw < 1024 ? { top: 88, right: 10, bottom: 42, left: 10 }
//       : { top: 92, right: 12, bottom: 32, left: 12 };

//     const layoutCenter = { lat: (b.north + b.south) / 2, lng: (b.east + b.west) / 2 };
//     const R = 6378137;
//     const cosLat = Math.cos((layoutCenter.lat * Math.PI) / 180);
//     const spanLatM = ((b.north - b.south) * Math.PI * R) / 180;
//     const spanLngM = ((b.east - b.west) * Math.PI * R * cosLat) / 180;
//     const availW = Math.max(vw - pad.left - pad.right, 120);
//     const availH = Math.max(vh - pad.top - pad.bottom, 120);
//     const world = 156543.03392 * cosLat;
//     const mpp = Math.max(spanLngM / availW, spanLatM / availH, 0.01);
//     const fitZoom = Math.log2(world / mpp);
//     const zoom = clamp(Math.max(fitZoom + LAYOUT_ZOOM_BOOST, LAYOUT_MIN_ZOOM), 15, MAP_MAX_Z);

//     const shiftPx = (pad.top - pad.bottom) / 2;
//     const dLat = (shiftPx * (world / 2 ** zoom)) / 111320;
//     const target = { lat: layoutCenter.lat + dLat, lng: layoutCenter.lng };

//     m.setOptions({ isFractionalZoomEnabled: true, maxZoom: MAP_MAX_Z });
//     if (typeof m.moveCamera === "function") m.moveCamera({ center: target, zoom });
//     else { m.setCenter(target); m.setZoom(zoom); }
//     overlayPortalRef.current?.overlay?.draw?.();
//   }, [plots, boundary]);

//   const fitPlots = useCallback((list) => {
//     const b = getBounds(list.flatMap((p) => p.corners || []));
//     if (b) {
//       mapRef.current?.fitBounds(
//         { south: b.south, north: b.north, west: b.west, east: b.east },
//         { top: 130, right: 24, bottom: 64, left: 24 },
//       );
//     }
//   }, []);

//   const flyToPlot = useCallback((plot, durationMs = FLY_MS, forceZoom = null) => {
//     const m = mapRef.current;
//     if (!m || !plot) return;
//     const b = getBounds(plot.corners || []);
//     const center = plot.center || (b && { lat: (b.north + b.south) / 2, lng: (b.east + b.west) / 2 });
//     if (!center) return;

//     let targetZoom = forceZoom;
//     if (targetZoom == null) {
//       const R = 6378137;
//       const cosLat = Math.cos((center.lat * Math.PI) / 180);
//       const spanLatM = b ? ((b.north - b.south) * Math.PI * R) / 180 : Math.sqrt(plot.area || 150);
//       const spanLngM = b ? ((b.east - b.west) * Math.PI * R * cosLat) / 180 : Math.sqrt(plot.area || 150);
//       const vw = window.innerWidth, vh = window.innerHeight;
//       const boost = vw < 640 ? 1.85 : vw < 1024 ? 1.6 : 1.45;
//       const gutterM = 6;
//       const needW = (spanLngM + gutterM * 2) * 1.05;
//       const needH = (spanLatM + gutterM * 2) * 1.05;
//       const availW = Math.max(vw - (vw > 640 ? 410 : 40), 180);
//       const availH = Math.max(vh - (vw <= 640 ? 300 : 150), 180);
//       const world = 156543.03392 * cosLat;
//       const mpp = Math.max(needW / availW, needH / availH) / boost;
//       targetZoom = clamp(Math.log2(world / mpp), FLY_MIN_Z, FLY_MAX_Z);
//     }

//     // shift the aim point so the plot sits clear of the inspector sheet
//     let aim = center;
//     const proj = m.getProjection?.();
//     if (proj && window.google?.maps) {
//       const vw = window.innerWidth;
//       const scale = 2 ** targetZoom;
//       const shiftPxX = vw > 640 ? 150 : 0;
//       const shiftPxY = vw <= 640 ? 95 : -15;
//       const pt = proj.fromLatLngToPoint(new window.google.maps.LatLng(center.lat, center.lng));
//       if (pt) {
//         const shifted = proj.fromPointToLatLng(
//           new window.google.maps.Point(pt.x + shiftPxX / scale, pt.y + shiftPxY / scale),
//         );
//         if (shifted) aim = { lat: shifted.lat(), lng: shifted.lng() };
//       }
//     }
//     animateCameraTo(aim, targetZoom, durationMs);
//   }, [animateCameraTo]);

//   const nudgeZoom = useCallback((delta) => {
//     const m = mapRef.current;
//     if (!m) return;
//     const z1 = clamp((m.getZoom() || 19) + delta, 15, MAP_MAX_Z);
//     if (selected) flyToPlot(selected, ZOOM_STEP_MS, z1);
//     else animateCameraTo({ lat: m.getCenter().lat(), lng: m.getCenter().lng() }, z1, ZOOM_STEP_MS);
//   }, [selected, flyToPlot, animateCameraTo]);

//   /* Google Maps OverlayView that hosts the SVG sheet */
//   const attachOverlay = useCallback((mapInstance) => {
//     if (!window.google?.maps || !layout) return;
//     if (overlayPortalRef.current?.overlay) overlayPortalRef.current.overlay.setMap(null);

//     const hostDiv = document.createElement("div");
//     hostDiv.style.position = "absolute";
//     hostDiv.style.pointerEvents = "auto";
//     hostDiv.style.willChange = "transform, width, height, left, top";

//     class MasterplanOverlay extends window.google.maps.OverlayView {
//       onAdd() { this.getPanes().overlayMouseTarget.appendChild(hostDiv); }
//       draw() {
//         const proj = this.getProjection();
//         if (!proj) return;
//         const nw = proj.fromLatLngToDivPixel(new window.google.maps.LatLng(layout.northWestLL.lat, layout.northWestLL.lng));
//         const se = proj.fromLatLngToDivPixel(new window.google.maps.LatLng(layout.southEastLL.lat, layout.southEastLL.lng));
//         if (!nw || !se) return;
//         hostDiv.style.left = `${Math.min(nw.x, se.x)}px`;
//         hostDiv.style.top = `${Math.min(nw.y, se.y)}px`;
//         hostDiv.style.width = `${Math.max(1, Math.abs(se.x - nw.x))}px`;
//         hostDiv.style.height = `${Math.max(1, Math.abs(se.y - nw.y))}px`;
//       }
//       onRemove() { if (hostDiv.parentNode) hostDiv.parentNode.removeChild(hostDiv); }
//     }

//     const ov = new MasterplanOverlay();
//     ov.setMap(mapInstance);
//     overlayPortalRef.current = { overlay: ov, div: hostDiv };
//     setOverlayReady((n) => n + 1);
//   }, [layout]);

//   const onLoad = useCallback((m) => {
//     mapRef.current = m;
//     m.setOptions({ isFractionalZoomEnabled: true, maxZoom: MAP_MAX_Z });
//     attachOverlay(m);
//     setMapReady(true);
//   }, [attachOverlay]);

//   useEffect(() => {
//     if (isLoaded && mapReady && mapRef.current && layout) {
//       attachOverlay(mapRef.current);
//       if (!initialFitDoneRef.current) {
//         initialFitDoneRef.current = true;
//         fitAll(); // once per map, when both map and layout exist
//       }
//     }
//     return () => { overlayPortalRef.current?.overlay?.setMap(null); };
//   }, [isLoaded, mapReady, layout, attachOverlay, fitAll]);

//   const onIdle = useCallback(() => {
//     const m = mapRef.current;
//     if (m && compassNeedleRef.current) {
//       compassNeedleRef.current.style.transform = `rotate(${-(m.getHeading?.() || 0)}deg)`;
//     }
//   }, []);

//   const clearSelection = useCallback(() => { setHighlight(null); setSelected(null); }, []);

//   const toggleStatus = useCallback(() => {
//     const next = !showStatus;
//     setShowStatus(next);
//     try { localStorage.setItem("mv_show_status", next ? "1" : "0"); } catch { /* ignore */ }
//     clearSelection(); // the selected plot object carries the old status
//     if (!next) {
//       // drop any filter that depends on status
//       if (typeFilter === "category") { setTypeFilter("all"); setCategory(null); }
//       if (adv.status !== "All" || adv.rl !== "All") {
//         setAdv((a) => ({ ...a, status: "All", rl: "All" }));
//         setAdvMatch(new Set());
//       }
//     }
//   }, [showStatus, typeFilter, adv.status, adv.rl, clearSelection]);

//   const resetNorth = useCallback(() => {
//     const m = mapRef.current;
//     if (!m) return;
//     if (typeof m.moveCamera === "function") m.moveCamera({ heading: 0, tilt: 0 });
//     clearSelection();
//     setRoadHi({ type: null, keys: new Set() });
//     fitAll();
//   }, [fitAll, clearSelection]);

//   /* ── Appearance (palette from AC) ── */
//   const styleFor = useCallback((p) => {
//     const key = plotKey(p);
//     let fill = plotFillColor(p, mapId);
//     let stroke = defaultBorderColor(p);
//     let sw = p.type === "road" ? 0 : p.type === "plot" ? 0.22 : 0.25;
//     const ink = p.type === "plot" ? (isLightColor(fill) ? "#1A1208" : "#FFFFFF") : labelInkFor(p);

//     if (p.type === "plot") {
//       if (roadHi.keys.has(key)) {
//         fill = roadHi.type === "12m" ? AC.hi12m : AC.hi9m;
//         stroke = fill;
//         sw = 0.45;
//       } else if (typeFilter === "category" && normalizeStatus(p.status) === category) {
//         stroke = isTokenStatus(category) ? AC.token : "#FFFFFF";
//         sw = 0.5;
//       }
//       if (advMatch.has(key)) { stroke = "#18FFFF"; sw = 0.45; }
//     }
//     return { fill, stroke, sw, ink: p.type === "plot" && fill !== plotFillColor(p, mapId) ? "#FFFFFF" : ink };
//   }, [mapId, roadHi, typeFilter, category, advMatch]);

//   const opacityFor = useCallback((p, base) => {
//     let o = base;
//     if (advMatch.size && p.type === "plot" && !advMatch.has(plotKey(p))) o = 0.14;
//     if (roadHi.keys.size && p.type === "plot" && !roadHi.keys.has(plotKey(p))) o = 0.18;
//     if (typeFilter === "plot" && p.type !== "plot") o = 0.16;
//     if (typeFilter === "road" && p.type !== "road") o = 0.16;
//     if (typeFilter === "open_space" && !isOpenSpaceType(p)) o = 0.16;
//     if (typeFilter === "amenity" && !isAmenityPlot(p)) o = 0.16;
//     if (typeFilter === "category" && (p.type !== "plot" || normalizeStatus(p.status) !== category)) o = 0.16;
//     return o;
//   }, [advMatch, roadHi, typeFilter, category]);

//   /* ── Interactions ── */
//   const onPlotClick = useCallback((p) => {
//     if (p.type === "road") {
//       // tap a road → highlight every plot on that road width (12 m / 9 m); tap again to clear
//       clearSelection();
//       const width = detectRoadWidth(p);
//       setRoadHi((cur) => {
//         if (cur.type === width && cur.keys.size) return { type: null, keys: new Set() };
//         const keys = new Set(
//           plots.filter((x) => x.type === "plot" && (width === "12m" ? is12mRoadPlot(x) : !is12mRoadPlot(x))).map(plotKey),
//         );
//         return { type: width, keys };
//       });
//       return;
//     }
//     setHighlight(p);
//     setSelected(p);
//     flyToPlot(p, FLY_MS);
//   }, [plots, flyToPlot, clearSelection]);

//   const doSearch = () => {
//     const q = query.trim().toLowerCase();
//     if (!q) return clearSelection();
//     const hit = plots.find(
//       (p) => (p.plotNo || "").toLowerCase() === q || (p.srNo || "").toLowerCase() === q || (p.title || "").toLowerCase().includes(q),
//     );
//     if (!hit) return toast("No match found", { error: true });
//     setHighlight(hit);
//     setSelected(hit);
//     flyToPlot(hit, FLY_MS);
//   };

//   const pickType = (k) => {
//     setTypeFilter(k);
//     setCategory(null);
//     setRoadHi({ type: null, keys: new Set() });
//     if (k === "all") fitAll();
//   };
//   const pickCategory = (s) => {
//     setTypeFilter("category");
//     setCategory(s);
//     setRoadHi({ type: null, keys: new Set() });
//     const list = plots.filter((p) => p.type === "plot" && normalizeStatus(p.status) === s);
//     if (list.length) fitPlots(list);
//   };

//   const applyAdv = () => {
//     let minA = parseFloat(adv.min), maxA = parseFloat(adv.max);
//     if (!isNaN(minA) && !isNaN(maxA) && minA > maxA) [minA, maxA] = [maxA, minA];
//     const isFt = adv.unit === "ft²";
//     const hasArea = !isNaN(minA) || !isNaN(maxA);
//     if (!hasArea && adv.facing === "All" && adv.status === "All" && adv.road === "All" && adv.rl === "All") {
//       setAdvMatch(new Set());
//       setShowAdv(false);
//       return;
//     }
//     const matched = plots.filter((p) => {
//       if (p.type !== "plot") return false;
//       const val = isFt ? p.areaSqFt || p.area * SQFT : p.area;
//       if (!isNaN(minA) && val < minA) return false;
//       if (!isNaN(maxA) && val > maxA) return false;
//       if (adv.facing !== "All" && !(p.facing || "").toLowerCase().includes(adv.facing.toLowerCase())) return false;
//       if (adv.status !== "All" && normalizeStatus(p.status) !== adv.status) return false;
//       if (adv.road === "12m" && !is12mRoadPlot(p)) return false;
//       if (adv.road === "9m" && is12mRoadPlot(p)) return false;
//       const approved = (p.contactPhone || "").trim().toLowerCase() === "approved";
//       if (adv.rl === "Approved" && !approved) return false;
//       if (adv.rl === "Not Approved" && approved) return false;
//       return true;
//     });
//     setAdvMatch(new Set(matched.map(plotKey)));
//     setShowAdv(false);
//     if (matched.length) fitPlots(matched);
//     else toast("No plots match these filters");
//   };
//   const clearAdv = () => { setAdv(DEFAULT_ADV); setAdvMatch(new Set()); };

//   const highlightKey = highlight ? plotKey(highlight) : null;

//   if (loading) return <CenterSpinner />;
//   if (!mapDoc) {
//     return (
//       <div className="center-fill">
//         <p>Map not found.</p>
//         {!publicView && <button className="btn btn-primary" onClick={() => nav("/")}>Back</button>}
//       </div>
//     );
//   }
//   if (loadError) {
//     return (
//       <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "#0B0E13", color: "#E68A72", fontFamily: MONO, padding: 24, textAlign: "center" }}>
//         <div>
//           <h3 style={{ color: INK, marginBottom: 8 }}>Google Maps failed to load</h3>
//           <p style={{ color: MUTED, fontSize: 13 }}>Check VITE_GOOGLE_MAPS_API_KEY and disable any ad-blocker.</p>
//         </div>
//       </div>
//     );
//   }

//   const center = plots[0]?.center ?? boundary[0] ?? { lat: 21.1458, lng: 79.0882 };
//   const circleBtn = {
//     width: 44, height: 44, display: "grid", placeItems: "center", padding: 0, background: CANVAS,
//     border: `1px solid ${HAIR}`, borderRadius: 22, cursor: "pointer", boxShadow: "0 10px 28px rgba(31, 41, 55, 0.2)",
//   };
//   const zoomBtn = {
//     width: 42, height: 42, font: `500 18px/1 ${MONO}`, color: INK, background: CANVAS,
//     border: `1px solid ${HAIR}`, borderRadius: 12, cursor: "pointer", display: "grid",
//     placeItems: "center", boxShadow: "0 10px 28px rgba(31, 41, 55, 0.2)",
//   };
//   const inputStyle = {
//     font: `400 13px/1 ${MONO}`, color: INK, background: SOFT,
//     border: `1px solid ${HAIR}`, borderRadius: 9, padding: "10px", width: "100%",
//     boxSizing: "border-box", outline: "none",
//   };

//   return (
//     <div className="ref-map-page">
//       <style>{`
//         .ref-map-page { position: fixed; inset: 0; overflow: hidden; background: #0B0E13; font-family: ${SANS}; color: ${INK}; user-select: none; }
//         path.plan-plot-shape { cursor: pointer; transition: fill-opacity 120ms ease, stroke-width 120ms ease; }
//         path.plan-plot-shape:hover { fill-opacity: 0.78; }
//         .ref-hud-top { position: absolute; top: 14px; left: 14px; right: 14px; z-index: 10; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
//         .ref-topbar { pointer-events: auto; display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: ${CANVAS}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid ${HAIR}; border-radius: 14px; box-shadow: 0 18px 42px rgba(31, 41, 55, 0.2); flex-wrap: wrap; }
//         .ref-icon-btn { width: 38px; height: 38px; border-radius: 10px; background: ${SOFT}; border: 1px solid ${HAIR}; color: ${INK}; display: grid; place-items: center; cursor: pointer; transition: border-color 150ms ease, color 150ms ease; flex-shrink: 0; }
//         .ref-icon-btn:hover { border-color: ${ACCENT}; color: ${ACCENT}; }
//         .ref-icon-btn.active { background: ${GRAD}; border-color: ${ACCENT}; color: #FFFFFF; }
//         .ref-search { flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px; background: ${SOFT}; border: 1px solid ${HAIR}; border-radius: 10px; padding: 4px 6px 4px 12px; }
//         .ref-search:focus-within { border-color: ${ACCENT}; }
//         .ref-search input { flex: 1; background: transparent; border: none; outline: none; color: ${INK}; font: 400 13px/1 ${MONO}; padding: 6px 0; min-width: 0; }
//         .ref-search input::placeholder { color: ${MUTED}; }
//         .ref-find-btn { font: 600 12px/1 ${MONO}; background: ${GRAD}; color: #FFFFFF; border: none; border-radius: 7px; padding: 7px 12px; cursor: pointer; }
//         .ref-chips-row { pointer-events: auto; display: flex; align-items: center; gap: 7px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
//         .ref-chips-row::-webkit-scrollbar { display: none; }
//         .ref-pill { font: 500 12px/1 ${MONO}; color: ${INK}; background: ${PANEL}; border: 1px solid ${HAIR}; border-radius: 999px; padding: 8px 14px; cursor: pointer; white-space: nowrap; box-shadow: 0 8px 20px rgba(31, 41, 55, 0.2); transition: all 150ms ease; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; min-height: 32px; box-sizing: border-box; }
//         .ref-pill:hover { border-color: ${ACCENT}; }
//         .ref-switch { gap: 8px; }
//         .ref-switch-track { position: relative; width: 28px; height: 16px; border-radius: 999px; background: rgba(26, 26, 46, 0.22); transition: background 150ms ease; flex-shrink: 0; }
//         .ref-switch-knob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform 150ms ease; }
//         .ref-switch.on .ref-switch-track { background: rgba(255, 255, 255, 0.45); }
//         .ref-switch.on .ref-switch-knob { transform: translateX(12px); }
//         .ref-pill.on { color: #FFFFFF; background: ${GRAD}; border-color: ${ACCENT}; font-weight: 700; }
//         @media (max-width: 768px) {
//           .ref-hud-top { top: 8px; left: 8px; right: 8px; gap: 6px; }
//           .ref-topbar { padding: 8px 10px; gap: 8px; border-radius: 12px; }
//           .ref-icon-btn { width: 36px; height: 36px; }
//           .ref-topbar > div:nth-child(2) { display: none; }
//           .ref-search { padding: 0 10px; height: 36px; }
//           .ref-search input { font-size: 14px; }
//           .ref-find-btn { padding: 5px 10px; }
//           .mv-status-legend { left: 8px !important; right: 8px !important; bottom: 8px !important; max-width: none !important; width: calc(100vw - 16px) !important; flex-wrap: nowrap !important; overflow-x: auto !important; padding: 6px 10px !important; border-radius: 10px !important; gap: 6px 14px !important; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
//           .mv-status-legend::-webkit-scrollbar { display: none; }
//           .mv-status-item { flex-shrink: 0; gap: 5px !important; }
//           .mv-controls { top: 112px !important; right: 8px !important; transform: scale(0.9); transform-origin: top right; }
//         }
//       `}</style>

//       {/* ── Google Map base ── */}
//       {isLoaded && (
//         <GoogleMap
//           mapContainerStyle={{ position: "absolute", inset: 0 }}
//           center={center}
//           zoom={18.5}
//           onLoad={onLoad}
//           onIdle={onIdle}
//           options={{
//             mapTypeId: "hybrid", isFractionalZoomEnabled: true, streetViewControl: false,
//             fullscreenControl: false, mapTypeControl: false, rotateControl: false, zoomControl: false,
//             gestureHandling: "greedy", maxZoom: MAP_MAX_Z, backgroundColor: "#0B0E13",
//           }}
//           onClick={() => { if (selected || highlight) clearSelection(); }}
//         />
//       )}

//       {/* ── SVG masterplan portal ── */}
//       {overlayPortalRef.current?.div && layout &&
//         createPortal(
//           <svg
//             viewBox={`${layout.x0} ${layout.y0} ${layout.w} ${layout.h}`}
//             width="100%" height="100%" preserveAspectRatio="none"
//             style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}
//           >
//             <MasterplanSvgContent
//               layout={layout}
//               highlightKey={highlightKey}
//               styleFor={styleFor}
//               opacityFor={opacityFor}
//               onPlotClick={onPlotClick}
//             />
//           </svg>,
//           overlayPortalRef.current.div,
//         )}

//       {/* ── HUD: top bar + category pills ── */}
//       <div className="ref-hud-top">
//         <div className="ref-topbar">
//           {!publicView && (
//             <button className="ref-icon-btn" onClick={() => nav(-1)} title="Back"><ArrowLeft size={18} /></button>
//           )}
//           <div style={{ minWidth: 140 }}>
//             <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: ACCENT }}>MASTERPLAN</div>
//             <div style={{ fontSize: 15, fontWeight: 700, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 240 }}>
//               {mapDoc?.name || "Layout Map"}
//             </div>
//           </div>

//           <div className="ref-search">
//             <Search size={15} color={MUTED} />
//             <input
//               placeholder="Search plot no / sr no / title…"
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && doSearch()}
//             />
//             {query && (
//               <button
//                 onClick={() => { setQuery(""); clearSelection(); }}
//                 style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", display: "grid", placeItems: "center" }}
//               >
//                 <X size={14} />
//               </button>
//             )}
//             <button className="ref-find-btn" onClick={doSearch}>Find</button>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <button className={`ref-icon-btn ${showAdv || advMatch.size > 0 ? "active" : ""}`} title="Filters" onClick={() => setShowAdv(!showAdv)}>
//               <SlidersHorizontal size={17} />
//             </button>
//             <button className="ref-icon-btn" title="Fit Full Layout" onClick={() => { clearSelection(); fitAll(); }}>
//               <Maximize2 size={17} />
//             </button>
//             <button className="ref-icon-btn" title="Area Details" onClick={() => setShowArea(true)}>
//               <Info size={17} />
//             </button>
//             <button className="ref-icon-btn" title="Share layout" aria-label="Share layout" onClick={() => setShowShare(true)}>
//               <Share2 size={17} />
//             </button>
//           </div>
//         </div>

//         <div className="ref-chips-row">
//           {!publicView && (
//             <button
//               type="button"
//               role="switch"
//               aria-checked={showStatus}
//               title={showStatus ? "Hide sale status" : "Show sale status"}
//               className={`ref-pill ref-switch ${showStatus ? "on" : ""}`}
//               onClick={toggleStatus}
//             >
//               <span>Status</span>
//               <span className="ref-switch-track"><span className="ref-switch-knob" /></span>
//               <span>{showStatus ? "ON" : "OFF"}</span>
//             </button>
//           )}
//           {[
//             ["all", `All (${plots.length})`],
//             ["plot", `Plots (${count("plot")})`],
//             ["road", "Roads"],
//             ["open_space", "Open Spaces"],
//             ["amenity", "Amenities"],
//           ].map(([k, l]) => (
//             <button key={k} className={`ref-pill ${typeFilter === k ? "on" : ""}`} onClick={() => pickType(k)}>{l}</button>
//           ))}
//           {statuses.map((s) => (
//             <button key={s} className={`ref-pill ${typeFilter === "category" && category === s ? "on" : ""}`} onClick={() => pickCategory(s)}>
//               {s} ({countStatus(s)})
//             </button>
//           ))}
//           {roadHi.type && (
//             <button className="ref-pill on" style={{ background: roadHi.type === "12m" ? AC.hi12m : AC.hi9m, borderColor: "transparent", color: "#fff" }}
//               onClick={() => setRoadHi({ type: null, keys: new Set() })}>
//               {roadHi.type} road plots ({roadHi.keys.size}) ✕
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ── Filter panel ── */}
//       {showAdv && (
//         <div
//           role="dialog" aria-label="Filter plots" onPointerDown={(e) => e.stopPropagation()}
//           style={{
//             position: "absolute", top: 122, left: 14, zIndex: 12, width: 320, maxWidth: "calc(100vw - 28px)",
//             maxHeight: "calc(100vh - 150px)", display: "flex", flexDirection: "column", background: CANVAS,
//             backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid ${HAIR}`,
//             borderRadius: 14, boxShadow: "0 22px 54px rgba(31, 41, 55, 0.2)", overflow: "hidden",
//           }}
//         >
//           <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 11px", borderBottom: `1px solid ${HAIR}` }}>
//             <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT }}>Filters</div>
//             <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//               {advMatch.size > 0 && (
//                 <span style={{ fontFamily: MONO, fontSize: 11, color: INK, background: SOFT, padding: "4px 8px", borderRadius: 6 }}>
//                   {advMatch.size} matched
//                 </span>
//               )}
//               <button onClick={() => setShowAdv(false)} style={{ font: `400 18px/1 ${MONO}`, color: MUTED, background: "none", border: "none", cursor: "pointer" }}>&times;</button>
//             </div>
//           </header>

//           <div style={{ display: "grid", gap: 16, padding: 16, overflowY: "auto" }}>
//             <div style={{ display: "grid", gap: 9 }}>
//               <div style={sectionLabel}>Area Range ({adv.unit})</div>
//               <div style={{ display: "flex", gap: 7 }}>
//                 {["m²", "ft²"].map((u) => (
//                   <button key={u} type="button" onClick={() => setAdv({ ...adv, unit: u })}
//                     style={{
//                       font: `500 12px/1 ${MONO}`, color: adv.unit === u ? "#FFFFFF" : INK,
//                       background: adv.unit === u ? ACCENT : SOFT,
//                       border: `1px solid ${adv.unit === u ? ACCENT : HAIR}`, borderRadius: 999,
//                       padding: "7px 13px", cursor: "pointer",
//                     }}>
//                     {u}
//                   </button>
//                 ))}
//               </div>
//               <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
//                 <input type="number" placeholder="Min" value={adv.min} onChange={(e) => setAdv({ ...adv, min: e.target.value })} style={inputStyle} />
//                 <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>to</span>
//                 <input type="number" placeholder="Max" value={adv.max} onChange={(e) => setAdv({ ...adv, max: e.target.value })} style={inputStyle} />
//               </div>
//             </div>

//             <PillGroup title="Road Width" options={["All", "12m", "9m"]} value={adv.road} onChange={(v) => setAdv({ ...adv, road: v })} />
//             <PillGroup title="Facing" options={FACINGS} value={adv.facing} onChange={(v) => setAdv({ ...adv, facing: v })} />
//             {!hideStatus && (
//               <>
//                 <PillGroup title="Status" options={["All", ...statuses]} value={adv.status} onChange={(v) => setAdv({ ...adv, status: v })} />
//                 <PillGroup title="RL Approval" options={["All", "Approved", "Not Approved"]} value={adv.rl} onChange={(v) => setAdv({ ...adv, rl: v })} />
//               </>
//             )}
//           </div>

//           <footer style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 9, padding: 12, borderTop: `1px solid ${HAIR}` }}>
//             <button type="button" onClick={clearAdv} style={{ font: `500 13px/1 ${MONO}`, color: INK, background: "transparent", border: `1px solid ${HAIR}`, borderRadius: 10, padding: "11px 0", cursor: "pointer" }}>Clear</button>
//             <button type="button" onClick={applyAdv} style={{ font: `600 13px/1 ${MONO}`, color: "#FFFFFF", background: GRAD, border: `1px solid ${ACCENT}`, borderRadius: 10, padding: "11px 0", cursor: "pointer" }}>Apply</button>
//           </footer>
//         </div>
//       )}

//       {/* ── Compass + zoom controls ── */}
//       <div className="mv-controls" style={{ position: "absolute", zIndex: 8, right: 14, top: 122, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
//         <button type="button" title="Face north & fit layout" onClick={resetNorth} style={circleBtn}>
//           <svg width="26" height="26" viewBox="-13 -13 26 26">
//             <g ref={compassNeedleRef} style={{ transformOrigin: "50% 50%", willChange: "transform" }}>
//               <path d="M0 -9 L4.5 1.5 L0 -0.8 Z" fill={ACCENT} />
//               <path d="M0 -9 L-4.5 1.5 L0 -0.8 Z" fill={ACCENT} fillOpacity="0.55" />
//               <path d="M0 9 L4.5 -1.5 L0 0.8 Z" fill="#9CA3AF" />
//               <path d="M0 9 L-4.5 -1.5 L0 0.8 Z" fill="#9CA3AF" fillOpacity="0.55" />
//             </g>
//             <text x="0" y="-9.5" textAnchor="middle" fill={INK} fontFamily={MONO} fontSize="7" fontWeight="700">N</text>
//           </svg>
//         </button>
//         <button type="button" title="Zoom in" onClick={() => nudgeZoom(ZOOM_STEP)} style={zoomBtn}>+</button>
//         <button type="button" title="Zoom out" onClick={() => nudgeZoom(-ZOOM_STEP)} style={zoomBtn}>−</button>
//         {selected && (
//           <button type="button" title="Refit selected plot" onClick={() => flyToPlot(selected, 320)} style={{ ...zoomBtn, color: ACCENT }}>⌂</button>
//         )}
//       </div>

//       {/* ── Status legend (bottom-left) ── */}
//       {!hideStatus && (
//         <div
//           className="mv-status-legend"
//           style={{
//             position: "absolute", left: 14, bottom: 14, zIndex: 8, display: "flex", flexWrap: "wrap",
//             alignItems: "center", gap: "10px 14px", padding: "10px 14px", background: PANEL,
//             backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${HAIR}`,
//             borderRadius: 12, boxShadow: "0 10px 30px rgba(31, 41, 55, 0.2)", maxWidth: "calc(100vw - 220px)",
//           }}
//         >
//           {STATUS_LEGEND.map(([color, label]) => {
//             const cnt = countStatus(label);
//             return (
//               <div key={label} className="mv-status-item" style={{ display: "flex", alignItems: "center", gap: 7 }}>
//                 <span style={{ width: 12, height: 12, borderRadius: 3, background: color, border: `1px solid ${HAIR}`, boxSizing: "border-box" }} />
//                 <span style={{ font: `500 12px/1 ${MONO}`, color: INK, whiteSpace: "nowrap" }}>{label}</span>
//                 {cnt > 0 && (
//                   <span style={{ font: `500 11px/1 ${MONO}`, color: MUTED, background: SOFT, padding: "3px 6px", borderRadius: 5 }}>{cnt}</span>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* ── Selected plot inspector ── */}
//       {selected && (
//         <PlotViewSheet
//           plot={hideStatus ? { ...selected, status: "" } : selected}
//           mapId={mapId}
//           mapName={mapDoc?.name ?? ""}
//           user={viewer}
//           hideStatus={hideStatus}
//           onClose={clearSelection}
//         />
//       )}

//       {/* ── Area details ── */}
//       {showArea && (
//         <GlassModal
//           title="Area Details"
//           onClose={() => setShowArea(false)}
//           actions={<button style={glassBtn(true)} onClick={() => setShowArea(false)}>Close</button>}
//         >
//           {[
//             ["Total Area", mapDoc?.totalArea ?? "0"],
//             ["Total Plots", mapDoc?.totalPlots ?? count("plot")],
//             ["Total Roads", mapDoc?.totalRoads ?? count("road")],
//             ["Total Open Spaces", mapDoc?.totalOpenSpaces ?? count("open_space")],
//           ].map(([k, v]) => (
//             <div style={kvRow} key={k}><span style={{ color: MUTED }}>{k}</span><b>{String(v)}</b></div>
//           ))}
//           {!hideStatus && statuses.length > 0 && (
//             <>
//               <div style={{ ...sectionLabel, margin: "14px 0 4px" }}>Plots by status</div>
//               {statuses.map((s) => (
//                 <div style={kvRow} key={s}>
//                   <span style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED }}>
//                     <span style={{ width: 10, height: 10, borderRadius: 3, background: statusColor(s) }} />{s}
//                   </span>
//                   <b>{countStatus(s)}</b>
//                 </div>
//               ))}
//             </>
//           )}
//         </GlassModal>
//       )}

//       {/* ── Share ── */}
//       {showShare && (
//         <GlassModal
//           title="Share this layout"
//           onClose={() => setShowShare(false)}
//           actions={<button style={glassBtn(true)} onClick={() => setShowShare(false)}>Done</button>}
//         >
//           <p style={{ marginTop: 0, color: MUTED, fontSize: 13 }}>Anyone with this link can view the layout. No login needed.</p>
//           <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} style={{ ...inputStyle, userSelect: "text" }} />
//           <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
//             <button style={glassBtn(true)} onClick={copyLink}><Copy size={15} /> Copy link</button>
//             <a style={{ ...glassBtn(false), color: "#16A34A", borderColor: "rgba(22,163,74,.4)" }} href={whatsappUrl} target="_blank" rel="noreferrer">
//               <MessageCircle size={15} /> WhatsApp
//             </a>
//             {navigator.share && (
//               <button style={glassBtn(false)} onClick={nativeShare}><Share2 size={15} /> More…</button>
//             )}
//           </div>
//         </GlassModal>
//       )}
//     </div>
//   );
// }


import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { ArrowLeft, Info, SlidersHorizontal, Search, X, Maximize2, Share2, Copy, MessageCircle } from "lucide-react";
import { useSession } from "../context/SessionContext";
import { getMap, watchMap } from "../services/mapService";
import { plotFromDoc } from "../models/plot";
import { CenterSpinner } from "../components/Common";
import { useToast } from "../components/Toast";
import PlotViewSheet from "./PlotDetails";
import SelectedDimensionOverlay from "../components/SelectedDimensionOverlay";
import {
  SQFT, getBounds, createLocalProjection, ptsToPath, computeFeatureMetrics, placeRoadLabels, fitPlotLabel,
} from "../utils/planGeometry";
import {
  AC, STATUS_LEGEND, defaultBorderColor, detectRoadWidth, is12mRoadPlot, isAmenityPlot,
  isLightColor, isOpenSpaceType, isTokenStatus, labelInkFor, normalizeStatus, plotFillColor,
  statusColor,
} from "../utils/plotHelpers";

/* ── HUD theme — same indigo/violet brand + white card look as the rest of the app.
   Plot/map colours live in AC (utils/plotHelpers). ── */
const CANVAS = "rgba(255, 255, 255, 0.94)";
const PANEL = "rgba(255, 255, 255, 0.92)";
const HAIR = "rgba(26, 26, 46, 0.12)";

const ACCENT = "#4F46E5";
const GRAD = "linear-gradient(135deg, #4F46E5, #7C3AED)";
const SOFT = "rgba(79, 70, 229, 0.07)"; // subtle tinted fill for inputs / idle buttons
const MUTED = "#6B7280";
const INK = "#1A1A2E";
const BOUNDARY_STROKE = "#C7D2FE"; // layout outline drawn on the dark map canvas
const SELECTED_STROKE = "#E9C6F2";
const SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', Consolas, monospace";
const UNIFORM_PLOT_FONT_SIZE = 1.95; // metres — same size for every plot number

/* ── Camera & animation ── */
const FLY_MS = 780;
const ZOOM_STEP = 0.75;
const ZOOM_STEP_MS = 220;
const FLY_MIN_Z = 18.5;
const FLY_MAX_Z = 22.2;
const LAYOUT_ZOOM_BOOST = 0.6;
const LAYOUT_MIN_ZOOM = 18.2;
const MAP_MAX_Z = 24;
const easeOut = (t) => 1 - (1 - t) ** 3;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const FACINGS = ["All", "North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"];
const LIBRARIES = [];
const PUBLIC_USER = { uid: "public", name: "Visitor", role: "guest" };
const plotKey = (p) => p.srNo || p.plotNo || p.title;
const DEFAULT_ADV = { min: "", max: "", facing: "All", status: "All", road: "All", rl: "All", unit: "m²" };

/* ── Masterplan SVG ─────────────────────────────────────────────────────── */
const MasterplanSvgContent = memo(function MasterplanSvgContent({
  layout, highlightKey, styleFor, opacityFor, onPlotClick,
}) {
  const selectedFeature = useMemo(
    () => (highlightKey ? layout.features.find((f) => f.key === highlightKey) : null),
    [layout, highlightKey],
  );

  return (
    <g>
      {/* Layout boundary base */}
      {layout.boundaryD && (
        <path
          d={layout.boundaryD}
          fill={AC.canvas}
          fillOpacity="1"
          stroke={BOUNDARY_STROKE}
          strokeWidth="0.45"
          strokeDasharray="1.8 1.2"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Polygons: roads → open spaces → plots */}
      <g>
        {layout.sorted.map((f) => {
          const isSel = highlightKey === f.key;
          const isRoad = f.raw.type === "road";
          const st = styleFor(f.raw);
          const baseAlpha = isRoad ? 1 : highlightKey && !isSel ? 0.52 : 0.96;
          const alpha = opacityFor(f.raw, baseAlpha);
          return (
            <path
              key={f.rk}
              className="plan-plot-shape"
              d={f.d}
              fill={isSel ? AC.selected : st.fill}
              fillRule="evenodd"
              fillOpacity={isSel ? 0.96 : alpha}
              stroke={isSel ? SELECTED_STROKE : st.stroke}
              strokeWidth={isSel ? 0.55 : st.sw}
              strokeOpacity={isRoad ? 0 : alpha < 0.4 ? 0.35 : 0.95}
              onClick={(e) => {
                e.stopPropagation();
                onPlotClick(f.raw);
              }}
            />
          );
        })}
      </g>

      {/* Plot numbers */}
      <g style={{ pointerEvents: "none" }}>
        {layout.plotFeatures.map((f) => {
          if (f.key === highlightKey || !f.label) return null;
          const st = styleFor(f.raw);
          const alpha = opacityFor(f.raw, highlightKey ? 0.55 : 1);
          const nl = f.numLabel || { x: f.cx, y: f.cy, angle: 0, size: f.fontSize };
          return (
            <text
              key={`num-${f.rk}`}
              x={nl.x}
              y={nl.y}
              textAnchor="middle"
              dy="0.35em"
              fontFamily={SANS}
              fontSize={nl.size}
              fontWeight="700"
              fill={st.ink}
              fillOpacity={alpha < 0.4 ? 0.28 : alpha}
              transform={nl.angle ? `rotate(${nl.angle.toFixed(1)} ${nl.x.toFixed(2)} ${nl.y.toFixed(2)})` : undefined}
            >
              {f.label}
            </text>
          );
        })}
      </g>

      {/* Road & open-space labels (rotated along the feature) */}
      <g style={{ pointerEvents: "none" }}>
        {layout.zoneFeatures.map((f) => {
          if (!f.label) return null;
          const isRoad = f.raw.type === "road";
          const rl = isRoad ? f.roadLabel : null;
          if (isRoad && !rl) return null;
          const size = rl ? rl.size : Math.min(Math.max(f.ir * 0.32, 1.15), 3.2);
          if (size < 1.0) return null;
          const lx = rl ? rl.x : f.cx;
          const ly = rl ? rl.y : f.cy;
          const lang = rl ? rl.angle : f.angle;
          const alpha = opacityFor(f.raw, highlightKey ? 0.5 : 1);
          return (
            <g
              key={`lbl-${f.rk}`}
              paintOrder="stroke"
              stroke="rgba(15, 18, 24, 0.75)"
              strokeWidth={size * 0.14}
              transform={`rotate(${lang.toFixed(1)} ${lx.toFixed(2)} ${ly.toFixed(2)})`}
              opacity={alpha < 0.4 ? 0.25 : alpha}
            >
              <text
                x={lx}
                y={isRoad ? ly : ly - size * 0.35}
                textAnchor="middle"
                dy="0.35em"
                fontFamily={SANS}
                fontSize={size}
                letterSpacing={isRoad ? "0.04em" : "0.06em"}
                fill={isRoad ? AC.roadLabelInk : labelInkFor(f.raw)}
                fontWeight="700"
              >
                {f.label}
              </text>
              {!isRoad && f.raw.area > 120 && (
                <text
                  x={lx}
                  y={ly + size * 0.75}
                  textAnchor="middle"
                  dy="0.35em"
                  fontFamily={MONO}
                  fontSize={size * 0.64}
                  fill={labelInkFor(f.raw)}
                  fontWeight="600"
                >
                  {Math.round(f.raw.area).toLocaleString("en-IN")} m²
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Raised selected plot + engineering dimensions */}
      {selectedFeature && (
        <g style={{ pointerEvents: "none" }}>
          <path d={selectedFeature.d} fill={AC.selected} fillOpacity="0.94" stroke={SELECTED_STROKE} strokeWidth="0.65" />
          <SelectedDimensionOverlay feature={selectedFeature} />
        </g>
      )}
    </g>
  );
});

/* ── Small dark-glass building blocks ───────────────────────────────────── */
const sectionLabel = {
  fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED,
};

function PillGroup({ title, options, value, onChange }) {
  return (
    <div style={{ display: "grid", gap: 9 }}>
      <div style={sectionLabel}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              style={{
                font: `500 12px/1 ${MONO}`, color: on ? "#FFFFFF" : INK,
                background: on ? ACCENT : SOFT,
                border: `1px solid ${on ? ACCENT : HAIR}`, borderRadius: 999,
                padding: "8px 12px", cursor: "pointer",
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GlassModal({ title, onClose, children, actions }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.55)",
        display: "grid", placeItems: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380, maxWidth: "100%", background: CANVAS, backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)", border: `1px solid ${HAIR}`, borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,.6)", color: INK, fontFamily: SANS, padding: 18,
        }}
      >
        <div style={{ ...sectionLabel, color: ACCENT, fontSize: 13, marginBottom: 12 }}>{title}</div>
        {children}
        {actions && <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>{actions}</div>}
      </div>
    </div>
  );
}

const glassBtn = (primary) => ({
  font: `600 13px/1 ${MONO}`, color: primary ? "#FFFFFF" : INK,
  background: primary ? GRAD : "transparent", border: `1px solid ${primary ? ACCENT : HAIR}`,
  borderRadius: 10, padding: "11px 16px", cursor: "pointer", display: "inline-flex",
  alignItems: "center", gap: 8, textDecoration: "none",
});

const kvRow = { display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, borderBottom: `1px solid ${HAIR}` };

/* ── Main screen ────────────────────────────────────────────────────────── */
export default function MapViewerScreen({ publicView = false }) {
  const { mapId } = useParams();
  const { user } = useSession();
  const viewer = publicView ? PUBLIC_USER : user;
  // Status toggle: ON = plots coloured by sale status; OFF = neutral plots, no status UI.
  // (Public share view is always OFF.) The choice is remembered on this device.
  const [showStatus, setShowStatus] = useState(() => {
    if (publicView) return false;
    try { return localStorage.getItem("mv_show_status") !== "0"; } catch { return true; }
  });
  const hideStatus = publicView || !showStatus;
  const nav = useNavigate();
  const toast = useToast();

  const mapRef = useRef(null);
  const flyRafRef = useRef(0);
  const initialFitDoneRef = useRef(false);
  const overlayPortalRef = useRef(null);
  const compassNeedleRef = useRef(null);
  const lastPlotsJson = useRef("");
  const [, setOverlayReady] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES,
  });

  const [mapDoc, setMapDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("all");
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showAdv, setShowAdv] = useState(false);
  const [adv, setAdv] = useState(DEFAULT_ADV);
  const [advMatch, setAdvMatch] = useState(new Set());
  const [roadHi, setRoadHi] = useState({ type: null, keys: new Set() });
  const [showArea, setShowArea] = useState(false);
  const [showShare, setShowShare] = useState(false);

  /* ── data: initial load, then live updates (e.g. someone books a plot) ── */
  useEffect(() => {
    initialFitDoneRef.current = false;
    lastPlotsJson.current = "";
    let off = () => {};
    let cancelled = false;
    const apply = (m) => {
      const json = JSON.stringify(m.plots ?? []);
      if (json === lastPlotsJson.current) return; // nothing changed → keep layout memo
      lastPlotsJson.current = json;
      setMapDoc(m);
    };
    getMap(mapId)
      .then((m) => {
        if (cancelled) return;
        if (m) {
          apply(m);
          off = watchMap(mapId, apply);
        }
      })
      .catch((e) => console.error("Error loading map data:", e))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; off(); };
  }, [mapId]);

  useEffect(() => () => cancelAnimationFrame(flyRafRef.current), []);

  const plots = useMemo(
    () =>
      (mapDoc?.plots ?? []).map((raw) => {
        const p = plotFromDoc(raw);
        // public share view never reveals sale status
        return hideStatus && p.type === "plot" ? { ...p, status: "Available" } : p;
      }),
    [mapDoc, hideStatus],
  );
  const boundary = useMemo(
    () => (mapDoc?.layoutBoundary ?? []).map((p) => ({ lat: +p.lat, lng: +p.lng })),
    [mapDoc],
  );

  /* ── Share ── */
  const shareUrl = `${window.location.origin}/share/${mapId}`;
  const shareText = `${mapDoc?.name || "Layout"} — view the layout and plots`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const t = document.createElement("textarea");
      t.value = shareUrl;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    toast("Link copied");
  };
  const nativeShare = () => navigator.share({ title: shareText, text: shareText, url: shareUrl }).catch(() => {});
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;

  /* ── derived lists ── */
  const statuses = useMemo(
    () => (hideStatus ? [] : [...new Set(plots.filter((p) => p.type === "plot").map((p) => normalizeStatus(p.status)))]),
    [plots, hideStatus],
  );
  const count = useCallback((t) => plots.filter((p) => p.type === t).length, [plots]);
  const countStatus = useCallback(
    (s) => plots.filter((p) => p.type === "plot" && normalizeStatus(p.status) === s).length,
    [plots],
  );

  /* ── Build the local-metre layout for the SVG overlay ── */
  const layout = useMemo(() => {
    const allPts = plots.length ? plots.flatMap((p) => p.corners || []) : boundary;
    if (!allPts.length) return null;
    const b = getBounds(allPts);
    if (!b) return null;

    const proj = createLocalProjection((b.north + b.south) / 2, (b.east + b.west) / 2);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const track = ([x, y]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    };

    const boundaryPts = boundary.map((c) => {
      const pt = proj.toMeters(c.lat, c.lng);
      track(pt);
      return pt;
    });

    const features = plots.map((p, idx) => {
      const pts = (p.corners || []).map((c) => {
        const pt = proj.toMeters(c.lat, c.lng);
        track(pt);
        return pt;
      });
      const { cx, cy, ir, angle } = computeFeatureMetrics(pts);
      const label = p.type === "plot" ? String(p.plotNo || "") : String(p.title || "");
      return {
        key: plotKey(p) || `f-${idx}`,
        rk: `${plotKey(p) || "f"}~${idx}`,
        raw: p, pts, d: ptsToPath(pts), cx, cy, ir, angle, label,
        fontSize: UNIFORM_PLOT_FONT_SIZE,
        numLabel: p.type === "plot" ? fitPlotLabel(pts, label, cx, cy, UNIFORM_PLOT_FONT_SIZE) : null,
      };
    });


    
    const roadLabels = placeRoadLabels(


      
      features.map((f, i) => ({ key: i, pts: f.pts, label: f.label, type: f.raw.type })).filter((f) => f.type === "road"),
      features.filter((f) => f.raw.type === "plot").map((f) => ({ pts: f.pts })),
    );
    features.forEach((f, i) => { f.roadLabel = roadLabels.get(i) || null; });

    const orderScore = (t) => (t === "road" ? 0 : t === "plot" ? 2 : 1);
    const sorted = [...features].sort((a, b2) => orderScore(a.raw.type) - orderScore(b2.raw.type));

    const pad = 16;
    const x0 = minX - pad, y0 = minY - pad, x1 = maxX + pad, y1 = maxY + pad;
    return {
      proj, x0, y0, x1, y1, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0),
      northWestLL: proj.toLatLng(x0, y0), southEastLL: proj.toLatLng(x1, y1),
      boundaryD: boundaryPts.length > 2 ? ptsToPath(boundaryPts) : "",
      features, sorted,
      plotFeatures: features.filter((f) => f.raw.type === "plot"),
      zoneFeatures: features.filter((f) => f.raw.type !== "plot"),
    };
  }, [plots, boundary]);

  /* ── Camera ── */
  const animateCameraTo = useCallback((aimCenter, aimZoom, durationMs = FLY_MS) => {
    const m = mapRef.current;
    if (!m || !aimCenter) return;
    cancelAnimationFrame(flyRafRef.current);
    const c0 = m.getCenter();
    if (!c0) {
      m.setCenter(aimCenter);
      if (aimZoom != null) m.setZoom(aimZoom);
      return;
    }
    const startLat = c0.lat(), startLng = c0.lng();
    const startZoom = m.getZoom() || 18;
    const targetZoom = aimZoom != null ? aimZoom : startZoom;
    m.setOptions({ isFractionalZoomEnabled: true, maxZoom: MAP_MAX_Z });

    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / durationMs);
      const e = easeOut(k);
      const center = {
        lat: startLat + (aimCenter.lat - startLat) * e,
        lng: startLng + (aimCenter.lng - startLng) * e,
      };
      const zoom = startZoom + (targetZoom - startZoom) * e;
      if (typeof m.moveCamera === "function") m.moveCamera({ center, zoom });
      else { m.setCenter(center); m.setZoom(zoom); }
      if (k < 1) flyRafRef.current = requestAnimationFrame(step);
      else overlayPortalRef.current?.overlay?.draw?.();
    };
    flyRafRef.current = requestAnimationFrame(step);
  }, []);

  const fitAll = useCallback(() => {
    const m = mapRef.current;
    if (!m) return;
    cancelAnimationFrame(flyRafRef.current);

    const plotPts = plots.filter((p) => p.type === "plot").flatMap((p) => p.corners || []);
    const pts = plotPts.length ? plotPts : plots.length ? plots.flatMap((p) => p.corners || []) : boundary;
    const b = getBounds(pts);
    if (!b) return;

    const vw = window.innerWidth, vh = window.innerHeight;
    const pad =
      vw < 600 ? { top: 82, right: 6, bottom: 48, left: 6 }
      : vw < 1024 ? { top: 88, right: 10, bottom: 42, left: 10 }
      : { top: 92, right: 12, bottom: 32, left: 12 };

    const layoutCenter = { lat: (b.north + b.south) / 2, lng: (b.east + b.west) / 2 };
    const R = 6378137;
    const cosLat = Math.cos((layoutCenter.lat * Math.PI) / 180);
    const spanLatM = ((b.north - b.south) * Math.PI * R) / 180;
    const spanLngM = ((b.east - b.west) * Math.PI * R * cosLat) / 180;
    const availW = Math.max(vw - pad.left - pad.right, 120);
    const availH = Math.max(vh - pad.top - pad.bottom, 120);
    const world = 156543.03392 * cosLat;
    const mpp = Math.max(spanLngM / availW, spanLatM / availH, 0.01);
    const fitZoom = Math.log2(world / mpp);
    const zoom = clamp(Math.max(fitZoom + LAYOUT_ZOOM_BOOST, LAYOUT_MIN_ZOOM), 15, MAP_MAX_Z);

    const shiftPx = (pad.top - pad.bottom) / 2;
    const dLat = (shiftPx * (world / 2 ** zoom)) / 111320;
    const target = { lat: layoutCenter.lat + dLat, lng: layoutCenter.lng };

    m.setOptions({ isFractionalZoomEnabled: true, maxZoom: MAP_MAX_Z });
    if (typeof m.moveCamera === "function") m.moveCamera({ center: target, zoom });
    else { m.setCenter(target); m.setZoom(zoom); }
    overlayPortalRef.current?.overlay?.draw?.();
  }, [plots, boundary]);

  const fitPlots = useCallback((list) => {
    const b = getBounds(list.flatMap((p) => p.corners || []));
    if (b) {
      mapRef.current?.fitBounds(
        { south: b.south, north: b.north, west: b.west, east: b.east },
        { top: 130, right: 24, bottom: 64, left: 24 },
      );
    }
  }, []);

  const flyToPlot = useCallback((plot, durationMs = FLY_MS, forceZoom = null) => {
    const m = mapRef.current;
    if (!m || !plot) return;
    const b = getBounds(plot.corners || []);
    const center = plot.center || (b && { lat: (b.north + b.south) / 2, lng: (b.east + b.west) / 2 });
    if (!center) return;

    let targetZoom = forceZoom;
    if (targetZoom == null) {
      const R = 6378137;
      const cosLat = Math.cos((center.lat * Math.PI) / 180);
      const spanLatM = b ? ((b.north - b.south) * Math.PI * R) / 180 : Math.sqrt(plot.area || 150);
      const spanLngM = b ? ((b.east - b.west) * Math.PI * R * cosLat) / 180 : Math.sqrt(plot.area || 150);
      const vw = window.innerWidth, vh = window.innerHeight;
      const boost = vw < 640 ? 1.85 : vw < 1024 ? 1.6 : 1.45;
      const gutterM = 6;
      const needW = (spanLngM + gutterM * 2) * 1.05;
      const needH = (spanLatM + gutterM * 2) * 1.05;
      const availW = Math.max(vw - (vw > 640 ? 410 : 40), 180);
      const availH = Math.max(vh - (vw <= 640 ? 300 : 150), 180);
      const world = 156543.03392 * cosLat;
      const mpp = Math.max(needW / availW, needH / availH) / boost;
      targetZoom = clamp(Math.log2(world / mpp), FLY_MIN_Z, FLY_MAX_Z);
    }

    // shift the aim point so the plot sits clear of the inspector sheet
    let aim = center;
    const proj = m.getProjection?.();
    if (proj && window.google?.maps) {
      const vw = window.innerWidth;
      const scale = 2 ** targetZoom;
      const shiftPxX = vw > 640 ? 150 : 0;
      const shiftPxY = vw <= 640 ? 95 : -15;
      const pt = proj.fromLatLngToPoint(new window.google.maps.LatLng(center.lat, center.lng));
      if (pt) {
        const shifted = proj.fromPointToLatLng(
          new window.google.maps.Point(pt.x + shiftPxX / scale, pt.y + shiftPxY / scale),
        );
        if (shifted) aim = { lat: shifted.lat(), lng: shifted.lng() };
      }
    }
    animateCameraTo(aim, targetZoom, durationMs);
  }, [animateCameraTo]);

  const nudgeZoom = useCallback((delta) => {
    const m = mapRef.current;
    if (!m) return;
    const z1 = clamp((m.getZoom() || 19) + delta, 15, MAP_MAX_Z);
    if (selected) flyToPlot(selected, ZOOM_STEP_MS, z1);
    else animateCameraTo({ lat: m.getCenter().lat(), lng: m.getCenter().lng() }, z1, ZOOM_STEP_MS);
  }, [selected, flyToPlot, animateCameraTo]);

  /* Google Maps OverlayView that hosts the SVG sheet */
  const attachOverlay = useCallback((mapInstance) => {
    if (!window.google?.maps || !layout) return;
    if (overlayPortalRef.current?.overlay) overlayPortalRef.current.overlay.setMap(null);

    const hostDiv = document.createElement("div");
    hostDiv.style.position = "absolute";
    hostDiv.style.pointerEvents = "auto";
    hostDiv.style.willChange = "transform, width, height, left, top";

    class MasterplanOverlay extends window.google.maps.OverlayView {
      onAdd() { this.getPanes().overlayMouseTarget.appendChild(hostDiv); }
      draw() {
        const proj = this.getProjection();
        if (!proj) return;
        const nw = proj.fromLatLngToDivPixel(new window.google.maps.LatLng(layout.northWestLL.lat, layout.northWestLL.lng));
        const se = proj.fromLatLngToDivPixel(new window.google.maps.LatLng(layout.southEastLL.lat, layout.southEastLL.lng));
        if (!nw || !se) return;
        hostDiv.style.left = `${Math.min(nw.x, se.x)}px`;
        hostDiv.style.top = `${Math.min(nw.y, se.y)}px`;
        hostDiv.style.width = `${Math.max(1, Math.abs(se.x - nw.x))}px`;
        hostDiv.style.height = `${Math.max(1, Math.abs(se.y - nw.y))}px`;
      }
      onRemove() { if (hostDiv.parentNode) hostDiv.parentNode.removeChild(hostDiv); }
    }

    const ov = new MasterplanOverlay();
    ov.setMap(mapInstance);
    overlayPortalRef.current = { overlay: ov, div: hostDiv };
    setOverlayReady((n) => n + 1);
  }, [layout]);

  const onLoad = useCallback((m) => {
    mapRef.current = m;
    m.setOptions({ isFractionalZoomEnabled: true, maxZoom: MAP_MAX_Z });
    attachOverlay(m);
    setMapReady(true);
  }, [attachOverlay]);

  useEffect(() => {
    if (isLoaded && mapReady && mapRef.current && layout) {
      attachOverlay(mapRef.current);
      if (!initialFitDoneRef.current) {
        initialFitDoneRef.current = true;
        fitAll(); // once per map, when both map and layout exist
      }
    }
    return () => { overlayPortalRef.current?.overlay?.setMap(null); };
  }, [isLoaded, mapReady, layout, attachOverlay, fitAll]);

  const onIdle = useCallback(() => {
    const m = mapRef.current;
    if (m && compassNeedleRef.current) {
      compassNeedleRef.current.style.transform = `rotate(${-(m.getHeading?.() || 0)}deg)`;
    }
  }, []);

  const clearSelection = useCallback(() => { setHighlight(null); setSelected(null); }, []);

  const toggleStatus = useCallback(() => {
    const next = !showStatus;
    setShowStatus(next);
    try { localStorage.setItem("mv_show_status", next ? "1" : "0"); } catch { /* ignore */ }
    clearSelection(); // the selected plot object carries the old status
    if (!next) {
      // drop any filter that depends on status
      if (typeFilter === "category") { setTypeFilter("all"); setCategory(null); }
      if (adv.status !== "All" || adv.rl !== "All") {
        setAdv((a) => ({ ...a, status: "All", rl: "All" }));
        setAdvMatch(new Set());
      }
    }
  }, [showStatus, typeFilter, adv.status, adv.rl, clearSelection]);

  const resetNorth = useCallback(() => {
    const m = mapRef.current;
    if (!m) return;
    if (typeof m.moveCamera === "function") m.moveCamera({ heading: 0, tilt: 0 });
    clearSelection();
    setRoadHi({ type: null, keys: new Set() });
    fitAll();
  }, [fitAll, clearSelection]);

  /* ── Appearance (palette from AC) ── */
  const styleFor = useCallback((p) => {
    const key = plotKey(p);
    let fill = plotFillColor(p, mapId);
    let stroke = defaultBorderColor(p);
    let sw = p.type === "road" ? 0 : p.type === "plot" ? 0.22 : 0.25;
    const ink = p.type === "plot" ? (isLightColor(fill) ? "#1A1208" : "#FFFFFF") : labelInkFor(p);

    if (p.type === "plot") {
      if (roadHi.keys.has(key)) {
        fill = roadHi.type === "12m" ? AC.hi12m : AC.hi9m;
        stroke = fill;
        sw = 0.45;
      } else if (typeFilter === "category" && normalizeStatus(p.status) === category) {
        stroke = isTokenStatus(category) ? AC.token : "#FFFFFF";
        sw = 0.5;
      }
      if (advMatch.has(key)) { stroke = "#18FFFF"; sw = 0.45; }
    }
    return { fill, stroke, sw, ink: p.type === "plot" && fill !== plotFillColor(p, mapId) ? "#FFFFFF" : ink };
  }, [mapId, roadHi, typeFilter, category, advMatch]);

  const opacityFor = useCallback((p, base) => {
    let o = base;
    if (advMatch.size && p.type === "plot" && !advMatch.has(plotKey(p))) o = 0.14;
    if (roadHi.keys.size && p.type === "plot" && !roadHi.keys.has(plotKey(p))) o = 0.18;
    if (typeFilter === "plot" && p.type !== "plot") o = 0.16;
    if (typeFilter === "road" && p.type !== "road") o = 0.16;
    if (typeFilter === "open_space" && !isOpenSpaceType(p)) o = 0.16;
    if (typeFilter === "amenity" && !isAmenityPlot(p)) o = 0.16;
    if (typeFilter === "category" && (p.type !== "plot" || normalizeStatus(p.status) !== category)) o = 0.16;
    return o;
  }, [advMatch, roadHi, typeFilter, category]);

  /* ── Interactions ── */
  const onPlotClick = useCallback((p) => {
    if (p.type === "road") {
      // tap a road → highlight every plot on that road width (12 m / 9 m); tap again to clear
      clearSelection();
      const width = detectRoadWidth(p);
      setRoadHi((cur) => {
        if (cur.type === width && cur.keys.size) return { type: null, keys: new Set() };
        const keys = new Set(
          plots.filter((x) => x.type === "plot" && (width === "12m" ? is12mRoadPlot(x) : !is12mRoadPlot(x))).map(plotKey),
        );
        return { type: width, keys };
      });
      return;
    }
    setHighlight(p);
    setSelected(p);
    flyToPlot(p, FLY_MS);
  }, [plots, flyToPlot, clearSelection]);

  const doSearch = () => {
    const q = query.trim().toLowerCase();
    if (!q) return clearSelection();
    const hit = plots.find(
      (p) => (p.plotNo || "").toLowerCase() === q || (p.srNo || "").toLowerCase() === q || (p.title || "").toLowerCase().includes(q),
    );
    if (!hit) return toast("No match found", { error: true });
    setHighlight(hit);
    setSelected(hit);
    flyToPlot(hit, FLY_MS);
  };

  const pickType = (k) => {
    setTypeFilter(k);
    setCategory(null);
    setRoadHi({ type: null, keys: new Set() });
    if (k === "all") fitAll();
  };
  const pickCategory = (s) => {
    setTypeFilter("category");
    setCategory(s);
    setRoadHi({ type: null, keys: new Set() });
    const list = plots.filter((p) => p.type === "plot" && normalizeStatus(p.status) === s);
    if (list.length) fitPlots(list);
  };

  const applyAdv = () => {
    let minA = parseFloat(adv.min), maxA = parseFloat(adv.max);
    if (!isNaN(minA) && !isNaN(maxA) && minA > maxA) [minA, maxA] = [maxA, minA];
    const isFt = adv.unit === "ft²";
    const hasArea = !isNaN(minA) || !isNaN(maxA);
    if (!hasArea && adv.facing === "All" && adv.status === "All" && adv.road === "All" && adv.rl === "All") {
      setAdvMatch(new Set());
      setShowAdv(false);
      return;
    }
    const matched = plots.filter((p) => {
      if (p.type !== "plot") return false;
      const val = isFt ? p.areaSqFt || p.area * SQFT : p.area;
      if (!isNaN(minA) && val < minA) return false;
      if (!isNaN(maxA) && val > maxA) return false;
      if (adv.facing !== "All" && !(p.facing || "").toLowerCase().includes(adv.facing.toLowerCase())) return false;
      if (adv.status !== "All" && normalizeStatus(p.status) !== adv.status) return false;
      if (adv.road === "12m" && !is12mRoadPlot(p)) return false;
      if (adv.road === "9m" && is12mRoadPlot(p)) return false;
      const approved = (p.contactPhone || "").trim().toLowerCase() === "approved";
      if (adv.rl === "Approved" && !approved) return false;
      if (adv.rl === "Not Approved" && approved) return false;
      return true;
    });
    setAdvMatch(new Set(matched.map(plotKey)));
    setShowAdv(false);
    if (matched.length) fitPlots(matched);
    else toast("No plots match these filters");
  };
  const clearAdv = () => { setAdv(DEFAULT_ADV); setAdvMatch(new Set()); };

  const highlightKey = highlight ? plotKey(highlight) : null;

  if (loading) return <CenterSpinner />;
  if (!mapDoc) {
    return (
      <div className="center-fill">
        <p>Map not found.</p>
        {!publicView && <button className="btn btn-primary" onClick={() => nav("/")}>Back</button>}
      </div>
    );
  }
  if (loadError) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "#0B0E13", color: "#E68A72", fontFamily: MONO, padding: 24, textAlign: "center" }}>
        <div>
          <h3 style={{ color: INK, marginBottom: 8 }}>Google Maps failed to load</h3>
          <p style={{ color: MUTED, fontSize: 13 }}>Check VITE_GOOGLE_MAPS_API_KEY and disable any ad-blocker.</p>
        </div>
      </div>
    );
  }

  const center = plots[0]?.center ?? boundary[0] ?? { lat: 21.1458, lng: 79.0882 };
  const circleBtn = {
    width: 44, height: 44, display: "grid", placeItems: "center", padding: 0, background: CANVAS,
    border: `1px solid ${HAIR}`, borderRadius: 22, cursor: "pointer", boxShadow: "0 10px 28px rgba(31, 41, 55, 0.2)",
  };
  const zoomBtn = {
    width: 42, height: 42, font: `500 18px/1 ${MONO}`, color: INK, background: CANVAS,
    border: `1px solid ${HAIR}`, borderRadius: 12, cursor: "pointer", display: "grid",
    placeItems: "center", boxShadow: "0 10px 28px rgba(31, 41, 55, 0.2)",
  };
  const inputStyle = {
    font: `400 13px/1 ${MONO}`, color: INK, background: SOFT,
    border: `1px solid ${HAIR}`, borderRadius: 9, padding: "10px", width: "100%",
    boxSizing: "border-box", outline: "none",
  };

  return (
    <div className="ref-map-page">
      <style>{`
        .ref-map-page { position: fixed; inset: 0; overflow: hidden; background: #0B0E13; font-family: ${SANS}; color: ${INK}; user-select: none; }
        path.plan-plot-shape { cursor: pointer; transition: fill-opacity 120ms ease, stroke-width 120ms ease; }
        path.plan-plot-shape:hover { fill-opacity: 0.78; }
        .ref-hud-top { position: absolute; top: 14px; left: 14px; right: 14px; z-index: 10; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
        .ref-topbar { pointer-events: auto; display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: ${CANVAS}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid ${HAIR}; border-radius: 14px; box-shadow: 0 18px 42px rgba(31, 41, 55, 0.2); flex-wrap: wrap; }
        .ref-icon-btn { width: 38px; height: 38px; border-radius: 10px; background: ${SOFT}; border: 1px solid ${HAIR}; color: ${INK}; display: grid; place-items: center; cursor: pointer; transition: border-color 150ms ease, color 150ms ease; flex-shrink: 0; }
        .ref-icon-btn:hover { border-color: ${ACCENT}; color: ${ACCENT}; }
        .ref-icon-btn.active { background: ${GRAD}; border-color: ${ACCENT}; color: #FFFFFF; }
        .ref-search { flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px; background: ${SOFT}; border: 1px solid ${HAIR}; border-radius: 10px; padding: 4px 6px 4px 12px; }
        .ref-search:focus-within { border-color: ${ACCENT}; }
        .ref-search input { flex: 1; background: transparent; border: none; outline: none; color: ${INK}; font: 400 13px/1 ${MONO}; padding: 6px 0; min-width: 0; }
        .ref-search input::placeholder { color: ${MUTED}; }
        .ref-find-btn { font: 600 12px/1 ${MONO}; background: ${GRAD}; color: #FFFFFF; border: none; border-radius: 7px; padding: 7px 12px; cursor: pointer; }
        .ref-chips-row { pointer-events: auto; display: flex; align-items: center; gap: 7px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
        .ref-chips-row::-webkit-scrollbar { display: none; }
        .ref-pill { font: 500 12px/1 ${MONO}; color: ${INK}; background: ${PANEL}; border: 1px solid ${HAIR}; border-radius: 999px; padding: 8px 14px; cursor: pointer; white-space: nowrap; box-shadow: 0 8px 20px rgba(31, 41, 55, 0.2); transition: all 150ms ease; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; min-height: 32px; box-sizing: border-box; }
        .ref-pill:hover { border-color: ${ACCENT}; }
        .ref-switch { gap: 8px; }
        .ref-switch-track { position: relative; width: 28px; height: 16px; border-radius: 999px; background: rgba(26, 26, 46, 0.22); transition: background 150ms ease; flex-shrink: 0; }
        .ref-switch-knob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform 150ms ease; }
        .ref-switch.on .ref-switch-track { background: rgba(255, 255, 255, 0.45); }
        .ref-switch.on .ref-switch-knob { transform: translateX(12px); }
        .ref-pill.on { color: #FFFFFF; background: ${GRAD}; border-color: ${ACCENT}; font-weight: 700; }
        @media (max-width: 768px) {
          .ref-hud-top { top: 8px; left: 8px; right: 8px; gap: 6px; }
          .ref-topbar { padding: 8px 10px; gap: 8px; border-radius: 12px; }
          .ref-icon-btn { width: 36px; height: 36px; }
          .ref-topbar > div:nth-child(2) { display: none; }
          .ref-search { padding: 0 10px; height: 36px; }
          .ref-search input { font-size: 14px; }
          .ref-find-btn { padding: 5px 10px; }
          .mv-status-legend { left: 8px !important; right: 8px !important; bottom: 8px !important; max-width: none !important; width: calc(100vw - 16px) !important; flex-wrap: nowrap !important; overflow-x: auto !important; padding: 6px 10px !important; border-radius: 10px !important; gap: 6px 14px !important; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
          .mv-status-legend::-webkit-scrollbar { display: none; }
          .mv-status-item { flex-shrink: 0; gap: 5px !important; }
          .mv-controls { top: 112px !important; right: 8px !important; transform: scale(0.9); transform-origin: top right; }
        }
      `}</style>

      {/* ── Google Map base ── */}
      {isLoaded && (
        <GoogleMap
          mapContainerStyle={{ position: "absolute", inset: 0 }}
          center={center}
          zoom={18.5}
          onLoad={onLoad}
          onIdle={onIdle}
          options={{
            mapTypeId: "hybrid", isFractionalZoomEnabled: true, streetViewControl: false,
            fullscreenControl: false, mapTypeControl: false, rotateControl: false, zoomControl: false,
            gestureHandling: "greedy", maxZoom: MAP_MAX_Z, backgroundColor: "#0B0E13",
          }}
          onClick={() => { if (selected || highlight) clearSelection(); }}
        />
      )}

      {/* ── SVG masterplan portal ── */}
      {overlayPortalRef.current?.div && layout &&
        createPortal(
          <svg
            viewBox={`${layout.x0} ${layout.y0} ${layout.w} ${layout.h}`}
            width="100%" height="100%" preserveAspectRatio="none"
            style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}
          >
            <MasterplanSvgContent
              layout={layout}
              highlightKey={highlightKey}
              styleFor={styleFor}
              opacityFor={opacityFor}
              onPlotClick={onPlotClick}
            />
          </svg>,
          overlayPortalRef.current.div,
        )}

      {/* ── HUD: top bar + category pills ── */}
      <div className="ref-hud-top">
        <div className="ref-topbar">
          {!publicView && (
            <button className="ref-icon-btn" onClick={() => nav(-1)} title="Back"><ArrowLeft size={18} /></button>
          )}
          <div style={{ minWidth: 140 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: ACCENT }}>MASTERPLAN</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 240 }}>
              {mapDoc?.name || "Layout Map"}
            </div>
          </div>

          <div className="ref-search">
            <Search size={15} color={MUTED} />
            <input
              placeholder="Search plot no / sr no / title…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); clearSelection(); }}
                style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", display: "grid", placeItems: "center" }}
              >
                <X size={14} />
              </button>
            )}
            <button className="ref-find-btn" onClick={doSearch}>Find</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className={`ref-icon-btn ${showAdv || advMatch.size > 0 ? "active" : ""}`} title="Filters" onClick={() => setShowAdv(!showAdv)}>
              <SlidersHorizontal size={17} />
            </button>
            <button className="ref-icon-btn" title="Fit Full Layout" onClick={() => { clearSelection(); fitAll(); }}>
              <Maximize2 size={17} />
            </button>
            <button className="ref-icon-btn" title="Area Details" onClick={() => setShowArea(true)}>
              <Info size={17} />
            </button>
            <button className="ref-icon-btn" title="Share layout" aria-label="Share layout" onClick={() => setShowShare(true)}>
              <Share2 size={17} />
            </button>
          </div>
        </div>

        <div className="ref-chips-row">
          {!publicView && (
            <button
              type="button"
              role="switch"
              aria-checked={showStatus}
              title={showStatus ? "Hide sale status" : "Show sale status"}
              className={`ref-pill ref-switch ${showStatus ? "on" : ""}`}
              onClick={toggleStatus}
            >
              <span>Status</span>
              <span className="ref-switch-track"><span className="ref-switch-knob" /></span>
              <span>{showStatus ? "ON" : "OFF"}</span>
            </button>
          )}
          {[
            ["all", `All (${plots.length})`],
            ["plot", `Plots (${count("plot")})`],
            ["road", "Roads"],
            ["open_space", "Open Spaces"],
            ["amenity", "Amenities"],
          ].map(([k, l]) => (
            <button key={k} className={`ref-pill ${typeFilter === k ? "on" : ""}`} onClick={() => pickType(k)}>{l}</button>
          ))}
          {statuses.map((s) => (
            <button key={s} className={`ref-pill ${typeFilter === "category" && category === s ? "on" : ""}`} onClick={() => pickCategory(s)}>
              {s} ({countStatus(s)})
            </button>
          ))}
          {roadHi.type && (
            <button className="ref-pill on" style={{ background: roadHi.type === "12m" ? AC.hi12m : AC.hi9m, borderColor: "transparent", color: "#fff" }}
              onClick={() => setRoadHi({ type: null, keys: new Set() })}>
              {roadHi.type} road plots ({roadHi.keys.size}) ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showAdv && (
        <div
          role="dialog" aria-label="Filter plots" onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute", top: 122, left: 14, zIndex: 12, width: 320, maxWidth: "calc(100vw - 28px)",
            maxHeight: "calc(100vh - 150px)", display: "flex", flexDirection: "column", background: CANVAS,
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid ${HAIR}`,
            borderRadius: 14, boxShadow: "0 22px 54px rgba(31, 41, 55, 0.2)", overflow: "hidden",
          }}
        >
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 11px", borderBottom: `1px solid ${HAIR}` }}>
            <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT }}>Filters</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {advMatch.size > 0 && (
                <span style={{ fontFamily: MONO, fontSize: 11, color: INK, background: SOFT, padding: "4px 8px", borderRadius: 6 }}>
                  {advMatch.size} matched
                </span>
              )}
              <button onClick={() => setShowAdv(false)} style={{ font: `400 18px/1 ${MONO}`, color: MUTED, background: "none", border: "none", cursor: "pointer" }}>&times;</button>
            </div>
          </header>

          <div style={{ display: "grid", gap: 16, padding: 16, overflowY: "auto" }}>
            <div style={{ display: "grid", gap: 9 }}>
              <div style={sectionLabel}>Area Range ({adv.unit})</div>
              <div style={{ display: "flex", gap: 7 }}>
                {["m²", "ft²"].map((u) => (
                  <button key={u} type="button" onClick={() => setAdv({ ...adv, unit: u })}
                    style={{
                      font: `500 12px/1 ${MONO}`, color: adv.unit === u ? "#FFFFFF" : INK,
                      background: adv.unit === u ? ACCENT : SOFT,
                      border: `1px solid ${adv.unit === u ? ACCENT : HAIR}`, borderRadius: 999,
                      padding: "7px 13px", cursor: "pointer",
                    }}>
                    {u}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
                <input type="number" placeholder="Min" value={adv.min} onChange={(e) => setAdv({ ...adv, min: e.target.value })} style={inputStyle} />
                <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>to</span>
                <input type="number" placeholder="Max" value={adv.max} onChange={(e) => setAdv({ ...adv, max: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <PillGroup title="Road Width" options={["All", "12m", "9m"]} value={adv.road} onChange={(v) => setAdv({ ...adv, road: v })} />
            <PillGroup title="Facing" options={FACINGS} value={adv.facing} onChange={(v) => setAdv({ ...adv, facing: v })} />
            {!hideStatus && (
              <>
                <PillGroup title="Status" options={["All", ...statuses]} value={adv.status} onChange={(v) => setAdv({ ...adv, status: v })} />
                <PillGroup title="RL Approval" options={["All", "Approved", "Not Approved"]} value={adv.rl} onChange={(v) => setAdv({ ...adv, rl: v })} />
              </>
            )}
          </div>

          <footer style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 9, padding: 12, borderTop: `1px solid ${HAIR}` }}>
            <button type="button" onClick={clearAdv} style={{ font: `500 13px/1 ${MONO}`, color: INK, background: "transparent", border: `1px solid ${HAIR}`, borderRadius: 10, padding: "11px 0", cursor: "pointer" }}>Clear</button>
            <button type="button" onClick={applyAdv} style={{ font: `600 13px/1 ${MONO}`, color: "#FFFFFF", background: GRAD, border: `1px solid ${ACCENT}`, borderRadius: 10, padding: "11px 0", cursor: "pointer" }}>Apply</button>
          </footer>
        </div>
      )}

      {/* ── Compass + zoom controls ── */}
      <div className="mv-controls" style={{ position: "absolute", zIndex: 8, right: 14, top: 122, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        <button type="button" title="Face north & fit layout" onClick={resetNorth} style={circleBtn}>
          <svg width="26" height="26" viewBox="-13 -13 26 26">
            <g ref={compassNeedleRef} style={{ transformOrigin: "50% 50%", willChange: "transform" }}>
              <path d="M0 -9 L4.5 1.5 L0 -0.8 Z" fill={ACCENT} />
              <path d="M0 -9 L-4.5 1.5 L0 -0.8 Z" fill={ACCENT} fillOpacity="0.55" />
              <path d="M0 9 L4.5 -1.5 L0 0.8 Z" fill="#9CA3AF" />
              <path d="M0 9 L-4.5 -1.5 L0 0.8 Z" fill="#9CA3AF" fillOpacity="0.55" />
            </g>
            <text x="0" y="-9.5" textAnchor="middle" fill={INK} fontFamily={MONO} fontSize="7" fontWeight="700">N</text>
          </svg>
        </button>
        <button type="button" title="Zoom in" onClick={() => nudgeZoom(ZOOM_STEP)} style={zoomBtn}>+</button>
        <button type="button" title="Zoom out" onClick={() => nudgeZoom(-ZOOM_STEP)} style={zoomBtn}>−</button>
        {selected && (
          <button type="button" title="Refit selected plot" onClick={() => flyToPlot(selected, 320)} style={{ ...zoomBtn, color: ACCENT }}>⌂</button>
        )}
      </div>

      {/* ── Status legend (bottom-left) ── */}
      {!hideStatus && (
        <div
          className="mv-status-legend"
          style={{
            position: "absolute", left: 14, bottom: 14, zIndex: 8, display: "flex", flexWrap: "wrap",
            alignItems: "center", gap: "10px 14px", padding: "10px 14px", background: PANEL,
            backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${HAIR}`,
            borderRadius: 12, boxShadow: "0 10px 30px rgba(31, 41, 55, 0.2)", maxWidth: "calc(100vw - 220px)",
          }}
        >
          {STATUS_LEGEND.map(([color, label]) => {
            const cnt = countStatus(label);
            return (
              <div key={label} className="mv-status-item" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: color, border: `1px solid ${HAIR}`, boxSizing: "border-box" }} />
                <span style={{ font: `500 12px/1 ${MONO}`, color: INK, whiteSpace: "nowrap" }}>{label}</span>
                {cnt > 0 && (
                  <span style={{ font: `500 11px/1 ${MONO}`, color: MUTED, background: SOFT, padding: "3px 6px", borderRadius: 5 }}>{cnt}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Selected plot inspector ── */}
      {selected && (
        <PlotViewSheet
          plot={hideStatus ? { ...selected, status: "" } : selected}
          mapId={mapId}
          mapName={mapDoc?.name ?? ""}
          user={viewer}
          hideStatus={hideStatus}
          onClose={clearSelection}
        />
      )}

      {/* ── Area details ── */}
      {showArea && (
        <GlassModal
          title="Area Details"
          onClose={() => setShowArea(false)}
          actions={<button style={glassBtn(true)} onClick={() => setShowArea(false)}>Close</button>}
        >
          {[
            ["Total Area", mapDoc?.totalArea ?? "0"],
            ["Total Plots", mapDoc?.totalPlots ?? count("plot")],
            ["Total Roads", mapDoc?.totalRoads ?? count("road")],
            ["Total Open Spaces", mapDoc?.totalOpenSpaces ?? count("open_space")],
          ].map(([k, v]) => (
            <div style={kvRow} key={k}><span style={{ color: MUTED }}>{k}</span><b>{String(v)}</b></div>
          ))}
          {!hideStatus && statuses.length > 0 && (
            <>
              <div style={{ ...sectionLabel, margin: "14px 0 4px" }}>Plots by status</div>
              {statuses.map((s) => (
                <div style={kvRow} key={s}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: statusColor(s) }} />{s}
                  </span>
                  <b>{countStatus(s)}</b>
                </div>
              ))}
            </>
          )}
        </GlassModal>
      )}

      {/* ── Share ── */}
      {showShare && (
        <GlassModal
          title="Share this layout"
          onClose={() => setShowShare(false)}
          actions={<button style={glassBtn(true)} onClick={() => setShowShare(false)}>Done</button>}
        >
          <p style={{ marginTop: 0, color: MUTED, fontSize: 13 }}>Anyone with this link can view the layout. No login needed.</p>
          <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} style={{ ...inputStyle, userSelect: "text" }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <button style={glassBtn(true)} onClick={copyLink}><Copy size={15} /> Copy link</button>
            <a style={{ ...glassBtn(false), color: "#16A34A", borderColor: "rgba(22,163,74,.4)" }} href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={15} /> WhatsApp
            </a>
            {navigator.share && (
              <button style={glassBtn(false)} onClick={nativeShare}><Share2 size={15} /> More…</button>
            )}
          </div>
        </GlassModal>
      )}
    </div>
  );
}