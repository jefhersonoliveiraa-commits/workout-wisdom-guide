import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireRole } from "@/components/auth/RequireRole";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import StudentApp from "@/pages/student/StudentApp";
import TrainerDashboard from "@/pages/trainer/TrainerDashboard";
import PlanBuilderPage from "@/pages/trainer/PlanBuilderPage";
import StudentDetailPage from "@/pages/trainer/StudentDetailPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster /><Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/student" element={<RequireAuth><RequireRole role="student"><StudentApp /></RequireRole></RequireAuth>} />
            <Route path="/trainer" element={<RequireAuth><RequireRole role="trainer"><TrainerDashboard /></RequireRole></RequireAuth>} />
            <Route path="/trainer/plans/new" element={<RequireAuth><RequireRole role="trainer"><PlanBuilderPage /></RequireRole></RequireAuth>} />
            <Route path="/trainer/plans/:planId" element={<RequireAuth><RequireRole role="trainer"><PlanBuilderPage /></RequireRole></RequireAuth>} />
            <Route path="/trainer/students/:studentId" element={<RequireAuth><RequireRole role="trainer"><StudentDetailPage /></RequireRole></RequireAuth>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
export default App;
