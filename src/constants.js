// Firestore document IDs (in the `maps` collection) that employees and
// guests are allowed to browse/open.
export const ALLOWED_MAP_IDS = [
  'hat0LfWAE92X1qwvDyrS',
  'njN2v7n7UP1maMBrhNNb',
  'Koq1bsYIi0fc8D9LTRq2',
];

// The "Garden + Clubhouse" map gets special colours for amenity/garden areas.
export const GARDEN_CLUBHOUSE_MAP_ID = 'njN2v7n7UP1maMBrhNNb';

// Plots next to a 12 m road (everything else is treated as 9 m).
export const PLOTS_ON_12M_ROAD = new Set([
  '166', '165', '164', '163', '95', '96', '97', '98', '99', '100', '101', '102',
  '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113',
  '114', '115', '116', '117', '118', '130', '137', '136', '135', '134', '133',
  '132', '131',
]);

// Fixed booking/token tiers → days the plot is held. Must stay in sync with
// lotusvenconadmin's BookingService.kTokenTiers.
export const BOOKING_AMOUNT_TIERS = [
  [5000, 7],
  [11000, 11],
  [21000, 15],
  [50000, 30],
];

export const PAYMENT_MODES = ['Monthly', 'Seasonal'];
export const EMI_MONTH_OPTIONS = [18, 24, 35];
export const DOWN_PAYMENT_OPTIONS = [
  ['10%', 'Down Payment  10%'],
  ['15%', '15% — Partial Payment'],
  ['20%', 'Down Payment  20%'],
  ['30%', '30% — Agreement'],
  ['50%', 'Down Payment  50%'],
];

export const COLLECTIONS = {
  users: 'lotusvencon_user',
  maps: 'maps',
  quotations: 'quotations_lotusvencon',
  siteVisits: 'site_visits_lotusvencon',
};

export const SESSION_KEY = 'wr_session_user';
