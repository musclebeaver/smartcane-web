import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthAPI } from "@/lib/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("sc_access") || "");
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("sc_refresh") || "");
  const [me, setMe] = useState(null);

  const saveTokens = (a, r) => {
    setAccessToken(a || ""); setRefreshToken(r || "");
    if (a) localStorage.setItem("sc_access", a); else localStorage.removeItem("sc_access");
    if (r) localStorage.setItem("sc_refresh", r); else localStorage.removeItem("sc_refresh");
  };
  const logout = () => { saveTokens("", ""); setMe(null); };

  const loadMe = async () => {
    if (!accessToken) { setMe(null); return; }
    try {
      const data = await AuthAPI.me(accessToken);
      setMe(data);
    } catch (e) {
      if (refreshToken) {
        try {
          const ref = await AuthAPI.refresh(refreshToken);
          saveTokens(ref.accessToken, ref.refreshToken);
          const data2 = await AuthAPI.me(ref.accessToken);
          setMe(data2);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    }
  };

  useEffect(() => { loadMe(); /* eslint-disable-next-line */ }, [accessToken]);

  const value = useMemo(
    () => ({ accessToken, refreshToken, me, saveTokens, logout, reloadMe: loadMe }),
    [accessToken, refreshToken, me]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
