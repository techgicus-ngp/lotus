// Pure port of the Dart `_recalculate` logic in create_quotation_screen.dart.

const n = (v, fallback = 0) => {
  const x = parseFloat(v);
  return Number.isNaN(x) ? fallback : x;
};
const clamp0 = (x) => Math.max(0, x);

/** Registration: 1% of total up to ₹30 L, flat ₹30,000 above that. */
export const autoRegistration = (total) => (total <= 3_000_000 ? total * 0.01 : 30_000);

/**
 * @param f  form values (strings):
 *   plotSize, ratePerSqFt, bookingAmount, stampDutyPercent, legalFees, mutation,
 *   agreement, dataEntry, societyCharges, corpusFund
 * @param opts
 *   downPaymentPercent  number (e.g. 30)
 *   manualDownPayment   string | null — set once the user typed a down payment
 *   totalOverride       string | null — set once the user edited "Total Plot Amount"
 */
export function calculate(f, { downPaymentPercent = 20, manualDownPayment = null, totalOverride = null } = {}) {
  const size = n(f.plotSize);
  const rate = n(f.ratePerSqFt);
  const booking = n(f.bookingAmount);
  const sdPct = n(f.stampDutyPercent, 6);

  const total = totalOverride != null && totalOverride !== '' ? n(totalOverride) : size * rate;
  const agreementAmount = total * 0.3;

  let down;
  if (manualDownPayment != null) down = n(manualDownPayment);
  else if (total > 0) down = clamp0(total * (downPaymentPercent / 100) - booking);
  else down = 0;

  const loan = clamp0(total - booking - down);
  const stampDuty = (total * sdPct) / 100;
  const registration = autoRegistration(total);
  const adminTotal =
    stampDuty + registration + n(f.legalFees) + n(f.mutation) + n(f.agreement) + n(f.dataEntry) + n(f.societyCharges);
  const finalTotal = total + adminTotal + n(f.corpusFund);

  return { total, agreementAmount, down, loan, stampDuty, registration, adminTotal, finalTotal };
}

export const round0 = (x) => String(Math.round(x));
