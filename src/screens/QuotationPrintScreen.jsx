import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CenterSpinner } from '../components/Common';
import { getQuotation } from '../services/quotationService';
import { formatCurrency, formatDate } from '../utils/format';
import { SOCIALS } from './QuotationDetailScreen';
import { IconBack, IconPrint } from '../icons';

const TERMS_EN = [
  'If the plot installment is not paid continuously for 3 months, the company reserves the right to cancel the plot.',
  'If the plot is cancelled, 35% will be deducted from the amount paid; the balance amount will be refunded within 45 days.',
  'The registry expense will be borne by the plot holder, and the document charges will be borne by the customer.',
  'If the plot location changes slightly due to the Town Planning (T.P.) authority, it shall be acceptable to the customer.',
  'A penalty of ₹100 per month will be charged if the monthly installment is not paid on time or remains outstanding.',
  'The token amount paid by any customer for a plot will not be refunded.',
  'The registry of the plot purchased by the customer will be completed within 3 years.',
  'This letter shall be considered as the final notice to the customer.',
];
const TERMS_HI = [
  'प्लॉट की किस्त लगातार 3 महिने नही आने पर प्लॉट को रद्द करने का अधिकार कंपनी के पास रहेगा।',
  'प्लॉट रद्द होने पर भरी हुई रक्कम में से 35% काटकर मिलेगी वह रक्कम 45 दिन के भीतर मिलेगी।',
  'रजिस्ट्री का खर्चा प्लॉट धारक को करना होगा व डॉक्युमेंट चार्ज का खर्चा ग्राहक को करना पडेगा।',
  'अगर प्लॉट का लोकेशन T.P. व्दारा थोडा बहुत बदला है तो वह ग्राहक को मान्य होगा।',
  'मासिक किस्त समय पर नहीं भरणे पर या बची रहने पर 100/-रु प्रति महिना दंड लगेगा।',
  'किसी भी ग्राहक को प्लॉट की टोकन राशी वापस नही की जायेगी।',
  'कस्टमर के व्दारा लिए गए प्लॉट की रजिस्ट्री 3 वर्ष के अंतर्गत ही की जाएगी।',
  'यह पत्र ही ग्राहक के लीये अंतीम सुचना माना जाएगा।',
];
const DECL_EN = 'I have fully read and understood the rules mentioned in this booking form and have decided to purchase the plot accordingly. In case of any violation of the above rules, I shall be liable for any action taken by the company as per its rules.';
const DECL_HI = 'ईस बुकींग फॉर्म मे लिखे हुये नियमो को पुरी तरह पढकर और समझकर मैने प्लॉट लेने का निर्णय लिया है। उपर लिखे हुये नियमो का उल्लंघन होता है, तो मैं कंपनी के नियमो के मुताबिक कीसी भी कारवाई लिए बाध्य रहूंगा।';

const Field = ({ label, value, grow = true }) => (
  <div className="pf" style={grow ? { flex: 1 } : undefined}>
    <span className="pf-label">{label}</span><span className="pf-colon">:</span><span className="pf-value">{value || '\u00A0'}</span>
  </div>
);

function Header({ q, hi }) {
  return (
    <div className="ph">
      <div className="center-text small">{hi ? '|| श्री ||' : '|| Shree ||'}</div>
      <div className="ph-row">
        <img src="/assets/logo_icon.png" alt="" />
        <div className="ph-brand"><div className="ph-lotus">LOTUS</div><div className="ph-infra">INFRA</div><div className="ph-tag">PLOT - FLAT - FARMHOUSE</div></div>
        <div className="ph-sep" />
        <div className="grow small">
          Corporate Office : Plot No.1, "Planet Apartment" Flat No. 301/302,<br />Near Sahyadri Lawn, Omkar Nagar, Nagpur 440024. Mob. 7020413627
          <div className="chip-row"><b className="maroon">Follow Us :</b>
            {SOCIALS.map(([t, c]) => <span key={t} className="social-dot sm" style={{ background: c }}>{t}</span>)}
          </div>
        </div>
        <div>
          <div className="ph-ref"><b>Ref. No.</b><span>{q.id ? q.id.slice(0, 8).toUpperCase() : ''}</span></div>
          <div className="ph-ref"><b>Date</b><span>{formatDate(q.quotationDate)}</span></div>
        </div>
      </div>
    </div>
  );
}

