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
import AnalyticsPage from './pages/AnalyticsPage.tsx';

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
  const { user, isLoading } = useAuthStore();

  // Если идет загрузка, показываем спиннер
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Если требуется авторизация, но пользователь не авторизован
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // Если указаны разрешенные роли и пользователь не имеет нужной роли
  if (requireAuth && user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuthStore();

  // Проверяем аутентификацию при загрузке приложения
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
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

            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['fsp', 'regional']}>
                  <AnalyticsPage />
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
    </Router>
  );
}

export default App;