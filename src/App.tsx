import { useEffect } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Device, Ligne, NetBar, StatusBar, TabBar, Toast } from './ui/shell';
import { currentBank, drainOutbox, getState, useApp } from './state/store';
import { PlatformHome, Configurator, Building, Springboard } from './screens/platform';
import { Welcome, Login, RegPhone, RegOtp, RegName, RegPin, RegDone } from './screens/auth';
import { Home, History, TxnDetail, Beneficiaries, Notifications, Settings } from './screens/bank';
import { TransferType, TransferForm, TransferRecap, TransferOtp, TransferResult } from './screens/transfer';
import { Receipt, Verify } from './screens/receipt';
import { TopUp, LinkBank, Kyc, LinkDone } from './screens/wallet';
import { Studio } from './screens/studio';

/** Applique la charte de la banque courante aux variables CSS. */
function Theme() {
  const s = useApp();
  const c = currentBank(s).colors;
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--brand', c.brand);
    r.setProperty('--brand-2', c.brand2);
    r.setProperty('--brand-soft', c.soft);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.brand);
  }, [c.brand, c.brand2, c.soft]);
  return null;
}

/** La file d'attente reprend seule au démarrage si le réseau est là. */
function ResumeQueue() {
  useEffect(() => {
    const id = setTimeout(() => { if (getState().outbox.length) drainOutbox(); }, 900);
    return () => clearTimeout(id);
  }, []);
  return null;
}

function Guard({ children }: { children: React.ReactNode }) {
  const s = useApp();
  const loc = useLocation();
  if (!s.authed) return <Navigate to="/welcome" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

function AppLayout() {
  return (
    <Guard>
      <Outlet />
      <TabBar />
    </Guard>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Theme />
      <ResumeQueue />
      <Device>
        <StatusBar />
        <Ligne />
        <NetBar />
        <Routes>
          <Route path="/" element={<PlatformHome />} />
          <Route path="/configurator" element={<Configurator />} />
          <Route path="/building" element={<Building />} />
          <Route path="/springboard" element={<Springboard />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />

          <Route path="/register/phone" element={<RegPhone />} />
          <Route path="/register/otp" element={<RegOtp />} />
          <Route path="/register/name" element={<RegName />} />
          <Route path="/register/pin" element={<RegPin />} />
          <Route path="/register/done" element={<RegDone />} />

          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="history" element={<History />} />
            <Route path="benefs" element={<Beneficiaries />} />
            <Route path="settings" element={<Settings />} />
            <Route path="txn/:id" element={<TxnDetail />} />
          </Route>

          <Route path="/transfer/type" element={<Guard><TransferType /></Guard>} />
          <Route path="/transfer/form/:kind" element={<Guard><TransferForm /></Guard>} />
          <Route path="/transfer/recap" element={<Guard><TransferRecap /></Guard>} />
          <Route path="/transfer/otp" element={<Guard><TransferOtp /></Guard>} />
          <Route path="/transfer/result/:id" element={<Guard><TransferResult /></Guard>} />

          <Route path="/receipt/:id" element={<Guard><Receipt /></Guard>} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/notifications" element={<Guard><Notifications /></Guard>} />
          <Route path="/topup" element={<Guard><TopUp /></Guard>} />
          <Route path="/link" element={<Guard><LinkBank /></Guard>} />
          <Route path="/kyc" element={<Guard><Kyc /></Guard>} />
          <Route path="/link-done" element={<Guard><LinkDone /></Guard>} />

          <Route path="/studio" element={<Studio />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toast />
      </Device>
    </HashRouter>
  );
}
