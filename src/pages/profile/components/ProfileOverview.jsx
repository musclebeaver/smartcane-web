import React, { useMemo } from "react";

// 프로필 기본 정보를 정리해서 보여주는 전용 컴포넌트입니다.
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

export default function ProfileOverview({ profile, primaryName, initials, renderValue }) {
  // 추가적인 프로필 키들을 자동으로 추려내기 위해 useMemo 를 활용했습니다.
  const extraEntries = useMemo(() => {
    if (!profile || typeof profile !== "object") return [];
    return Object.entries(profile).filter(([key]) => !KNOWN_PROFILE_KEYS.has(key));
  }, [profile]);

  return (
    <div className="space-y-6">
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
    </div>
  );
}
