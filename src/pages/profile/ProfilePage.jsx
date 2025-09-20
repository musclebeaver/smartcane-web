import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PaymentsAPI } from "@/lib/api";
import { Loader2, LogOut } from "lucide-react";

const PROFILE_SECTIONS = [
  {
    title: "기본 정보",
    fields: [
      { key: "nickname", label: "닉네임" },
      { key: "email", label: "이메일" },
      { key: "birthDate", label: "생년월일" },
      { key: "phoneNumber", label: "전화번호" },
    ],
  },
  {
    title: "시스템 정보",
    fields: [
      { key: "id", label: "회원 ID" },
      { key: "createdAt", label: "가입일" },
      { key: "updatedAt", label: "정보 수정일" },
      { key: "roles", label: "권한" },
    ],
  },
];

const KNOWN_PROFILE_KEYS = new Set(
  PROFILE_SECTIONS.flatMap((section) => section.fields.map((field) => field.key))
);

export default function ProfilePage() {
  const auth = useAuth();
  const profile = auth?.me;
  const [tossLoading, setTossLoading] = useState(false);
  const [tossError, setTossError] = useState("");

  const primaryName = profile?.nickname || profile?.name || profile?.email || "사용자";

  const hasAccessToken = Boolean(auth?.accessToken);

  const handleTossAutopay = async () => {
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

  const initials = useMemo(() => {
    if (!primaryName) return "?";
    const trimmed = primaryName.trim();
    if (!trimmed) return "?";
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
  }, [primaryName]);

  const extraEntries = useMemo(() => {
    if (!profile || typeof profile !== "object") return [];
    return Object.entries(profile).filter(([key]) => !KNOWN_PROFILE_KEYS.has(key));
  }, [profile]);

  const renderValue = (value) => {
    if (value === null || value === undefined || value === "") return "미입력";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "미입력";
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === "object") {
      const keys = Object.keys(value);
      return keys.length ? JSON.stringify(value) : "미입력";
    }
    return String(value);
  };

  if (!profile) return <p className="text-gray-500 text-center">로딩 중...</p>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>프로필</CardTitle>
          <Button variant="ghost" size="icon" onClick={auth.logout} title="로그아웃">
            <LogOut className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold uppercase text-primary">
              {initials}
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900">{primaryName}</p>
              <p className="text-sm text-muted-foreground">{renderValue(profile?.email)}</p>
            </div>
          </section>

          {PROFILE_SECTIONS.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{section.title}</h2>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <dl className="divide-y divide-gray-100">
                  {section.fields.map((field) => (
                    <div
                      key={field.key}
                      className="flex flex-col gap-1 px-4 py-3 text-left sm:flex-row sm:items-start sm:justify-between"
                    >
                      <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                      <dd className="text-sm font-semibold text-gray-900 sm:text-right">
                        {renderValue(profile?.[field.key])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          ))}

          {extraEntries.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">추가 정보</h2>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <dl className="divide-y divide-gray-100">
                  {extraEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col gap-1 px-4 py-3 text-left sm:flex-row sm:items-start sm:justify-between"
                    >
                      <dt className="text-sm font-medium text-gray-500">{key}</dt>
                      <dd className="text-sm font-semibold text-gray-900 sm:text-right">{renderValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">결제 관리</h2>
            <div className="space-y-2">
              <Button
                type="button"
                onClick={handleTossAutopay}
                disabled={!hasAccessToken || tossLoading}
                className="w-full bg-[#0064FF] text-white hover:bg-[#0050CC]"
              >
                {tossLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tossLoading ? "토스로 이동 중…" : "토스 자동이체 등록"}
              </Button>
              {tossHelperText && (
                <p className={`text-sm ${tossHelperClass}`}>{tossHelperText}</p>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
