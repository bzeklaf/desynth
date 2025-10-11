import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { FloatingChat } from "./components/FloatingChat";
import { BlockchainProvider } from "./components/blockchain/BlockchainProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingBoundary } from "./components/LoadingBoundary";
import { usePerformance, useWebVitals } from "./hooks/usePerformance";
import { lazy, Suspense } from "react";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth").then(module => ({ default: module.Auth })));
const Dashboard = lazy(() => import("./pages/Dashboard").then(module => ({ default: module.Dashboard })));
const Browse = lazy(() => import("./pages/Browse").then(module => ({ default: module.Browse })));
const Book = lazy(() => import("./pages/Book").then(module => ({ default: module.Book })));
const BookingSuccess = lazy(() => import("./pages/BookingSuccess").then(module => ({ default: module.BookingSuccess })));
const Market = lazy(() => import("./pages/Market").then(module => ({ default: module.Market })));
const Facilities = lazy(() => import("./pages/Facilities").then(module => ({ default: module.Facilities })));
const Profile = lazy(() => import("./pages/Profile").then(module => ({ default: module.Profile })));
const NotFound = lazy(() => import("./pages/NotFound"));

// Enhanced Query Client with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false;
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

// Performance monitoring component
const PerformanceMonitor = () => {
  usePerformance();
  useWebVitals();
  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PerformanceMonitor />
        <BrowserRouter>
          <BlockchainProvider>
            <AuthProvider>
              <Suspense fallback={<LoadingBoundary type="page"><div /></LoadingBoundary>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/book" element={<Book />} />
                  <Route path="/booking-success" element={<BookingSuccess />} />
                  <Route path="/market" element={<Market />} />
                  <Route path="/facilities" element={<Facilities />} />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <FloatingChat />
            </AuthProvider>
          </BlockchainProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
