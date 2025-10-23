import React, { useCallback, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { PaymentsAPI } from "@/lib/api";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileOverview from "./components/ProfileOverview";
import PaymentsTab from "./components/PaymentsTab";
import DevicesTab from "./components/DevicesTab";
import PointsTab from "./components/PointsTab";

export default function ProfilePage() {
  const auth = useAuth();
  const profile = auth?.me;
  const navigate = useNavigate(); // 로그아웃 시 로그인 화면으로 이동시키기 위해 네비게이터 훅을 준비합니다.

  const [tossLoading, setTossLoading] = useState(false);
  const [tossError, setTossError] = useState("");
  const [tabValue, setTabValue] = useState("profile");
  const [naverPayHelper, setNaverPayHelper] = useState("");
  const [kakaoPayHelper, setKakaoPayHelper] = useState("");

  const primaryName = profile?.nickname || profile?.name || profile?.email || "사용자";
  const hasAccessToken = Boolean(auth?.accessToken);

  const handleLogout = useCallback(() => {
    auth.logout(); // 저장된 토큰과 사용자 정보를 지운 뒤
    navigate("/auth", { replace: true }); // 로그인 화면으로 바로 이동합니다.
  }, [auth, navigate]);

  const handleTossAutopay = async () => {
    // 토스 자동이체 연동 시도 전 간단한 권한 체크를 수행합니다.
    if (!hasAccessToken) {
      setTossError("자동이체 등록은 로그인 후 이용 가능합니다.");
      return;
    }
    setTossLoading(true);
    setTossError("");
    try {
      const result = await PaymentsAPI.getTossAutopayUrl(auth.accessToken);
      const targetUrl =
        typeof result === "string"
          ? result
          : result?.url || result?.redirectUrl || result?.location || result?.autopayUrl;
      if (!targetUrl) throw new Error("토스 자동이체 링크를 불러오지 못했습니다.");
      window.location.href = targetUrl;
    } catch (error) {
      setTossError(error?.message || "토스 자동이체 링크를 불러오지 못했습니다.");
    } finally {
      setTossLoading(false);
    }
  };

  const tossHelperText = !hasAccessToken
    ? "자동이체 등록은 로그인 후 이용 가능합니다."
    : tossError;
  const tossHelperClass = hasAccessToken && tossError ? "text-red-600" : "text-muted-foreground";

  const handleExternalPayment = useCallback(
    (provider, envKey, setHelper) => {
      // 다른 간편결제 버튼 역시 토큰이 없을 때는 안내만 보여 주고 동작을 막습니다.
      if (!hasAccessToken) {
        setHelper("로그인 후 이용 가능합니다.");
        return;
      }

      const override = import.meta.env?.[envKey];
      if (override) {
        setHelper("");
        window.location.href = override;
        return;
      }

      // 아직 백엔드 연동이 준비되지 않은 경우엔 안내 문구만 출력합니다.
      setHelper(`${provider} 연동은 준비 중입니다.`);
    },
    [hasAccessToken],
  );

  const handleNaverPay = useCallback(() => {
    handleExternalPayment("네이버페이", "VITE_NAVERPAY_REDIRECT_URL", setNaverPayHelper);
  }, [handleExternalPayment]);

  const handleKakaoPay = useCallback(() => {
    handleExternalPayment("카카오페이", "VITE_KAKAOPAY_REDIRECT_URL", setKakaoPayHelper);
  }, [handleExternalPayment]);

  const initials = useMemo(() => {
    if (!primaryName) return "?";
    const trimmed = primaryName.trim();
    if (!trimmed) return "?";
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
  }, [primaryName]);

  const renderValue = useCallback((value) => {
    // 화면 전체에서 동일한 렌더링 규칙을 쓰기 위해 함수로 분리했습니다.
    if (value === null || value === undefined || value === "") return "미입력";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "미입력";
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === "object") {
      const keys = Object.keys(value);
      return keys.length ? JSON.stringify(value) : "미입력";
    }
    return String(value);
  }, []);

  if (!profile) return <p className="text-gray-500 text-center">로딩 중...</p>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>프로필</CardTitle>
          {/* 즉시 토큰을 제거하고 로그인 화면으로 보내기 위한 핸들러를 사용합니다. */}
          <Button variant="ghost" size="icon" onClick={handleLogout} title="로그아웃">
            <LogOut className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="profile">프로필</TabsTrigger>
              <TabsTrigger value="points">포인트</TabsTrigger>
              <TabsTrigger value="payments">결제</TabsTrigger>
              <TabsTrigger value="devices">디바이스</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileOverview
                profile={profile}
                primaryName={primaryName}
                initials={initials}
                renderValue={renderValue}
              />
            </TabsContent>

            <TabsContent value="points">
              <PointsTab
                isActive={tabValue === "points"}
                hasAccessToken={hasAccessToken}
                accessToken={auth?.accessToken}
                // 포인트 잔액 조회와 충전 기능을 이 탭에서 한꺼번에 처리합니다.
              />
            </TabsContent>

            <TabsContent value="payments">
              <PaymentsTab
                hasAccessToken={hasAccessToken}
                tossLoading={tossLoading}
                tossHelperText={tossHelperText}
                tossHelperClass={tossHelperClass}
                onRequestAutopay={handleTossAutopay}
                onRequestNaverPay={handleNaverPay}
                onRequestKakaoPay={handleKakaoPay}
                naverPayHelperText={naverPayHelper}
                kakaoPayHelperText={kakaoPayHelper}
              />
            </TabsContent>

            <TabsContent value="devices">
              <DevicesTab
                isActive={tabValue === "devices"}
                hasAccessToken={hasAccessToken}
                accessToken={auth?.accessToken}
                userId={profile?.id ?? profile?.userId} // 사용자별 디바이스 바인딩 API 를 호출하기 위해 ID 를 전달합니다.
                renderValue={renderValue}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
