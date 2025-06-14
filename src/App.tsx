import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from 'react-router-dom';
import { ThemeProvider } from './lib/ThemeProvider';
import { UserProvider } from './context/UserContext';
import { Toaster } from 'react-hot-toast';

// Import components
import ProtectedLayout from './components/layout/ProtectedLayout';
import Login from './components/dashboard/auth/Login';

// Import all page components
import Dashboard from './components/dashboard/Dashboard';
import Orders from './components/orders/Orders';
import Expenses from './components/expenses/Expenses';
import Materials from './components/materials/MaterialsPage';
import Staff from './components/staff/Staff';
import CustomersPage from './components/customers';
import Payments from './components/payments/Payments';
import DueSummary from './components/due/DueSummary';
import ProductMaster from './components/products/ProductMaster';
import StatusOverview from './components/orders/StatusOverview';
import InvoiceList from './components/invoices/InvoiceList';
import InvoicePage from './components/invoices/InvoicePage';
import UserManagement from './components/users/UserManagement';
import StockPage from './components/stock/StockPage';
import ShowcasePage from './components/showcase/ShowcasePage';
import WhatsAppDashboard from './components/WhatsAppDashboard';
import NotFoundPage from './pages/NotFoundPage';
import SettingsPage from './components/settings/SettingsPage';
import TeamChatPage from './pages/TeamChatPage'; // Import the new chat page

// NEW: Import AdminContentManagement page
import AdminContentManagement from './pages/AdminContentManagement';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/due-summary" element={<DueSummary />} />
        <Route path="/products" element={<ProductMaster />} />
        <Route path="/status-overview" element={<StatusOverview />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/:id" element={<InvoicePage />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="/whatsapp" element={<WhatsAppDashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/team-chat" element={<TeamChatPage />} /> {/* Add the new chat route */}

        {/* NEW: Admin Content Management Route */}
        <Route path="/admin/content" element={<AdminContentManagement />} />
      </Route>

      {/* 404 page */}
      <Route path="*" element={<NotFoundPage />} />
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
