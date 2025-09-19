import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthTabs from "@/pages/auth/AuthTabs";
import ProfilePage from "@/pages/profile/ProfilePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 홈으로 들어오면 곧바로 로그인/회원가입 페이지 */}
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthTabs />} />
          <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function Protected({ children }) {
  const access = localStorage.getItem("sc_access");
  if (!access) return <Navigate to="/auth" replace />;
  return children;
}
