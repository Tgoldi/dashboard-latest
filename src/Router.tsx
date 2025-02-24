import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { UserManagement } from './components/admin/UserManagement';
import { EditorQAForm } from './components/editor/EditorQAForm';
import { Layout } from './components/ui/layout';
import { useUser } from './contexts/UserContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Create a wrapper component to handle editor redirects
function EditorRedirect({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === 'editor' && !user.qa_form_submitted) {
            navigate('/editor/qa');
        }
    }, [user, navigate]);

    return <>{children}</>;
}

// Create a wrapper component to enforce editor QA form completion
function EditorQARedirect() {
    const { user } = useUser();
    
    if (!user) {
        return <Navigate to="/login" />;
    }

    if (user.role !== 'editor') {
        return <Navigate to="/" />;
    }

    if (user.qa_form_submitted) {
        return <Navigate to="/" />;
    }

    return <EditorQAForm />;
}

export function Router() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <EditorRedirect>
                            <Layout>
                                <Index />
                            </Layout>
                        </EditorRedirect>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/users"
                element={
                    <ProtectedRoute>
                        <EditorRedirect>
                            <Layout>
                                <UserManagement />
                            </Layout>
                        </EditorRedirect>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/editor/qa"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <EditorQARedirect />
                        </Layout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
} 