export default function QuotationPrintScreen() {
  const { id, lang } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const hi = lang === 'hi';
  const t = (en, h) => (hi ? h : en);
  const [q, setQ] = useState(state?.quotation ?? null);

  useEffect(() => { if (!q) getQuotation(id).then(setQ); }, [id, q]);
  // Open the browser print dialog once the page (and fonts/images) have rendered.
  useEffect(() => {
    if (!q) return undefined;
    const h = setTimeout(() => document.fonts.ready.then(() => window.print()), 600);
    return () => clearTimeout(h);
  }, [q]);

  if (!q) return <CenterSpinner />;

  const downPct = q.downPaymentPercent > 0 ? q.downPaymentPercent : 30;
  const months = q.emiMonths > 0 ? q.emiMonths : null;
  const balance = q.loanAmount;
  const monthlyEmi = q.emiAmount > 0 ? q.emiAmount : months && balance > 0 ? balance / months : 0;
  const Chip = ({ on, children }) => <span className={`pchip ${on ? 'on' : ''}`}>{children}</span>;

  return (
    <div className={`print-root ${hi ? 'is-hi' : ''}`}>
      <div className="print-toolbar no-print">
        <button className="btn btn-outline" onClick={() => navigate(-1)}><IconBack size={16} /> Back</button>
        <span className="muted">Choose “Save as PDF” in the print dialog to download.</span>
        <button className="btn btn-primary" onClick={() => window.print()}><IconPrint size={16} /> Print / Save PDF</button>
      </div>

      {/* PAGE 1 — customer details & terms */}
      <section className="print-page">
        <Header q={q} hi={hi} />
        <div className="p-bar">CUSTOMER DETAIL INFORMATION</div>
        <div className="p-split">
          <div className="grow">
            <div className="p-row"><Field label="NAME" value={q.customerName} /><Field label="AGE" value={q.customerAge} /></div>
            <div className="p-row"><Field label="ADD" value={q.address} /></div>
            <div className="p-row"><Field label="NOMINEE" value={q.nomineeName} /><Field label="AGE" value={q.nomineeAge} /></div>
            <div className="p-row"><Field label="RELATION WITH CUSTOMER" value={q.relationWithCustomer} /></div>
            <div className="p-row"><Field label="PROFESSION" value={q.profession} /><Field label="CONT. NO" value={q.mobileNumber} /></div>
          </div>
          <div className="photo-box">AFFIX<br />PHOTO</div>
        </div>
        <div className="p-row"><Field label="PLOT NO" value={q.plotNumber} /><Field label="MOUZA" value={q.mouza} /><Field label="KH.NO" value={q.khNo} /></div>
        <div className="p-row"><Field label="LAYOUT NAME" value={q.projectName} /></div>

        <div className="p-bar">COMPANY TERMS &amp; CONDITIONS</div>
        <ol className="terms">{(hi ? TERMS_HI : TERMS_EN).map((x, i) => <li key={i}>{x}</li>)}</ol>
        <div className="declaration">{hi ? DECL_HI : DECL_EN}</div>

        <div className="p-sign">
          <b>SENIOR EXECUTIVE</b>
          <div>ADVISOR NAME : {q.createdByName}</div>
          <div className="p-sign-row">
            <div><div>Date : {formatDate(q.quotationDate)}</div><div style={{ marginTop: 10 }}>Place :</div></div>
            <div className="right"><div>{t('Sign :-', 'सही :-')}</div><div>{t('Name :-', 'नाम :-')}</div><b>Authorised Signatory</b></div>
          </div>
        </div>
      </section>

      {/* PAGE 2 — EMI details */}
      <section className="print-page">
        <div className="pill-header">EMI DETAIL INFORMATION</div>

        <div className="emi-block">
          <div className="maroon"><b>DOWN PAYMENT &amp; EMI OPTIONS</b></div>
          <div className="pm-label">Down Payment Option</div>
          <div>{[15, 30, 50].map((p) => <Chip key={p} on={p === downPct}>{p}%</Chip>)}</div>
          <div className="pm-label">EMI Options (18, 24 &amp; 35 Months)</div>
          <div>{[18, 24, 35].map((m) => <Chip key={m} on={m === months}>{balance > 0 ? `${m} Months — ${formatCurrency(balance / m)}` : `${m} Months`}</Chip>)}</div>
          <div className="pm-label">Payment Mode</div>
          <div>{['Monthly', 'Seasonal'].map((m) => <Chip key={m} on={m === q.paymentMode}>{m === 'Monthly' ? 'Monthly EMI' : 'Seasonal'}</Chip>)}</div>
          <hr />
          <div className="pm-label">EMI Calculation</div>
          <div className="calc-tiles">
            <div><span>Balance Amount</span><b>{balance > 0 ? formatCurrency(balance) : '—'}</b></div>
            <div><span>Tenure</span><b>{months ? `${months} Months` : '—'}</b></div>
            <div className="hl"><span>Monthly EMI</span><b>{monthlyEmi > 0 ? formatCurrency(monthlyEmi) : '—'}</b></div>
          </div>
        </div>

        <div className="emi-row"><b>EMI DATE</b><span>:</span><div className="emi-val">{q.emiDate}</div><small>1 To 20</small></div>
        <div className="emi-row"><b>EMI AMOUNT</b><span>:</span><div className="emi-val">{q.emiAmount > 0 ? formatCurrency(q.emiAmount) : ''}</div></div>
        <div className="emi-row"><b>ALTERNATE NO.</b><span>:</span><div className="emi-val">{q.alternateNumber}</div></div>
        <div><b>APPLICATION :</b> <small>(अर्ज)</small></div>
        <div className="text-box" style={{ height: 70 }}>{q.application}</div>
        <div><b>SUBJECT :</b> <small>(विषय)</small></div>
        <div className="text-box" style={{ height: 55 }}>{q.subject}</div>
        <div className="emi-row"><b>ADVANCE EMI</b><span>:</span><div className="emi-val">{q.advanceEmi > 0 ? formatCurrency(q.advanceEmi) : ''}</div></div>

        <div className="p-sign-row bottom">
          <div><b>Customer Signature</b><div className="sig-line" /></div>
          <div className="right"><b>Advisor Signature</b><div className="sig-line" /></div>
        </div>
      </section>
    </div>
  );
}
