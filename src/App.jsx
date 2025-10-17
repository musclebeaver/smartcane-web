import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthTabs from "@/pages/auth/AuthTabs";
import ProfilePage from "@/pages/profile/ProfilePage";
import AdminPage from "@/pages/admin/AdminPage";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 홈으로 들어오면 곧바로 로그인/회원가입 페이지 */}
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthTabs />} />
          <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
          <Route
            path="/admin"
            element={(
              <Protected requiredRole="ADMIN">
                <AdminPage />
              </Protected>
            )}
          />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

function Protected({ children, requiredRole }) {
  const auth = useAuth();
  const access = auth?.accessToken || localStorage.getItem("sc_access");
  // 사용자 정보가 아직 로딩 중이면 잠시 렌더링을 보류하여 권한 체크가 완료될 때까지 기다립니다.
  if (auth?.isLoadingMe && access) {
    return null;
  }

  if (!access) return <Navigate to="/auth" replace />;

  if (requiredRole) {
    // 백엔드에서 내려주는 역할 문자열/배열을 모두 대문자로 통일해 비교합니다.
    const rawRoles = auth?.me?.roles;
    if (auth?.isLoadingMe && rawRoles == null) {
      return null;
    }
    const normalizedRoles = Array.isArray(rawRoles)
      ? rawRoles
      : typeof rawRoles === "string"
        ? rawRoles.split(/[,\s]+/).filter(Boolean)
        : [];
    const upperRoles = normalizedRoles.map((role) => role.toUpperCase());
    const targetRole = requiredRole.toUpperCase();
    const hasRole = upperRoles.some(
      (role) => role === targetRole || role.endsWith(targetRole)
    );
    if (!hasRole) {
      // 관리자 권한이 없는 사용자는 기본 프로필 화면으로 되돌립니다.
      return <Navigate to="/profile" replace />;
    }
  }

  return children;
}
