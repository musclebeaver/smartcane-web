import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// 토스 자동이체 버튼만 담당하는 단순 탭입니다.
export default function PaymentsTab({
  hasAccessToken,
  tossLoading,
  tossHelperText,
  tossHelperClass,
  onRequestAutopay,
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">결제 관리</h2>
      <div className="space-y-2">
        <Button
          type="button"
          onClick={onRequestAutopay}
          disabled={!hasAccessToken || tossLoading}
          className="w-full bg-[#0064FF] text-white hover:bg-[#0050CC]"
        >
          {tossLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tossLoading ? "토스로 이동 중…" : "토스 자동이체 등록"}
        </Button>
        {tossHelperText && <p className={`text-sm ${tossHelperClass}`}>{tossHelperText}</p>}
      </div>
    </div>
  );
}
