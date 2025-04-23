import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.ts';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import ProfileEditPage from './pages/ProfileEditPage.tsx';
import CompetitionListPage from './pages/CompetitionListPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import TeamsPage from './pages/TeamsPage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import CompetitionRequestPage from './pages/CompetitionRequestPage.tsx';
import CompetitionRequestsPage from './pages/CompetitionRequestsPage.tsx';
import { TransitionProvider } from './context/TransitionContext.tsx';
import PageTransition from './components/PageTransition.tsx';

// Вспомогательный компонент для защищенных роутов
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles = []
}) => {
  const { user } = useAuthStore();

  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Компонент для обертки основного контента
const AppContent: React.FC = () => {
  const { checkAuth } = useAuthStore();

  // Проверяем аутентификацию при загрузке приложения
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <PageTransition />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEditPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/competition/request"
            element={
              <ProtectedRoute allowedRoles={['regional']}>
                <CompetitionRequestPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/competition/requests"
            element={
              <ProtectedRoute allowedRoles={['fsp']}>
                <CompetitionRequestsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/competitions" element={<CompetitionListPage />} />
          <Route path="/teams" element={<TeamsPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <TransitionProvider>
      <Router>
        <AppContent />
      </Router>
    </TransitionProvider>
  );
}

export default App;