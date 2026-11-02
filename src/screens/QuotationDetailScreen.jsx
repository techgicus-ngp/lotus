import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useToast } from '../components/Toast';
import { CenterSpinner, ConfirmDialog, Modal } from '../components/Common';
import { deleteQuotation, getQuotation } from '../services/quotationService';
import { formatCurrency, formatDate, formatDateLong, formatNumber } from '../utils/format';
import { isAdmin } from '../models/user';
import { IconBack, IconCalendar, IconDelete, IconHome, IconLanguage, IconPerson, IconPrint } from '../icons';

export const SOCIALS = [['IG', '#C13584'], ['FB', '#1877F2'], ['TW', '#1DA1F2'], ['YT', '#FF0000'], ['SK', '#00AFF0']];

function InfoCard({ title, icon, rows }) {
  return (
    <div className="card info-card">
      <h4 className="section-title">{icon}{title}</h4>
      {rows.map(([k, v]) => (
        <div className="detail-row" key={k}><span className="muted">{k}</span><b>{v || '—'}</b></div>
      ))}
    </div>
  );
}

function AmountSection({ title, rows }) {
  return (
    <div className="card amount-card">
      <h4 className="section-title">{title}</h4>
      {rows.map(([label, value, opts = {}]) => (
        <div className={`detail-row ${opts.bold ? 'bold' : ''} ${opts.auto ? 'auto' : ''}`} key={label}>
          <span>{label}</span><b>{formatCurrency(value)}</b>
        </div>
      ))}
    </div>
  );
}

