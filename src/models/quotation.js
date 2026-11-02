const num = (v, d = 0) => (v == null || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
const date = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const iso = (d) => (d ? new Date(d).toISOString() : null);

export function quotationFromDoc(data, id) {
  return {
    id,
    customerName: data.customerName ?? '',
    mobileNumber: data.mobileNumber ?? '',
    address: data.address ?? '',
    projectName: data.projectName ?? '',
    plotNumber: data.plotNumber ?? '',
    plotSize: num(data.plotSize),
    ratePerSqFt: num(data.ratePerSqFt),
    totalPlotAmount: num(data.totalPlotAmount),
    bookingAmount: num(data.bookingAmount),
    downPayment: num(data.downPayment),
    loanAmount: num(data.loanAmount),
    stampDutyPercent: num(data.stampDutyPercent, 6),
    stampDutyAmount: num(data.stampDutyAmount),
    registrationPercent: num(data.registrationPercent, 1),
    registrationAmount: num(data.registrationAmount),
    legalFees: num(data.legalFees),
    mutation: num(data.mutation),
    agreement: num(data.agreement),
    dataEntry: num(data.dataEntry),
    societyCharges: num(data.societyCharges),
    adminTotal: num(data.adminTotal),
    corpusFund: num(data.corpusFund),
    finalTotalAmount: num(data.finalTotalAmount),
    quotationDate: date(data.quotationDate) ?? new Date(),
    bookingDate: date(data.bookingDate),
    downPaymentDate: date(data.downPaymentDate),
    agreementDate: date(data.agreementDate),
    saleDeederDate: date(data.saleDeederDate), // (sic) field name kept for compatibility
    createdByUid: data.createdByUid ?? '',
    createdByName: data.createdByName ?? '',
    customerAge: data.customerAge ?? '',
    nomineeName: data.nomineeName ?? '',
    nomineeAge: data.nomineeAge ?? '',
    relationWithCustomer: data.relationWithCustomer ?? '',
    profession: data.profession ?? '',
    mouza: data.mouza ?? '',
    khNo: data.khNo ?? '',
    emiDate: data.emiDate ?? '',
    emiAmount: num(data.emiAmount),
    alternateNumber: data.alternateNumber ?? '',
    application: data.application ?? '',
    subject: data.subject ?? '',
    advanceEmi: num(data.advanceEmi),
    downPaymentPercent: num(data.downPaymentPercent, 20),
    emiMonths: Math.trunc(num(data.emiMonths)),
    paymentMode: data.paymentMode ?? 'Monthly',
  };
}

/** Plain object ready for Firestore (dates → ISO strings; `id` is dropped). */
export function quotationToMap(q) {
  const { id, ...rest } = q; // eslint-disable-line no-unused-vars
  return {
    ...rest,
    quotationDate: iso(q.quotationDate),
    bookingDate: iso(q.bookingDate),
    downPaymentDate: iso(q.downPaymentDate),
    agreementDate: iso(q.agreementDate),
    saleDeederDate: iso(q.saleDeederDate),
  };
}
