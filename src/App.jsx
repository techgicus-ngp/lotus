import { Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from './context/SessionContext';
import { isGuest } from './models/user';
import { Spinner } from './components/Common';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import GuestHome from './screens/GuestHome';
import EmployeeHome from './screens/EmployeeHome';
import MapViewerScreen from './screens/MapViewerScreen';
import CreateQuotationScreen from './screens/CreateQuotationScreen';
import QuotationDetailScreen from './screens/QuotationDetailScreen';
import QuotationPrintScreen from './screens/QuotationPrintScreen';

function Protected({ children }) {
  const { user } = useSession();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, ready } = useSession();

  if (!ready) {
    return (
      <div className="boot-splash">
        <Spinner color="#fff" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginScreen />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterScreen />} />
      <Route
        path="/"
        element={<Protected>{user && isGuest(user) ? <GuestHome /> : <EmployeeHome />}</Protected>}
      />
      <Route path="/map/:mapId" element={<Protected><MapViewerScreen /></Protected>} />
      <Route path="/quotations/new" element={<Protected><CreateQuotationScreen /></Protected>} />
      <Route path="/quotations/:id" element={<Protected><QuotationDetailScreen /></Protected>} />
      <Route path="/quotations/:id/edit" element={<Protected><CreateQuotationScreen /></Protected>} />
      <Route path="/quotations/:id/print/:lang" element={<Protected><QuotationPrintScreen /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
