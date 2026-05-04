import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CallProvider } from "@/context/CallContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useEffect, useState } from "react";

import Feed from "./pages/Feed";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Reels from "./pages/Reels";
import AppLoader from "./components/AppLoader";

const queryClient = new QueryClient();

function MainApp() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2200);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <AppLoader />;

  return (
    <BrowserRouter>
      <AuthProvider>
        <CallProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />

            <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/user/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CallProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MainApp />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;