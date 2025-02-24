// External Dependencies
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Context Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';

// Components
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from './components/ui/toaster';
import { CommandPalette } from './components/ui/command-palette';

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Admin from './pages/Admin';
import Editor from "@/pages/Editor";

// Query Client Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                    // Only retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      staleTime: 5 * 60 * 1000,   // Consider data stale after 5 minutes
    },
  },
});

/**
 * Main Application Component
 * Provides global context providers and routing setup
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Theme and User Authentication Providers */}
      <ThemeProvider>
        <UserProvider>
          {/* Router Setup */}
          <Router>
            <CommandPalette />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/assistants"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/phone-numbers"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editor"
                element={
                  <ProtectedRoute requiredRole="editor">
                    <Editor />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
          
          {/* Global Toast Notifications */}
          <Toaster />
        </UserProvider>
      </ThemeProvider>
      
      {/* Development Tools */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;