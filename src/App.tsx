import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Clients from "./pages/dashboard/Clients";
import Contracts from "./pages/dashboard/Contracts";
import Financial from "./pages/dashboard/Financial";
import Support from "./pages/dashboard/Support";
import Settings from "./pages/dashboard/Settings";
import Plans from "./pages/dashboard/Plans";
import Reports from "./pages/dashboard/Reports";
import Positions from "./pages/dashboard/Positions";
import Employees from "./pages/dashboard/Employees";
import Conciliation from "./pages/dashboard/Conciliation";
import CRM from "./pages/dashboard/CRM";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LocaleProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="clients" element={<Clients />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="positions" element={<Positions />} />
              <Route path="employees" element={<Employees />} />
              <Route path="financial" element={<Financial />} />
              <Route path="crm" element={<CRM />} />
              <Route path="conciliation" element={<Conciliation />} />
              <Route path="reports" element={<Reports />} />
              <Route path="support" element={<Support />} />
              <Route path="settings" element={<Settings />} />
              <Route path="plans" element={<Plans />} />
            </Route>
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </LocaleProvider>
  </QueryClientProvider>
);

export default App;
