import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Toaster as Sonner } from "sonner";

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Public
import Landing from '@/pages/Landing';

// User pages
import Dashboard from '@/pages/Dashboard';
import Portfolio from '@/pages/Portfolio';
import Trade from '@/pages/Trade';
import CopyTrading from '@/pages/CopyTrading';
import Transactions from '@/pages/Transactions';
import Settings from '@/pages/Settings';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageUsers from '@/pages/admin/ManageUsers';
import ManageCryptos from '@/pages/admin/ManageCryptos';
import ManageTraders from '@/pages/admin/ManageTraders';
import AdminTransactions from '@/pages/admin/AdminTransactions';
import PlatformSettingsPage from '@/pages/admin/PlatformSettings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl gradient-green flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading Vested...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      {/* Public landing */}
      <Route path="/landing" element={<Landing />} />

      {/* User app routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/trade" element={<Trade />} />
        <Route path="/copy-trading" element={<CopyTrading />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AppLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/cryptos" element={<ManageCryptos />} />
        <Route path="/admin/traders" element={<ManageTraders />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/settings" element={<PlatformSettingsPage />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <Sonner position="top-right" theme="dark" richColors />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
