import React, { Suspense, lazy } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from 'react-router-dom';
import { ThemeProvider } from './lib/ThemeProvider';
import { UserProvider } from './context/UserContext';
import { Toaster } from 'react-hot-toast';

// Layout and Loading components
import ProtectedLayout from './components/layout/ProtectedLayout';
import Login from './components/dashboard/auth/Login';

// A simple loading fallback component for suspense
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen w-full">
    <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading...</div>
  </div>
);

// Lazy load all page components
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const Orders = lazy(() => import('./components/orders/Orders'));
const Expenses = lazy(() => import('./components/expenses/Expenses'));
const Materials = lazy(() => import('./components/materials/MaterialsPage'));
const Staff = lazy(() => import('./components/staff/Staff'));
const CustomersPage = lazy(() => import('./components/customers'));
const Payments = lazy(() => import('./components/payments/Payments'));
const DueSummary = lazy(() => import('./components/due/DueSummary'));
const ProductMaster = lazy(() => import('./components/products/ProductMaster'));
const StatusOverview = lazy(() => import('./components/orders/StatusOverview'));
const InvoiceList = lazy(() => import('./components/invoices/InvoiceList'));
const InvoicePage = lazy(() => import('./components/invoices/InvoicePage'));
const UserManagement = lazy(() => import('./components/users/UserManagement'));
const StockPage = lazy(() => import('./components/stock/StockPage'));
const ShowcasePage = lazy(() => import('./components/showcase/ShowcasePage'));
const WhatsAppDashboard = lazy(() => import('./components/WhatsAppDashboard'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const SettingsPage = lazy(() => import('./components/settings/SettingsPage'));
const TeamChatPage = lazy(() => import('./pages/TeamChatPage'));
const AdminContentManagement = lazy(() => import('./pages/AdminContentManagement'));
const AIAgentPage = lazy(() => import('./pages/AIAgentPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage')); // Import the new ReportsPage

// Helper function to wrap routes with Suspense
const Suspended = (element: React.ReactNode) => (
  <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={Suspended(<Dashboard />)} />
        <Route path="/orders" element={Suspended(<Orders />)} />
        <Route path="/expenses" element={Suspended(<Expenses />)} />
        <Route path="/materials" element={Suspended(<Materials />)} />
        <Route path="/staff" element={Suspended(<Staff />)} />
        <Route path="/customers" element={Suspended(<CustomersPage />)} />
        <Route path="/payments" element={Suspended(<Payments />)} />
        <Route path="/due-summary" element={Suspended(<DueSummary />)} />
        <Route path="/products" element={Suspended(<ProductMaster />)} />
        <Route path="/status-overview" element={Suspended(<StatusOverview />)} />
        <Route path="/invoices" element={Suspended(<InvoiceList />)} />
        <Route path="/invoices/:id" element={Suspended(<InvoicePage />)} />
        <Route path="/users" element={Suspended(<UserManagement />)} />
        <Route path="/stock" element={Suspended(<StockPage />)} />
        <Route path="/showcase" element={Suspended(<ShowcasePage />)} />
        <Route path="/whatsapp" element={Suspended(<WhatsAppDashboard />)} />
        <Route path="/settings" element={Suspended(<SettingsPage />)} />
        <Route path="/team-chat" element={Suspended(<TeamChatPage />)} />
        <Route path="/ai-agent" element={Suspended(<AIAgentPage />)} />
        <Route path="/admin/content" element={Suspended(<AdminContentManagement />)} />
        <Route path="/insights" element={Suspended(<InsightsPage />)} />
        <Route path="/reports" element={Suspended(<ReportsPage />)} /> {/* Add the new reports route */}
      </Route>

      {/* 404 page */}
      <Route path="*" element={Suspended(<NotFoundPage />)} />
    </>
  )
);

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            success: { duration: 3000 },
            error: { duration: 5000 },
            style: {
              fontSize: '14px',
              maxWidth: '400px',
              padding: '12px 18px',
            },
          }}
        />
        <RouterProvider router={router} />
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
