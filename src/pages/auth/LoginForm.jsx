import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function LoginForm({ socialError = "", onClearSocialError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const nav = useNavigate();
  const auth = useAuth();
  const { toast } = useToast();
  const remainingAttempts = Math.max(0, 5 - attempts);

  // 변경 사항: 잠금 만료 시점을 감시하여 남은 시간을 갱신하고, 시간이 지나면 잠금을 해제합니다.
  useEffect(() => {
    if (!lockExpiresAt) {
      setLockCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const diff = lockExpiresAt - Date.now();
      if (diff <= 0) {
        setLockExpiresAt(null);
        setLockCountdown(0);
      } else {
        setLockCountdown(Math.ceil(diff / 1000));
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 500);
    return () => clearInterval(timer);
  }, [lockExpiresAt]);

  const isLocked = Boolean(lockExpiresAt && lockExpiresAt > Date.now());

  const submit = async (e) => {
    e.preventDefault();
    // 변경 사항: 잠금 상태에서는 추가 시도를 막고 사용자에게 토스트로 안내합니다.
    if (isLocked) {
      toast({ title: "로그인 잠금", description: "잠시 후 다시 시도해주세요." });
      return;
    }

    setLoading(true); setError("");
    onClearSocialError?.();
    try {
      const { accessToken, refreshToken } = await AuthAPI.login({ email, password });
      auth.saveTokens(accessToken, refreshToken);
      await auth.reloadMe();
      nav("/profile", { replace: true });
      setAttempts(0);
    } catch (e) {
      setError(e.message || "로그인 실패");
      setAttempts((prev) => {
        const nextAttempts = prev + 1;
        // 변경 사항: 실패 횟수가 5회 이상이면 5초 동안 버튼을 비활성화하고 토스트로 알립니다.
        if (nextAttempts >= 5) {
          const lockUntil = Date.now() + 5000;
          setLockExpiresAt(lockUntil);
          toast({ title: "로그인 제한", description: "5초 후에 다시 시도할 수 있어요." });
          return 0;
        }
        return nextAttempts;
      });
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
      <Button
        type="submit"
        disabled={loading || isLocked}
        className="w-full flex items-center justify-center"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
        {isLocked ? `로그인 잠금 (${lockCountdown}s)` : (loading ? "로그인 중…" : "로그인")}
      </Button>
      {!isLocked && attempts > 0 && (
        <p className="text-sm text-slate-500">
          {/* 변경 사항: 남은 시도 횟수를 안내하여 사용자 경험을 개선합니다. */}
          잠금까지 남은 시도 횟수: {remainingAttempts}회
        </p>
      )}
      {isLocked && (
        <p className="text-sm text-amber-600">
          {/* 변경 사항: 사용자에게 남은 잠금 시간을 안내하여 혼선을 줄입니다. */}
          5회 이상 실패하여 {lockCountdown}초 뒤에 다시 시도할 수 있습니다.
        </p>
      )}
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
