const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export async function api(path, { method = "GET", body, access } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (access) headers["Authorization"] = `Bearer ${access}`;
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
