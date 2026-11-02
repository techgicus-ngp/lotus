import { useEffect, useRef, useState } from 'react';
import { createSiteVisit, uploadSelfie, watchEmployeeSiteVisits } from '../services/siteVisitService';
import { findPlotInMap } from '../services/mapService';
import { useToast } from '../components/Toast';
import { formatDateTime12 } from '../utils/format';
import { statusColor } from '../utils/plotHelpers';
import { IconCamera, IconGallery, IconLocation, IconRefresh } from '../icons';

// Resize to max 800px wide, JPEG quality 0.55 (same as the Flutter image_picker settings).
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 800 / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process image'))), 'image/jpeg', 0.55);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Could not read image'));
    img.src = URL.createObjectURL(file);
  });
}

async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    const j = await r.json();
    return j.display_name ?? '';
  } catch { return ''; }
}

export default function SiteVisitTab({ user, maps }) {
  const toast = useToast();
  const [mapId, setMapId] = useState('');
  const [plotNo, setPlotNo] = useState('');
  const [checking, setChecking] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [plot, setPlot] = useState(null);
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [selfie, setSelfie] = useState(null); // { blob, url }
  const [saving, setSaving] = useState(false);
  const [visits, setVisits] = useState(null);
  const camRef = useRef(); const galRef = useRef();

  useEffect(() => watchEmployeeSiteVisits(user.uid, setVisits, (e) => { console.error(e); setVisits([]); }), [user.uid]);

  function fetchAddress() {
    if (!navigator.geolocation) return toast('Geolocation is not supported here', { error: true });
    setFetching(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        const addr = await reverseGeocode(c.latitude, c.longitude);
        setCoords({ lat: c.latitude, lng: c.longitude });
        setAddress(addr || `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`);
        setFetching(false);
      },
      (err) => {
        setFetching(false);
        toast(err.code === 1 ? 'Location permission denied' : `Error fetching address: ${err.message}`, { error: true });
      },
      { enableHighAccuracy: true, timeout: 20000 },
    );
  }
  useEffect(fetchAddress, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function checkPlot() {
    if (!mapId) return toast('Select a project first', { error: true });
    if (!plotNo.trim()) return;
    setChecking(true); setNotFound(false); setPlot(null);
    try {
      const map = maps.find((m) => m.id === mapId);
      const found = await findPlotInMap(mapId, map, plotNo);
      if (found) setPlot(found); else setNotFound(true);
    } catch (e) { toast(`Error checking plot: ${e.message}`, { error: true }); }
    setChecking(false);
  }

  async function pick(file) {
    if (!file) return;
    try {
      const blob = await compressImage(file);
      setSelfie({ blob, url: URL.createObjectURL(blob) });
    } catch (e) { toast(`Error picking image: ${e.message}`, { error: true }); }
  }

  async function submit() {
    if (!mapId) return toast('Select a project', { error: true });
    if (!plot) return toast('Check a valid plot number first', { error: true });
    if (!address) return toast('Address not available yet', { error: true });
    if (!selfie) return toast('Take a selfie with the customer', { error: true });
    setSaving(true);
    try {
      const selfieUrl = await uploadSelfie(user.uid, selfie.blob);
      await createSiteVisit({
        mapId, projectName: maps.find((m) => m.id === mapId)?.name ?? '', plotNo: plot.plotNo,
        plotStatus: plot.status, selfieUrl, address, latitude: coords?.lat ?? 0, longitude: coords?.lng ?? 0,
        employeeUid: user.uid, employeeName: user.name, visitDate: new Date(),
      });
      toast('Site visit logged successfully');
      setMapId(''); setPlotNo(''); setPlot(null); setNotFound(false); setSelfie(null);
    } catch (e) { toast(`Error saving visit: ${e.message}`, { error: true }); }
    setSaving(false);
  }

  return (
    <div className="tab-body">
      <section className="card form-card">
        <h4>Project</h4>
        <select className="input" value={mapId} onChange={(e) => { setMapId(e.target.value); setPlot(null); setNotFound(false); }}>
          <option value="">Select project (map)</option>
          {maps.map((m) => <option key={m.id} value={m.id}>{m.name ?? m.id}</option>)}
        </select>
      </section>

      <section className="card form-card">
        <h4>Plot Number</h4>
        <div className="inline-row">
          <input className="input" placeholder="e.g. A-12" value={plotNo}
            onChange={(e) => { setPlotNo(e.target.value); setPlot(null); setNotFound(false); }}
            onKeyDown={(e) => e.key === 'Enter' && checkPlot()} />
          <button className="btn btn-primary" onClick={checkPlot} disabled={checking}>{checking ? '…' : 'Check'}</button>
        </div>
        {notFound && <div className="field-error">Plot not found in this project.</div>}
        {plot && <div className="found-chip">Plot {plot.plotNo} • {plot.status}</div>}
      </section>

      <section className="card form-card">
        <h4>Address</h4>
        <div className="inline-row">
          <div className="addr-box grow"><IconLocation size={18} /> {address ?? (fetching ? 'Fetching current location…' : 'Location unavailable')}</div>
          <button className="icon-btn" onClick={fetchAddress} aria-label="Refresh location"><IconRefresh size={18} /></button>
        </div>
      </section>

      <section className="card form-card">
        <h4>Selfie with Customer</h4>
        {selfie && <img className="selfie-preview" src={selfie.url} alt="Selfie preview" />}
        <div className="inline-row">
          <button className="btn btn-outline" onClick={() => camRef.current.click()}><IconCamera size={16} /> {selfie ? 'Retake' : 'Take Selfie'}</button>
          <button className="btn btn-outline" onClick={() => galRef.current.click()}><IconGallery size={16} /> Gallery</button>
        </div>
        <input ref={camRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => pick(e.target.files[0])} />
        <input ref={galRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />
      </section>

      <button className="btn btn-primary btn-block btn-lg" onClick={submit} disabled={saving}>
        {saving ? <span className="btn-spinner" /> : 'Submit Site Visit'}
      </button>

      <div className="list-head"><span>MY RECENT SITE VISITS</span></div>
      {visits === null ? <div className="muted">Loading…</div> : visits.length === 0 ? (
        <div className="muted center-text">No site visits logged yet</div>
      ) : (
        <div className="stack">
          {visits.map((v) => {
            const src = v.selfieUrl || (v.selfieBase64 ? `data:image/jpeg;base64,${v.selfieBase64}` : '');
            return (
              <div className="card visit-card" key={v.id}>
                {src ? <img src={src} alt="Selfie" /> : <div className="selfie-placeholder"><IconCamera size={24} /></div>}
                <div className="grow">
                  <div className="card-title">{v.projectName} • Plot {v.plotNo}</div>
                  <span className="status-badge" style={{ background: `${statusColor(v.plotStatus)}22`, color: statusColor(v.plotStatus) }}>{v.plotStatus}</span>
                  <div className="muted small">{v.address}</div>
                  <div className="muted small">{formatDateTime12(v.visitDate)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
