# lotusvencon (React)

React + Vite port of the `lotusvencon` Flutter app (login/roles, layout maps, quotations + print, site visits).
It talks to the **same Firebase project** (same collections), so existing data keeps working.

## Run
```bash
npm install
cp .env.example .env   # fill in Firebase web config + Google Maps key
npm run dev
npm run build          # outputs dist/ (firebase.json already points hosting at it)
```

## Where things are
| Flutter | React |
|---|---|
| `main.dart` / `sessionNotifier` | `src/App.jsx`, `src/context/SessionContext.jsx` |
| `services/*` | `src/services/*` (Firestore/Storage, same collection names) |
| `models/*` | `src/models/*` |
| `login_screen`, `register_employee_screen` | `LoginScreen.jsx`, `RegisterScreen.jsx` |
| `guest_home`, `employee_home` | `GuestHome.jsx`, `EmployeeHome.jsx` (+ `MapsTab`, `QuotationsTab`, `SiteVisitTab`) |
| `map_viewer_screen`, `plot_view_sheet` | `MapViewerScreen.jsx`, `PlotDetails.jsx` |
| `create_quotation_screen` | `CreateQuotationScreen.jsx` + `utils/quotationCalc.js` |
| `quotation_detail_screen`, `quotation_pdf` | `QuotationDetailScreen.jsx`, `QuotationPrintScreen.jsx` (browser print → Save as PDF) |

## Differences from the Flutter app
- Map: native Google Maps polygons + HTML labels instead of the custom tile renderer (`plan_tile_provider.dart`).
- PDF: print-styled A4 pages (English / Hindi) using the browser print dialog.
- Map edit mode is not ported (the app always opened maps read-only).
- Selfie capture uses the browser camera/file picker; address comes from browser geolocation + OpenStreetMap Nominatim reverse geocoding.
- Plot detail sheet uses the same 12m/9m plot list as the map screen (the Flutter sheet had a different, older list).
- Kept as-is from Flutter: detail screen says "Agreement Amount (20%)" and "Registration (0%)".

## Security notes (inherited from the Flutter app)
Passwords are stored in plain text in Firestore, default admin/guest credentials are hard-coded in
`authService.js`, and `storage.rules` allows public read/write. Fix before production
(e.g. Firebase Authentication + proper Firestore/Storage rules).
