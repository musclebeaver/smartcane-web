import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// 토스/네이버/카카오 간편결제 버튼 묶음을 담당하는 탭입니다.
export default function PaymentsTab({
  hasAccessToken,
  tossLoading,
  tossHelperText,
  tossHelperClass,
  onRequestAutopay,
  onRequestNaverPay,
  onRequestKakaoPay,
  naverPayHelperText,
  kakaoPayHelperText,
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
      <div className="space-y-2">
        <Button
          type="button"
          onClick={onRequestNaverPay}
          disabled={!hasAccessToken}
          className="w-full bg-[#03C75A] text-white hover:bg-[#02b152]"
        >
          {/* 네이버페이는 아직 외부 연동 전용 API 가 없어 별도 로딩 스피너는 표시하지 않습니다. */}
          네이버페이 결제 이동
        </Button>
        {naverPayHelperText && <p className="text-sm text-muted-foreground">{naverPayHelperText}</p>}
      </div>
      <div className="space-y-2">
        <Button
          type="button"
          onClick={onRequestKakaoPay}
          disabled={!hasAccessToken}
          className="w-full bg-[#FEE500] text-[#181600] hover:bg-[#F7D102]"
        >
          {/* 카카오페이 역시 현재는 안내 메시지만 제공하여 사용자 기대를 관리합니다. */}
          카카오페이 결제 이동
        </Button>
        {kakaoPayHelperText && <p className="text-sm text-muted-foreground">{kakaoPayHelperText}</p>}
      </div>
    </div>
  );
}
