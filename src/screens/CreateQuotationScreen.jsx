import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useToast } from '../components/Toast';
import { CenterSpinner } from '../components/Common';
import { createQuotation, getQuotation, updateQuotation } from '../services/quotationService';
import { findPlotAnywhere } from '../services/mapService';
import { autoRegistration, calculate, round0 } from '../utils/quotationCalc';
import { formatCurrency, fromInputDate, toInputDate } from '../utils/format';
import { BOOKING_AMOUNT_TIERS, DOWN_PAYMENT_OPTIONS, EMI_MONTH_OPTIONS, PAYMENT_MODES } from '../constants';
import {
  IconApartment, IconAuto, IconBack, IconBank, IconBusiness, IconCake, IconCalendar, IconClose, IconData,
  IconEventNote, IconGavel, IconGrid, IconLocation, IconLockSmall, IconPercent, IconPerson, IconPhone,
  IconReset, IconRupee, IconSave, IconSavings, IconSearch, IconSubject, IconTerrain, IconTicket, IconWork,
} from '../icons';

// ── Stable (module-level) field components so inputs keep focus ───────────
function Section({ title, icon, children }) {
  return (
    <section className="card form-card">
      <h4 className="section-title">{icon}{title}</h4>
      <div className="stack">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, icon, type = 'text', readOnly, auto, required, error, multiline, onReset, resetHint }) {
  const cls = `outlined-field ${readOnly ? 'ro' : ''} ${auto ? 'auto' : ''} ${error ? 'has-error' : ''}`;
  const common = {
    value: value ?? '', placeholder: label, readOnly,
    onChange: onChange ? (e) => onChange(e.target.value) : undefined,
  };
  return (
    <div className="form-row">
      <label className={cls}>
        <span className="of-icon">{icon}</span>
        {multiline ? <textarea rows={2} {...common} /> : (
          <input {...common} type={type} inputMode={type === 'number' ? 'decimal' : undefined} />
        )}
        {readOnly && <IconLockSmall size={14} color="#999" />}
        {auto && !readOnly && (onReset
          ? <button type="button" className="field-suffix" title={resetHint} onClick={onReset}><IconReset size={16} /></button>
          : <IconAuto size={14} color="#2E7D32" title="Auto-calculated — tap to edit" />)}
      </label>
      <div className="of-label">{label}{required ? ' *' : ''}</div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

function DateField({ label, value, onChange, icon }) {
  return (
    <div className="form-row">
      <label className="outlined-field">
        <span className="of-icon">{icon}</span>
        <input type="date" value={toInputDate(value)} onChange={(e) => onChange(fromInputDate(e.target.value))} />
      </label>
      <div className="of-label">{label}</div>
    </div>
  );
}

const blank = {
  customerName: '', mobileNumber: '', address: '', projectName: '', plotNumber: '', plotSize: '', ratePerSqFt: '',
  bookingAmount: '5000', stampDutyPercent: '6', legalFees: '5600', mutation: '2000', agreement: '1500',
  dataEntry: '300', societyCharges: '2000', corpusFund: '25000', customerAge: '', nomineeName: '', nomineeAge: '',
  relationWithCustomer: '', profession: '', mouza: '', khNo: '', alternateNumber: '', application: '', subject: '', advanceEmi: '',
};

export default function CreateQuotationScreen() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useSession();
  const toast = useToast();

  const [loading, setLoading] = useState(!!id);
  const [existing, setExisting] = useState(null);
  const [f, setF] = useState(blank);
  const [plot, setPlot] = useState(null);
  const [plotSearch, setPlotSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [downOption, setDownOption] = useState('30%');
  const [manualDown, setManualDown] = useState(null);
  const [totalOverride, setTotalOverride] = useState(null);
  const [emiMonths, setEmiMonths] = useState(null);
  const [manualEmi, setManualEmi] = useState(null);
  const [emiDate, setEmiDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('Monthly');
  const [quotationDate, setQuotationDate] = useState(new Date());
  const [dates, setDates] = useState({ booking: null, down: null, agreement: null, saleDeed: null });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  // Load existing (edit) or apply the plot pre-selected on the map.
  useEffect(() => {
    if (id) {
      getQuotation(id).then((e) => {
        if (!e) { toast('Quotation not found', { error: true }); return navigate('/'); }
        setExisting(e);
        setF({
          ...blank,
          ...Object.fromEntries(Object.keys(blank).map((k) => [k, e[k] == null ? '' : String(e[k])])),
          advanceEmi: e.advanceEmi > 0 ? String(e.advanceEmi) : '',
        });
        setQuotationDate(e.quotationDate);
        setPlotSearch(e.plotNumber);
        setDownOption(`${Math.round(e.downPaymentPercent)}%`);
        setPaymentMode(e.paymentMode);
        setEmiDate(e.emiDate);
        if (e.emiMonths > 0) setEmiMonths(e.emiMonths);
        else if (e.emiAmount > 0) setManualEmi(String(e.emiAmount));
        setDates({ booking: e.bookingDate, down: e.downPaymentDate, agreement: e.agreementDate, saleDeed: e.saleDeederDate });
        setLoading(false);
      }).catch((err) => { toast(`Error: ${err.message}`, { error: true }); setLoading(false); });
    } else if (state?.plot) {
      applyPlot(state.plot, state.mapName ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function applyPlot(p, mapName) {
    setPlot(p); setPlotSearch(p.plotNo); setNotFound(false); setTotalOverride(null);
    setF((prev) => ({ ...prev, plotNumber: p.plotNo, plotSize: round0(p.areaSqFt), projectName: mapName }));
  }
  function clearPlot() {
    setPlot(null); setPlotSearch(''); setNotFound(false); setManualDown(null); setTotalOverride(null);
    setF((p) => ({ ...p, plotNumber: '', plotSize: '', projectName: '' }));
  }
  async function searchPlot() {
    const q = plotSearch.trim();
    if (!q) return;
    setSearching(true); setNotFound(false); setPlot(null);
    try {
      const hit = await findPlotAnywhere(q);
      if (hit) applyPlot(hit.plot, hit.mapName); else setNotFound(true);
    } catch (e) { toast(`Error searching plot: ${e.message}`, { error: true }); }
    setSearching(false);
  }

  // ── calculations ────────────────────────────────────────────────────────
  const downPct = parseFloat(downOption) || 20;
  const calc = useMemo(
    () => calculate(f, { downPaymentPercent: downPct, manualDownPayment: manualDown, totalOverride }),
    [f, downPct, manualDown, totalOverride],
  );
  const downShown = manualDown ?? (calc.total > 0 ? round0(calc.down) : '');
  const emiShown = manualEmi ?? (emiMonths && calc.loan > 0 ? round0(calc.loan / emiMonths) : '');

  async function save() {
    const e = {};
    const req = { customerName: 'Required', mobileNumber: 'Required', projectName: 'Required', plotNumber: 'Required', plotSize: 'Required', ratePerSqFt: 'Required' };
    Object.entries(req).forEach(([k, m]) => { if (!String(f[k]).trim()) e[k] = m; });
    setErrors(e);
    if (Object.keys(e).length) return toast('Please fill the required fields', { error: true });
    if (!plot && !existing) return toast('Please search and select a plot first', { error: true });

    const n = (v) => parseFloat(v) || 0;
    const q = {
      customerName: f.customerName.trim(), mobileNumber: f.mobileNumber.trim(), address: f.address.trim(),
      projectName: f.projectName.trim(), plotNumber: f.plotNumber.trim(),
      plotSize: n(f.plotSize), ratePerSqFt: n(f.ratePerSqFt), totalPlotAmount: calc.total,
      bookingAmount: n(f.bookingAmount), downPayment: n(downShown), loanAmount: calc.loan,
      stampDutyPercent: parseFloat(f.stampDutyPercent) || 6, stampDutyAmount: calc.stampDuty,
      registrationPercent: 0, registrationAmount: calc.registration,
      legalFees: n(f.legalFees), mutation: n(f.mutation), agreement: n(f.agreement), dataEntry: n(f.dataEntry),
      societyCharges: n(f.societyCharges), adminTotal: calc.adminTotal, corpusFund: n(f.corpusFund),
      finalTotalAmount: calc.finalTotal, quotationDate,
      bookingDate: dates.booking, downPaymentDate: dates.down, agreementDate: dates.agreement, saleDeederDate: dates.saleDeed,
      createdByUid: existing?.createdByUid || user.uid, createdByName: existing?.createdByName || user.name,
      customerAge: f.customerAge.trim(), nomineeName: f.nomineeName.trim(), nomineeAge: f.nomineeAge.trim(),
      relationWithCustomer: f.relationWithCustomer.trim(), profession: f.profession.trim(),
      mouza: f.mouza.trim(), khNo: f.khNo.trim(),
      emiDate, emiAmount: n(emiShown), alternateNumber: f.alternateNumber.trim(),
      application: f.application.trim(), subject: f.subject.trim(), advanceEmi: n(f.advanceEmi),
      downPaymentPercent: downPct, emiMonths: emiMonths ?? 0, paymentMode,
    };
    setSaving(true);
    try {
      let qid = existing?.id;
      if (qid) await updateQuotation(qid, q); else qid = await createQuotation(q);
      navigate(`/quotations/${qid}`, { replace: true });
    } catch (err) { toast(`Error saving: ${err.message}`, { error: true }); }
    setSaving(false);
  }

  if (loading) return <CenterSpinner />;
  const bookingNow = Math.round(parseFloat(f.bookingAmount) || 0);

  return (
    <div className="page form-page">
      <div className="appbar">
        <button className="icon-btn-glass" onClick={() => navigate(-1)} aria-label="Back"><IconBack size={20} /></button>
        <h2 className="grow">{existing ? 'Edit Quotation' : 'New Quotation'}</h2>
        <button className="btn btn-gold" onClick={save} disabled={saving}><IconSave size={16} /> {saving ? 'Saving...' : 'Save'}</button>
      </div>

      <div className="form-body">
        {/* plot search */}
        <section className="card form-card">
          <h4 className="section-title"><IconSearch size={18} /> Find Plot</h4>
          <div className="inline-row">
            <input className="input" placeholder="Enter plot number" value={plotSearch}
              onChange={(e) => { setPlotSearch(e.target.value); setNotFound(false); }}
              onKeyDown={(e) => e.key === 'Enter' && searchPlot()} />
            <button className="btn btn-primary" onClick={searchPlot} disabled={searching}>{searching ? '…' : 'Search'}</button>
            {(plot || plotSearch) && <button className="icon-btn" onClick={clearPlot} aria-label="Clear"><IconClose size={18} /></button>}
          </div>
          {notFound && <div className="field-error">Plot not found in any project.</div>}
          {plot && (
            <div className="found-chip">
              Plot {plot.plotNo} • {plot.areaSqFt.toFixed(0)} sq ft • {plot.status}
            </div>
          )}
        </section>

        <Section title="Customer Details" icon={<IconPerson size={18} />}>
          <Field label="Customer Name" icon={<IconPerson size={18} />} value={f.customerName} onChange={set('customerName')} required error={errors.customerName} />
          <Field label="Mobile Number" icon={<IconPhone size={18} />} type="tel" value={f.mobileNumber} onChange={set('mobileNumber')} required error={errors.mobileNumber} />
          <Field label="Address" icon={<IconLocation size={18} />} value={f.address} onChange={set('address')} multiline />
        </Section>

        <Section title="Project Details" icon={<IconApartment size={18} />}>
          <Field label="Project Name" icon={<IconBusiness size={18} />} value={f.projectName} readOnly required error={errors.projectName} />
          <Field label="Plot Number" icon={<IconGrid size={18} />} value={f.plotNumber} readOnly required error={errors.plotNumber} />
        </Section>

        <Section title="Additional Details" icon={<IconPerson size={18} />}>
          <div className="two-col">
            <Field label="Age" icon={<IconCake size={18} />} value={f.customerAge} onChange={set('customerAge')} />
            <Field label="Profession" icon={<IconWork size={18} />} value={f.profession} onChange={set('profession')} />
          </div>
          <Field label="Relation with Customer" icon={<IconPerson size={18} />} value={f.relationWithCustomer} onChange={set('relationWithCustomer')} />
          <div className="two-col">
            <Field label="Nominee Name" icon={<IconPerson size={18} />} value={f.nomineeName} onChange={set('nomineeName')} />
            <Field label="Nominee Age" icon={<IconCake size={18} />} value={f.nomineeAge} onChange={set('nomineeAge')} />
          </div>
          <div className="two-col">
            <Field label="Mouza" icon={<IconTerrain size={18} />} value={f.mouza} onChange={set('mouza')} />
            <Field label="KH No." icon={<IconTicket size={18} />} value={f.khNo} onChange={set('khNo')} />
          </div>
        </Section>

        <Section title="Plot Amount" icon={<IconRupee size={18} />}>
          <div className="two-col">
            <Field label="Plot Size (sq ft)" icon={<IconGrid size={18} />} type="number" value={f.plotSize}
              onChange={(v) => { set('plotSize')(v); setTotalOverride(null); }} required error={errors.plotSize} />
            <Field label="Rate / sq ft" icon={<IconRupee size={18} />} type="number" value={f.ratePerSqFt}
              onChange={(v) => { set('ratePerSqFt')(v); setTotalOverride(null); }} required error={errors.ratePerSqFt} />
          </div>
          <Field label="Total Plot Amount" icon={<IconRupee size={18} />} auto type="number"
            value={totalOverride ?? (calc.total ? round0(calc.total) : '')} onChange={setTotalOverride}
            onReset={totalOverride != null ? () => setTotalOverride(null) : undefined} resetHint="Reset to size × rate" />
          <Field label="Agreement Amount (30% of Plot Amount)" icon={<IconRupee size={18} />} auto readOnly value={calc.agreementAmount ? round0(calc.agreementAmount) : ''} />

          {/* booking tiers */}
          <div>
            <div className="of-label strong">Booking (Token) Amount</div>
            <div className="chip-row wrap">
              {BOOKING_AMOUNT_TIERS.map(([amt, days]) => (
                <button type="button" key={amt} className={`chip ${bookingNow === amt ? 'on' : ''}`}
                  onClick={() => set('bookingAmount')(String(amt))}>₹{amt} · {days}d</button>
              ))}
            </div>
            <Field label="Booking Amount" icon={<IconRupee size={18} />} type="number" value={f.bookingAmount} onChange={set('bookingAmount')} />
            <div className="muted small">Token holds the plot for the shown number of days from booking.</div>
          </div>

          {/* down payment */}
          <select className="input" value={downOption} onChange={(e) => { setDownOption(e.target.value); setManualDown(null); }}>
            {DOWN_PAYMENT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Field label={`Down Payment (${downOption} of Total − Booking — editable)`} icon={<IconRupee size={18} />} type="number" auto
            value={downShown} onChange={setManualDown}
            onReset={manualDown != null ? () => setManualDown(null) : undefined} resetHint={`Reset to ${downOption} auto`} />
          <Field label="Balance Amount" icon={<IconBank size={18} />} auto readOnly value={calc.loan ? round0(calc.loan) : ''} />
        </Section>

        <Section title="Payment Milestone Dates" icon={<IconEventNote size={18} />}>
          <DateField label="Booking Date" icon={<IconCalendar size={18} />} value={dates.booking} onChange={(d) => setDates({ ...dates, booking: d })} />
          <DateField label="Down Payment Date" icon={<IconCalendar size={18} />} value={dates.down} onChange={(d) => setDates({ ...dates, down: d })} />
          <DateField label="Agreement Date" icon={<IconCalendar size={18} />} value={dates.agreement} onChange={(d) => setDates({ ...dates, agreement: d })} />
          <DateField label="Sale Deed Date" icon={<IconCalendar size={18} />} value={dates.saleDeed} onChange={(d) => setDates({ ...dates, saleDeed: d })} />
        </Section>

        <Section title="Stamp Duty & Registration" icon={<IconBank size={18} />}>
          <div className="two-col">
            <Field label="Stamp Duty %" icon={<IconPercent size={18} />} type="number" value={f.stampDutyPercent} onChange={set('stampDutyPercent')} />
            <Field label="Stamp Duty Amount" icon={<IconRupee size={18} />} auto readOnly value={round0(calc.stampDuty)} />
          </div>
          <Field label="Registration Amount (1% if ≤ ₹30L, else ₹30,000)" icon={<IconRupee size={18} />} auto readOnly value={round0(autoRegistration(calc.total))} />
        </Section>

        <Section title="Administrative Charges" icon={<IconGavel size={18} />}>
          <div className="two-col">
            <Field label="Legal Fees" icon={<IconGavel size={18} />} type="number" value={f.legalFees} onChange={set('legalFees')} />
            <Field label="Mutation" icon={<IconData size={18} />} type="number" value={f.mutation} onChange={set('mutation')} />
            <Field label="Agreement" icon={<IconData size={18} />} type="number" value={f.agreement} onChange={set('agreement')} />
            <Field label="Data Entry" icon={<IconData size={18} />} type="number" value={f.dataEntry} onChange={set('dataEntry')} />
          </div>
          <Field label="Society Charges" icon={<IconApartment size={18} />} type="number" value={f.societyCharges} onChange={set('societyCharges')} />
          <Field label="Admin Total" icon={<IconRupee size={18} />} auto readOnly value={round0(calc.adminTotal)} />
        </Section>

        <Section title="Corpus Fund" icon={<IconSavings size={18} />}>
          <Field label="Corpus Fund (One-time)" icon={<IconSavings size={18} />} type="number" value={f.corpusFund} onChange={set('corpusFund')} />
        </Section>

        <Section title="EMI Details" icon={<IconEventNote size={18} />}>
          <div>
            <div className="of-label strong">EMI Options (18, 24 &amp; 35 Months)</div>
            <div className="chip-row wrap">
              {EMI_MONTH_OPTIONS.map((m) => (
                <button type="button" key={m} className={`chip ${emiMonths === m ? 'on' : ''}`}
                  onClick={() => { setEmiMonths(emiMonths === m ? null : m); setManualEmi(null); }}>{m} Months</button>
              ))}
            </div>
          </div>
          <div>
            <div className="of-label strong">Payment Mode</div>
            <div className="chip-row">
              {PAYMENT_MODES.map((m) => (
                <button type="button" key={m} className={`chip ${paymentMode === m ? 'on' : ''}`} onClick={() => setPaymentMode(m)}>{m}</button>
              ))}
            </div>
            {paymentMode === 'Seasonal' && (
              <div className="muted small">Customer pays any amount, any time, as long as the balance clears within the selected tenure.</div>
            )}
          </div>
          <select className="input" value={emiDate} onChange={(e) => setEmiDate(e.target.value)}>
            <option value="">EMI Date (1 to 20)</option>
            {Array.from({ length: 20 }, (_, i) => String(i + 1)).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <Field label={emiMonths ? `EMI Amount (Balance ÷ ${emiMonths} mo.)` : 'EMI Amount'} icon={<IconRupee size={18} />} type="number" auto
            value={emiShown} onChange={setManualEmi}
            onReset={manualEmi != null ? () => setManualEmi(null) : undefined} resetHint="Reset to auto-calculated" />
          <Field label="Alternate No." icon={<IconPhone size={18} />} type="tel" value={f.alternateNumber} onChange={set('alternateNumber')} />
          <Field label="Application (अर्ज)" icon={<IconSubject size={18} />} value={f.application} onChange={set('application')} multiline />
          <Field label="Subject (विषय)" icon={<IconSubject size={18} />} value={f.subject} onChange={set('subject')} multiline />
          <Field label="Advance EMI" icon={<IconRupee size={18} />} type="number" value={f.advanceEmi} onChange={set('advanceEmi')} />
        </Section>

        <DateField label="Quotation Date" icon={<IconCalendar size={18} />} value={quotationDate} onChange={(d) => d && setQuotationDate(d)} />
      </div>

      <div className="final-bar">
        <div>
          <div className="eyebrow light">FINAL TOTAL AMOUNT</div>
          <div className="muted-light small">Plot + admin charges + corpus fund</div>
        </div>
        <div className="final-amount">{formatCurrency(calc.finalTotal)}</div>
      </div>
    </div>
  );
}
