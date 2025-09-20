import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function AuthTabs() {
  const auth = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [socialError, setSocialError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const error = params.get("error");

    if (accessToken && refreshToken) {
      auth.saveTokens(accessToken, refreshToken);
      auth.reloadMe?.();
      nav("/profile", { replace: true });
      return;
    }

    if (error) {
      setSocialError(error);
      nav("/auth", { replace: true });
    }
  }, [auth, location.search, nav]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-center">스마트 지팡이 로그인 / 회원가입</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>
            <TabsContent value="login"><LoginForm socialError={socialError} onClearSocialError={() => setSocialError("")} /></TabsContent>
            <TabsContent value="signup"><SignupForm onSuccess={() => { /* 가입 후 로그인 탭으로 전환하려면 상태로 제어 가능 */ }} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