export default function QuotationDetailScreen() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useSession();
  const toast = useToast();
  const [q, setQ] = useState(state?.quotation ?? null);
  const [loading, setLoading] = useState(!q);
  const [langOpen, setLangOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    getQuotation(id).then((x) => { setQ(x); setLoading(false); })
      .catch((e) => { toast(`Error: ${e.message}`, { error: true }); setLoading(false); });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <CenterSpinner />;
  if (!q) return <div className="center-fill"><p>Quotation not found.</p><button className="btn btn-primary" onClick={() => navigate('/')}>Home</button></div>;

  const admin = isAdmin(user);
  const refNo = q.id ? q.id.slice(0, 8).toUpperCase() : '';
  const milestones = [
    ['Booking Date', q.bookingDate], ['Down Payment Date', q.downPaymentDate],
    ['Agreement Date', q.agreementDate], ['Sale Deed Date', q.saleDeederDate],
  ];

  async function remove() {
    try { await deleteQuotation(q.id); navigate(-1); } catch (e) { toast(`Error: ${e.message}`, { error: true }); }
  }

  return (
    <div className="page detail-page">
      <div className="appbar blue">
        <button className="icon-btn-glass" onClick={() => navigate(-1)} aria-label="Back"><IconBack size={20} /></button>
        <h2 className="grow">Quotation Preview</h2>
        <button className="icon-btn-glass" title="Print / Download PDF" onClick={() => setLangOpen(true)}><IconPrint size={20} /></button>
        {admin && <button className="icon-btn-glass" title="Delete Quotation" onClick={() => setConfirm(true)}><IconDelete size={20} /></button>}
      </div>

      <div className="detail-body">
        {/* letterhead */}
        <div className="card letterhead">
          <div className="muted center-text">|| श्री ||</div>
          <div className="lh-row">
            <img src="/assets/logo_icon.png" alt="Lotus Infra" />
            <div className="lh-brand">
              <div className="lh-lotus">LOTUS</div><div className="lh-infra">INFRA</div>
              <div className="lh-tag">PLOT · FLAT · FARMHOUSE</div>
            </div>
            <div className="lh-addr">
              Corporate Office : Plot No.1, "Planet Apartment" Flat No. 301/302, Near Sahyadri Lawn, Omkar Nagar, Nagpur 440024. Mob. 7020413627
              <div className="chip-row"><span className="small">Follow Us :</span>
                {SOCIALS.map(([t, c]) => <span key={t} className="social-dot" style={{ background: c }}>{t}</span>)}
              </div>
            </div>
          </div>
          <div className="two-col">
            <div className="ref-box"><span>Ref. No.</span><b>{refNo}</b></div>
            <div className="ref-box"><span>Date</span><b>{formatDateLong(q.quotationDate)}</b></div>
          </div>
        </div>

        <div className="two-col top">
          <InfoCard title="Customer" icon={<IconPerson size={18} />} rows={[['Name', q.customerName], ['Mobile', q.mobileNumber], ['Address', q.address]]} />
          <InfoCard title="Project" icon={<IconHome size={18} />} rows={[
            ['Project', q.projectName], ['Plot No.', q.plotNumber], ['Plot Size', `${formatNumber(q.plotSize)} sq ft`],
            ['Rate', `${formatCurrency(q.ratePerSqFt)}/sq ft`], ['By', q.createdByName],
          ]} />
        </div>

        <AmountSection title="Plot Amount" rows={[
          ['Total Plot Amount', q.totalPlotAmount, { bold: true }],
          // NOTE: kept as in the Flutter app (label/percent says 20%, while the form uses 30%).
          ['Agreement Amount (20%)', q.totalPlotAmount * 0.2],
          ['Booking Amount', q.bookingAmount],
          ['Down Payment', q.downPayment],
          ['balance Amount ', q.loanAmount, { auto: true, bold: true }],
        ]} />
        <AmountSection title="Stamp Duty & Registration" rows={[
          [`Stamp Duty (${q.stampDutyPercent.toFixed(0)}%)`, q.stampDutyAmount],
          [`Registration (${q.registrationPercent.toFixed(0)}%)`, q.registrationAmount],
          ['Sub Total', q.stampDutyAmount + q.registrationAmount, { bold: true }],
        ]} />
        <AmountSection title="Administrative Charges" rows={[
          ['Legal Fees', q.legalFees], ['Mutation', q.mutation], ['Agreement', q.agreement],
          ['Data Entry', q.dataEntry], ['Society Charges', q.societyCharges], ['Admin Total', q.adminTotal, { bold: true }],
        ]} />
        <AmountSection title="Corpus Fund" rows={[['Corpus Fund (One-time)', q.corpusFund]]} />

        {milestones.some(([, d]) => d) && (
          <div className="card amount-card">
            <h4 className="section-title"><IconCalendar size={18} /> Payment Milestone Dates</h4>
            {milestones.map(([label, d]) => (
              <div className="detail-row" key={label}><span>{label}</span><b>{d ? formatDate(d) : 'Not set'}</b></div>
            ))}
          </div>
        )}

        <div className="final-total-card">
          <div><div className="eyebrow light">FINAL TOTAL AMOUNT</div><div className="muted-light small">All inclusive</div></div>
          <div className="final-amount">{formatCurrency(q.finalTotalAmount)}</div>
        </div>

        <button className="btn btn-primary btn-block btn-lg" onClick={() => setLangOpen(true)}>
          <IconPrint size={18} /> Download / Print PDF
        </button>
      </div>

      <Modal open={langOpen} onClose={() => setLangOpen(false)}>
        <h3 className="dlg-title">Choose Print Language</h3>
        <button className="list-tile" onClick={() => navigate(`/quotations/${q.id}/print/en`, { state: { quotation: q } })}>
          <IconLanguage size={20} /> English Print
        </button>
        <button className="list-tile" onClick={() => navigate(`/quotations/${q.id}/print/hi`, { state: { quotation: q } })}>
          <IconLanguage size={20} /> हिंदी प्रिंट (Hindi Print)
        </button>
      </Modal>

      <ConfirmDialog open={confirm} title="Delete Quotation"
        message={`Delete quotation for ${q.customerName}? This cannot be undone.`}
        onCancel={() => setConfirm(false)} onConfirm={remove} />
    </div>
  );
}
