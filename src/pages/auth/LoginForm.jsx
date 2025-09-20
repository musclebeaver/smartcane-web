import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function LoginForm({ socialError = "", onClearSocialError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const auth = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    onClearSocialError?.();
    try {
      const { accessToken, refreshToken } = await AuthAPI.login({ email, password });
      auth.saveTokens(accessToken, refreshToken);
      await auth.reloadMe();
      nav("/profile", { replace: true });
    } catch (e) {
      setError(e.message || "로그인 실패");
    } finally { setLoading(false); }
  };

  const handleSocialLogin = (provider) => {
    const env = import.meta.env;
    const override = env[`VITE_${provider.toUpperCase()}_OAUTH_URL`];
    if (override) {
      window.location.href = override;
      return;
    }

    const base = (env.VITE_API_BASE_URL || window.location.origin).replace(/\/$/, "");
    const redirectUri = `${window.location.origin}/auth`;
    const url = `${base}/oauth2/authorization/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = url;
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input placeholder="이메일" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" required />
      <Input type="password" placeholder="비밀번호" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {socialError && <p className="text-sm text-red-600">{socialError}</p>}
      <Button type="submit" disabled={loading} className="w-full flex items-center justify-center">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
        {loading ? "로그인 중…" : "로그인"}
      </Button>
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Separator className="flex-1" />
          <span className="shrink-0">간편 로그인</span>
          <Separator className="flex-1" />
        </div>
        <div className="grid gap-2">
          <Button
            type="button"
            onClick={() => handleSocialLogin("kakao")}
            className="w-full bg-[#FEE500] text-[#181600] hover:bg-[#F7D102]"
          >
            카카오로 로그인
          </Button>
          <Button
            type="button"
            onClick={() => handleSocialLogin("naver")}
            className="w-full bg-[#03C75A] text-white hover:bg-[#02b152]"
          >
            네이버로 로그인
          </Button>
        </div>
      </div>
    </form>
  );
}
