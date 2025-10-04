import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import UserDashboard from "./pages/UserDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
// import Signup from "./pages/Signup";
import UserSignup from "./pages/UserSignup";
import StaffSignup from "./pages/StaffSignup";
import AdminSignup from "./pages/AdminSignup";
import UserLogin from "./pages/UserLogin";
import StaffLogin from "./pages/StaffLogin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/staff-login" element={<StaffLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          {/* <Route path="/signup" element={<Signup />} /> */}
          <Route path="/user-signup" element={<UserSignup />} />
          <Route path="/staff-signup" element={<StaffSignup />} />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
