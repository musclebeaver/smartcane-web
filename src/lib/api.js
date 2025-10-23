const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export async function api(path, { method = "GET", body, access } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (access) {
    // 백엔드가 이미 "Bearer " 접두사가 붙은 토큰을 내려주는 경우가 있어 중복을 방지합니다.
    const normalized = access.startsWith("Bearer ") ? access : `Bearer ${access}`;
    headers["Authorization"] = normalized;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = { message: text }; }
  if (!res.ok) throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  return json;
}

export const AuthAPI = {
  signup:  (payload)       => api("/api/auth/signup",  { method: "POST", body: payload }),
  login:   (payload)       => api("/api/auth/login",   { method: "POST", body: payload }),
  refresh: (refreshToken)  => api("/api/auth/refresh", { method: "POST", body: { refreshToken } }),
  me:      (access)        => api("/api/identity/me",  { access }),
};

export const PaymentsAPI = {
  getTossAutopayUrl: (access) => api("/api/payments/toss/autopay", { access }),
};

export const PointsAPI = {
  // 백엔드 PointController의 "/api/points/me" 엔드포인트에 맞춰 조회 경로를 수정했습니다.
  getBalance: (access) => api("/api/points/me", { access }),
  // 지정된 금액만큼 포인트를 충전하는 엔드포인트를 호출합니다.
  charge: (amount, access) =>
    api("/api/points/charge", { method: "POST", body: { amount }, access }),
  // 결제 요청이 들어오면 백엔드의 포인트 차감 로직을 호출합니다.
  pay: (amount, access) =>
    api("/api/points/pay", { method: "POST", body: { amount }, access }),
};

export const DevicesAPI = {
  // 사용자별 디바이스 바인딩 목록을 조회하도록 엔드포인트를 변경했습니다.
  list:    (userId, access) => {
    if (!userId) throw new Error("사용자 ID가 필요합니다.");
    return api(`/api/users/${encodeURIComponent(userId)}/device-bindings`, { access });
  },
  detail:  (deviceId, access) => api(`/api/devices/${deviceId}`, { access }),
  register: (payload, access) => api("/api/devices",          { method: "POST", body: payload, access }),
  remove:  (deviceId, access) => api(`/api/devices/${deviceId}`, { method: "DELETE", access }),
};

// 관리자가 회원을 조회/등록/정지할 수 있도록 전용 API 래퍼를 추가합니다.
export const AdminAPI = {
  listUsers: (access) => api("/api/admin/users", { access }),
  createUser: (payload, access) => api("/api/admin/users", { method: "POST", body: payload, access }),
  updateUserStatus: (userId, status, access) =>
    api(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
      method: "PATCH",
      body: { status },
      access,
    }),
};
