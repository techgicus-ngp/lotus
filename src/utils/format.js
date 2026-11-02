const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const formatCurrency = (v) => inr.format(Number(v) || 0);
export const formatNumber = (v) => num.format(Number(v) || 0);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];
const pad = (n) => String(n).padStart(2, '0');

export const toDate = (v) => (v?.toDate ? v.toDate() : v instanceof Date ? v : v ? new Date(v) : null);

/** 30 Oct 2026 */
export function formatDate(v) {
  const d = toDate(v);
  return d ? `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '';
}
/** 30 Oct 26 */
export function formatDateShort(v) {
  const d = toDate(v);
  return d ? `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : '';
}
/** 30 October 2026 */
export function formatDateLong(v) {
  const d = toDate(v);
  return d ? `${pad(d.getDate())} ${FULL_MONTHS[d.getMonth()]} ${d.getFullYear()}` : '';
}
/** 30 Oct 2026, 06:30 PM */
export function formatDateTime12(v) {
  const d = toDate(v);
  if (!d) return '';
  const h = d.getHours() % 12 || 12;
  return `${formatDate(d)}, ${pad(h)}:${pad(d.getMinutes())} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
}
/** yyyy-mm-dd for <input type="date"> */
export function toInputDate(v) {
  const d = toDate(v);
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '';
}
export const fromInputDate = (s) => (s ? new Date(`${s}T00:00:00`) : null);

export const capitalizeType = (t = '') => {
  const map = {
    road: 'Road', open_space: 'Open Space', plot: 'Plot', standard: 'Standard',
    auto_fill: 'Auto Fill', circular: 'Circular', straight: 'Straight', curve: 'Curve',
  };
  if (!t) return t;
  return map[t] ?? t[0].toUpperCase() + t.slice(1).toLowerCase();
};
