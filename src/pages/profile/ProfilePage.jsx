import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

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

  const primaryName = profile?.nickname || profile?.name || profile?.email || "사용자";

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
        </CardContent>
      </Card>
    </div>
  );
}
