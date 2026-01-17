
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Structure from "./pages/Structure";
import Admin from "./pages/Admin";
import Doctor from "./pages/Doctor";
import Registrar from "./pages/Registrar";
import DoctorGuide from "./pages/DoctorGuide";
import Faq from "./pages/Faq";
import Forum from "./pages/Forum";
import HowToBook from "./pages/HowToBook";
import Security from "./pages/Security";
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
          <Route path="/structure" element={<Structure />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/doctor" element={<Doctor />} />
          <Route path="/registrar" element={<Registrar />} />
          <Route path="/doctor-guide" element={<DoctorGuide />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:topicId" element={<Forum />} />
          <Route path="/how-to-book" element={<HowToBook />} />
          <Route path="/security" element={<Security />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;