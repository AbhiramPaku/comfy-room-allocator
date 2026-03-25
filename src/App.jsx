
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Students from "./pages/Students";
import Rooms from "./pages/Rooms";
import Requests from "./pages/Requests";
import Vacancy from "./pages/Vacancy";
import ExportData from "./pages/ExportData";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings"; // Import the new Settings page
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";

const queryClient = new QueryClient();

const AppLayout = ({ children }) => (
  <SidebarProvider>
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className="flex-1">
        <header className="sticky top-0 z-10 h-14 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 flex items-center px-4">
          <SidebarTrigger />
          <div className="ml-4">
            <h2 className="text-sm font-semibold text-foreground">Hostel Room Allocation System</h2>
          </div>
        </header>
        {children}
      </main>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/students" element={<AppLayout><Students /></AppLayout>} />
            <Route path="/rooms" element={<AppLayout><Rooms /></AppLayout>} />
            <Route path="/requests" element={<AppLayout><Requests /></AppLayout>} />
            <Route path="/vacancy" element={<AppLayout><Vacancy /></AppLayout>} />
            <Route path="/export" element={<AppLayout><ExportData /></AppLayout>} />
            <Route path="/payments" element={<AppLayout><Payments /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} /> {/* Updated route */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
