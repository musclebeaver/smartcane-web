import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const auth = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { accessToken, refreshToken } = await AuthAPI.login({ email, password });
      auth.saveTokens(accessToken, refreshToken);
      await auth.reloadMe();
      nav("/profile", { replace: true });
    } catch (e) {
      setError(e.message || "로그인 실패");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input placeholder="이메일" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" required />
      <Input type="password" placeholder="비밀번호" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full flex items-center justify-center">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
        {loading ? "로그인 중…" : "로그인"}
      </Button>
    </form>
  );
}
