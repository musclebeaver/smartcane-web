import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Loader2, PlusCircle } from "lucide-react";
import { PointsAPI } from "@/lib/api";

// 포인트 조회 및 충전을 위한 전용 탭 컴포넌트입니다.
export default function PointsTab({ isActive, hasAccessToken, accessToken }) {
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeLoading, setChargeLoading] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const parsedBalance = useMemo(() => {
    if (balance === null || balance === undefined) return "-";
    try {
      return Number(balance).toLocaleString();
    } catch (err) {
      console.warn("Failed to format balance", err);
      return String(balance);
    }
  }, [balance]);

  const fetchBalance = useCallback(async () => {
    if (!hasAccessToken || !accessToken) {
      setBalance(null);
      return;
    }
    setBalanceLoading(true);
    setError("");
    try {
      const result = await PointsAPI.getBalance(accessToken);
      setBalance(result?.balance ?? result?.point ?? result);
    } catch (err) {
      setError(err?.message || "포인트 정보를 불러오지 못했습니다.");
    } finally {
      setBalanceLoading(false);
    }
  }, [accessToken, hasAccessToken]);

  useEffect(() => {
    // 탭이 활성화되고 인증 토큰이 있을 때만 잔액을 조회합니다.
    if (isActive && hasAccessToken) {
      fetchBalance();
    }
  }, [isActive, hasAccessToken, fetchBalance]);

  const handleCharge = useCallback(
    async (event) => {
      event.preventDefault();
      setSuccess("");
      setError("");
      const normalizedAmount = Number(chargeAmount);
      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        setError("충전 금액을 올바르게 입력해 주세요.");
        return;
      }
      if (!hasAccessToken || !accessToken) {
        setError("로그인 후 이용해 주세요.");
        return;
      }
      setChargeLoading(true);
      try {
        await PointsAPI.charge(normalizedAmount, accessToken);
        setSuccess(`${normalizedAmount.toLocaleString()}P 충전이 완료되었습니다.`);
        setChargeAmount("");
        fetchBalance();
      } catch (err) {
        setError(err?.message || "포인트 충전에 실패했습니다.");
      } finally {
        setChargeLoading(false);
      }
    },
    [chargeAmount, hasAccessToken, accessToken, fetchBalance]
  );

  const handlePay = useCallback(
    async (event) => {
      event.preventDefault();
      setSuccess("");
      setError("");
      const normalizedAmount = Number(payAmount);
      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        setError("결제 금액을 올바르게 입력해 주세요.");
        return;
      }
      if (!hasAccessToken || !accessToken) {
        setError("로그인 후 이용해 주세요.");
        return;
      }
      setPayLoading(true);
      try {
        // 백엔드 결제 API를 호출해 포인트 잔액을 차감합니다.
        await PointsAPI.pay(normalizedAmount, accessToken);
        setSuccess(`${normalizedAmount.toLocaleString()}P 결제가 완료되었습니다.`);
        setPayAmount("");
        fetchBalance();
      } catch (err) {
        setError(err?.message || "포인트 결제에 실패했습니다.");
      } finally {
        setPayLoading(false);
      }
    },
    [payAmount, hasAccessToken, accessToken, fetchBalance]
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">포인트 현황</h2>
        <p className="mt-1 text-3xl font-bold">
          {balanceLoading ? "로딩 중…" : `${parsedBalance} P`}
        </p>
        <p className="text-sm text-muted-foreground">
          포인트는 결제나 보상 등 다양한 곳에서 사용할 수 있어요.
        </p>
      </div>

      <form className="space-y-3" onSubmit={handleCharge}>
        <label className="block text-sm font-medium text-gray-700" htmlFor="chargeAmount">
          충전 금액
        </label>
        <div className="flex gap-2">
          <Input
            id="chargeAmount"
            type="number"
            min="1000"
            step="100"
            placeholder="예: 10000"
            value={chargeAmount}
            onChange={(event) => setChargeAmount(event.target.value)}
            className="flex-1"
            disabled={!hasAccessToken || chargeLoading}
          />
          <Button
            type="submit"
            disabled={!hasAccessToken || chargeLoading}
            className="flex items-center gap-2"
          >
            {chargeLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4" />
            )}
            {chargeLoading ? "충전 중" : "충전하기"}
          </Button>
        </div>
      </form>

      {/* 잔액을 사용한 결제를 위한 두 번째 폼입니다. */}
      <form className="space-y-3" onSubmit={handlePay}>
        <label className="block text-sm font-medium text-gray-700" htmlFor="payAmount">
          결제 금액
        </label>
        <div className="flex gap-2">
          <Input
            id="payAmount"
            type="number"
            min="100"
            step="100"
            placeholder="예: 5000"
            value={payAmount}
            onChange={(event) => setPayAmount(event.target.value)}
            className="flex-1"
            disabled={!hasAccessToken || payLoading}
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={!hasAccessToken || payLoading}
            className="flex items-center gap-2"
          >
            {payLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {payLoading ? "결제 중" : "포인트 결제"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          * 포인트 결제는 잔액 범위 내에서만 가능하며, 부족할 경우 서버에서 오류를 반환합니다.
        </p>
      </form>

      {!hasAccessToken && (
        <p className="text-sm text-muted-foreground">
          로그인 후 포인트를 확인하고 충전할 수 있습니다.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </div>
  );
}
