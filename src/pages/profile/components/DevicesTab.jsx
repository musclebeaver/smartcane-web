import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DevicesAPI } from "@/lib/api";
import { Loader2 } from "lucide-react";

// 디바이스 목록과 등록/삭제를 모두 담당하는 탭입니다.
const IDENTIFIER_OPTIONS = [
  { value: "deviceId", label: "디바이스 ID" },
  { value: "serialNumber", label: "시리얼 번호" },
  { value: "uuid", label: "UUID" },
];

const normaliseDeviceList = (payload) => {
  // 백엔드에서 내려오는 다양한 포맷을 통일시키기 위한 함수입니다.
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.devices)) return payload.devices;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (payload?.device && typeof payload.device === "object") return [payload.device];
  if (typeof payload === "object") {
    if ("id" in payload || "deviceId" in payload || "serialNumber" in payload) {
      return [payload];
    }
  }
  return [];
};

export default function DevicesTab({ isActive, hasAccessToken, accessToken, renderValue, userId }) {
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState("");
  const [devicesFetched, setDevicesFetched] = useState(false);

  const [identifierType, setIdentifierType] = useState(IDENTIFIER_OPTIONS[0].value);
  const [identifierValue, setIdentifierValue] = useState("");
  const [metadata, setMetadata] = useState("");
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [registering, setRegistering] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  // 액세스 토큰이 바뀌면 디바이스 상태를 초기화합니다.
  useEffect(() => {
    setDevices([]);
    setDevicesError("");
    setDevicesFetched(false);
  }, [accessToken]);

  useEffect(() => {
    if (!isActive) return;
    if (!hasAccessToken) return;
    if (!userId) return; // 사용자 ID 를 확보한 뒤에만 조회하도록 가드합니다.
    if (devicesFetched) return;

    let cancelled = false;

    const fetchDevices = async () => {
      setDevicesLoading(true);
      setDevicesError("");
      try {
        const response = await DevicesAPI.list(userId, accessToken);
        if (cancelled) return;
        const list = normaliseDeviceList(response);
        setDevices(Array.isArray(list) ? list : []);
      } catch (error) {
        if (cancelled) return;
        setDevicesError(error?.message || "디바이스 정보를 불러오지 못했습니다.");
        setDevices([]);
      } finally {
        if (!cancelled) {
          setDevicesLoading(false);
          setDevicesFetched(true);
        }
      }
    };

    fetchDevices();

    return () => {
      cancelled = true;
    };
  }, [accessToken, devicesFetched, hasAccessToken, isActive, userId]);

  const refreshDevices = () => {
    // 목록 새로고침을 단순하게 처리하기 위해 fetched 상태만 초기화합니다.
    setDevicesFetched(false);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!identifierValue.trim()) {
      setFormNotice("");
      setFormError("식별 값을 입력해주세요.");
      return;
    }

    let extraPayload = {};
    if (metadata.trim()) {
      try {
        const parsed = JSON.parse(metadata);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("객체 형태의 JSON 을 입력해주세요.");
        }
        extraPayload = parsed;
      } catch (error) {
        setFormNotice("");
        setFormError(error?.message || "추가 정보는 JSON 으로 입력해주세요.");
        return;
      }
    }

    setRegistering(true);
    setFormError("");
    setFormNotice("");
    try {
      const payload = {
        [identifierType]: identifierValue.trim(),
        ...extraPayload,
      };
      await DevicesAPI.register(payload, accessToken);
      setIdentifierValue("");
      setMetadata("");
      setFormNotice("디바이스가 성공적으로 등록되었습니다.");
      refreshDevices();
    } catch (error) {
      setFormError(error?.message || "디바이스 등록에 실패했습니다.");
    } finally {
      setRegistering(false);
    }
  };

  const handleRemove = async (device) => {
    const id = device?.id ?? device?.deviceId ?? device?.serialNumber ?? device?.uuid;
    if (!id) {
      setDevicesError("삭제할 디바이스의 식별자를 찾지 못했습니다.");
      return;
    }

    setRemovingId(String(id));
    setDevicesError("");
    try {
      await DevicesAPI.remove(id, accessToken);
      refreshDevices();
    } catch (error) {
      setDevicesError(error?.message || "디바이스 삭제에 실패했습니다.");
    } finally {
      setRemovingId(null);
    }
  };

  const identifierOptions = useMemo(() => IDENTIFIER_OPTIONS, []);

  if (!hasAccessToken) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        디바이스 정보를 확인하려면 로그인 후 이용해주세요.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">디바이스 등록</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            * 최소한 하나의 식별 값(디바이스 ID, 시리얼 번호 등)을 입력하면 됩니다. 필요하다면 JSON 으로 추가 속성을 함께 전송할 수 있습니다.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="identifierType">식별자 종류</Label>
              <select
                id="identifierType"
                value={identifierType}
                onChange={(event) => setIdentifierType(event.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {identifierOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="identifierValue">식별 값</Label>
              <Input
                id="identifierValue"
                value={identifierValue}
                onChange={(event) => setIdentifierValue(event.target.value)}
                placeholder="예: SC-000001"
                disabled={registering}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata">추가 속성 (JSON)</Label>
            <textarea
              id="metadata"
              value={metadata}
              onChange={(event) => setMetadata(event.target.value)}
              placeholder='{"nickname": "거실용"}'
              disabled={registering}
              className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">비워두면 기본 식별 정보만 전송합니다.</p>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
          {formNotice && <p className="text-sm text-emerald-600">{formNotice}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={registering}>
              {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {registering ? "등록 중..." : "디바이스 등록"}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">등록된 디바이스</h3>
          <Button type="button" variant="outline" size="sm" onClick={refreshDevices} disabled={devicesLoading}>
            새로고침
          </Button>
        </div>

        {devicesLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">디바이스 정보를 불러오는 중…</span>
          </div>
        ) : devicesError ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-red-600">{devicesError}</p>
            <Button variant="outline" onClick={refreshDevices} disabled={devicesLoading}>
              다시 시도
            </Button>
          </div>
        ) : devices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">등록된 디바이스가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {devices.map((device, index) => {
              const entries =
                device && typeof device === "object" ? Object.entries(device) : [["value", device]];
              const key =
                device?.id ?? device?.deviceId ?? device?.serialNumber ?? device?.uuid ?? index;
              const removable = Boolean(device?.id || device?.deviceId || device?.serialNumber || device?.uuid);

              return (
                <div key={key} className="overflow-hidden rounded-xl border border-gray-100 p-4">
                  <dl className="space-y-2">
                    {entries.map(([entryKey, entryValue]) => (
                      <div
                        key={entryKey}
                        className="flex flex-col gap-1 text-left sm:flex-row sm:items-start sm:justify-between"
                      >
                        <dt className="text-sm font-medium text-gray-500">{entryKey}</dt>
                        <dd className="text-sm font-semibold text-gray-900 sm:text-right">
                          {renderValue(entryValue)}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {removable && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleRemove(device)}
                        disabled={removingId === String(key)}
                      >
                        {removingId === String(key) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        삭제
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
